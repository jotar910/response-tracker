import {defineStore} from 'pinia'
import {ChromeTools, DEFAULT_HOST, DEFAULT_PORT, responseToRaw} from '../utils/utils';

const MAX_HISTORY = 5;
const MAX_SAVED = 5;

let ID_STORE = 0;

export const useMainStore = defineStore('main', {
  state() {
    return {
      /** @type {boolean} */
      isOn: true,
      /** @type {StoreDefinition<'pattern'>[]} */
      patterns: [],
      /** @type {Map<string, StoreDefinition<'result'>>} */
      customResults: new Map(),
      /** @type {Map<string, {store: StoreDefinition<'result'>, patterns: Set<string>}>} */
      results: new Map(),
      /** @type {'on'|'off'|'error'|'loading'|null} */
      serverStatus: null,
      /** @type {number} */
      serverPort: DEFAULT_PORT
    }
  },
  getters: {
    customResultsList: state => Array.from(state.customResults.values())
  },
  actions: {
    async load() {
      /** @type {IStorage} */
      const storageValue = await ChromeTools.loadState();
      this.isOn = storageValue.isOn;

      if (this.isOn) {
        this.checkServerStatus(storageValue.port);
      } else {
        this.serverPort = storageValue;
        this.serverStatus = 'off';
      }

      for (const {url, response} of storageValue.customResults) {
        const result = this._addCustomResult(url);
        result.addResponse(response);
        result.addSavedResponse(0);
        if (this.isOn) {
          result.useResponse(0);
        } else {
          result.setUsingIndex(0);
        }
      }

      const patternsMap = new Map();
      for (const {pattern} of storageValue.patterns) {
        patternsMap.set(pattern, this._addPattern(pattern));
      }

      for (const resultIn of storageValue.results) {
        for (const patternStr of resultIn.patterns) {
          const pattern = patternsMap.get(patternStr);
          pattern.addResponseUrl(resultIn.url);

          const result = this._addResult(resultIn.url);

          for (const response of resultIn.history) {
            result.store.addResponse(response);
          }

          for (const response of resultIn.saved) {
            result.store.addNewSavedResponse(response);
          }

          if (resultIn.using === -1) {
            continue;
          }

          const savedIndex = resultIn.using;
          if (this.isOn && !this.customResults.has(resultIn.url)) {
            result.store.useResponse(savedIndex);
          } else {
            result.store.setUsingIndex(savedIndex);
          }
        }
      }
    },
    async save() {
      /** @type {IStorage} */
      const state = {
        isOn: this.isOn,
        port: this.serverPort,
        patterns: this.patterns.map(({patternStr}) => ({pattern: patternStr})),
        results: Array.from(this.results.entries()).map(([url, {store: result, patterns: patternsSet}]) => {
          return {
            url,
            patterns: Array.from(patternsSet),
            using: result.usingIndex,
            history: result.history.map(responseToRaw),
            saved: result.saved.map(responseToRaw)
          };
        }),
        customResults: Array.from(this.customResults.entries()).map(([url, result]) => {
          const response = result.history[0];
          return {
            url,
            response: responseToRaw(response)
          };
        })
      };
      return ChromeTools.saveState(state);
    },
    /** @param on{boolean} */
    setOnOff(on) {
      this.isOn = on;

      if (this.isOn) {
        for (const result of this.customResults.values()) {
          result.checkUsingResponse();
        }
        for (const result of this.results.values()) {
          result.store.checkUsingResponse();
        }
        this.checkServerStatus();
        return;
      }

      for (const result of this.customResults.values()) {
        result.remUsingResponse();
      }
      for (const result of this.results.values()) {
        result.store.remUsingResponse();
      }
      this.serverStatus = 'off';
    },
    checkServerStatus(port = this.serverPort) {
      this.serverPort = port;

      if (!this.isOn) {
        return;
      }

      if (!port || isNaN(port)) {
        this.serverStatus = 'error';
        return;
      }

      this.serverStatus = 'loading';
      fetch(`https://${DEFAULT_HOST}:${port}/health`)
        .then(async response => {
          // check for error response
          if (!response.ok) {
            this.serverStatus = response.status === 404 ? 'off' : 'error';
            return;
          }

          this.serverStatus = 'on';
        })
        .catch(() => this.serverStatus = 'error');
    },
    /**
     * @param pattern{string}
     * @return {StoreDefinition<'pattern'>}
     */
    addPattern(pattern) {
      for (const p of this.patterns) {
        if (p.patternStr === pattern) {
          return p;
        }
      }
      return this._addPattern(pattern);
    },
    /**
     * @param url{string}
     * @param item{IResponse}
     * @return {Promise<void>}
     */
    async addCustomResult(url, item) {
      const result = this._addCustomResult(url);
      if (this.results.has(url)) {
        await this.results.get(url).store.remUsingResponse();
      }
      result.addResponse(item);
      result.addSavedResponse(0);
      return result.useResponse(0);
    },
    /** @param patternIndex{number} */
    remPattern(patternIndex) {
      const patternToRemove = this.patterns[patternIndex];
      for (const url of patternToRemove.urls) {
        const result = this.results.get(url);
        if (result.patterns.size > 1) {
          result.patterns.delete(patternToRemove.patternStr);
          continue;
        }
        result.patterns.clear();
        result.store.clearResponses();
        this.results.delete(url);
      }
      patternToRemove.clearPattern();
      this.patterns.splice(patternIndex, 1);
    },
    /** @param url{string} */
    async remCustomResult(url) {
      const result = this.customResults.get(url);
      result.clearResponses();
      this.customResults.delete(url);
      if (this.results.has(url)) {
        await this.results.get(url).store.checkUsingResponse();
      }
    },
    clearAll() {
      const patternsList = [];
      for (const pattern of this.patterns) {
        patternsList.push(pattern.patternStr);
        pattern.clearPattern();
      }
      this.patterns.length = 0;

      for (const [, customResult] of this.customResults.entries()) {
        customResult.clearResponses();
      }
      this.customResults.clear();

      for (const [, result] of this.results.entries()) {
        result.store.clearResponses();
      }
      this.results.clear();

      return patternsList;
    },
    /**
     * @param {string}url
     * @return {StoreDefinition<'result'>}
     */
    getResult(url) {
      return this.results.get(url).store;
    },
    /**
     * @param {string}url
     * @return {boolean}
     */
    hasCustomResponse(url) {
      return this.customResults.has(url);
    },
    /**
     * @param url{string}
     * @param response{IResponse}
     * @return {Promise<StoreDefinition<'result'>>}
     */
    async handleRequest(url, response) {
      if (!this.isOn || this.hasCustomResponse(url)) {
        return null;
      }

      const matchPatterns = [];

      for (const value of this.patterns) {
        if (value.pattern.test(url) && !url.startsWith(`https://${DEFAULT_HOST}:${this.serverPort}`)) {
          value.addResponseUrl(url);
          matchPatterns.push(value.patternStr);
        }
      }

      if (!matchPatterns.length) {
        return null;
      }

      const result = this._addResult(url);
      for (const matchPattern of matchPatterns) {
        result.patterns.add(matchPattern);
      }
      result.store.addResponse(response);
      return result.store;
    },
    /**
     * @param pattern{string}
     * @return {StoreDefinition<'pattern'>}
     */
    _addPattern(pattern) {
      const store = usePatternStore(ID_STORE++);
      store.setPattern(pattern);
      this.patterns.push(store);
      return store;
    },
    /**
     * @param url{string}
     * @return {{store: StoreDefinition<'result'> | any, patterns: Set<string>}}
     */
    _addResult(url) {
      let result = this.results.get(url);
      if (!result) {
        result = {store: useResultStore(ID_STORE++), patterns: new Set()};
        result.store.setUrl(url);
        this.results.set(url, result);
      }
      return result;
    },
    /**
     * @param url{string}
     * @return {StoreDefinition<'result'> | any}
     */
    _addCustomResult(url) {
      let result = this.customResults.get(url);
      if (!result) {
        result = useResultStore(ID_STORE++);
        result.setUrl(url);
        this.customResults.set(url, result);
      } else {
        result.clearResponses();
      }
      return result;
    }
  }
});

export const usePatternStore = (id) => (defineStore(`pattern-${id}`, {
  state() {
    return {
      /** @type {RegExp} */
      pattern: null,
      /** @type {string} */
      patternStr: '',
      /** @type {string[]} */
      urls: null,
      /** @type {Set<string>} */
      urlsSet: null
    }
  },
  actions: {
    /** @param pattern{string} */
    setPattern(pattern) {
      if (this.pattern) {
        this._destroyPattern();
      }
      this.pattern = new RegExp(pattern);
      this.patternStr = pattern;
      this._initPattern();
    },
    clearPattern() {
      this._destroyPattern();
      this.patternStr = '';
      this.pattern = null;
    },
    /**
     * @param url{string}
     */
    addResponseUrl(url) {
      if (!this.urlsSet.has(url)) {
        this.urls.push(url);
        this.urlsSet.add(url);
      }
    },
    _initPattern() {
      this.urlsSet = new Set();
      this.urls = [];
    },
    _destroyPattern() {
      this.urls = null;
      this.urlsSet.clear();
      this.urlsSet = null;
    }
  }
})());

export const useResultStore = (id) => (defineStore(`result-${id}`, {
  state() {
    return {
      /** @type {string} */
      url: '',
      /** @type {IResponse[]} */
      history: [],
      /** @type {IResponse[]} */
      saved: [],
      /** @type {number} */
      usingIndex: -1,
      /** @type {number[]} */
      rulesId: []
    }
  },
  actions: {
    /** @param url{string} */
    setUrl(url) {
      this.url = url;
    },
    /** @param response{IResponse} */
    addResponse(response) {
      if (this.history.length >= MAX_HISTORY) {
        this.history = this.history.slice(1);
      }
      this.history.push(response);
    },
    /**
     * @param response{IResponse}
     * @return {number}
     */
    addNewSavedResponse(response) {
      if (this.saved.length < MAX_SAVED) {
        this.saved.push(response);
      }
    },
    /** @param historyIndex{number} */
    addSavedResponse(historyIndex) {
      if (this.saved.length < MAX_SAVED) {
        this.saved.unshift({...this.history[historyIndex], date: new Date().getTime()});
      }
    },
    clearResponses() {
      if (this.usingIndex !== -1) {
        this.rulesId.forEach(ruleId => ChromeTools.clearRule(ruleId));
        this.usingIndex = -1;
      }
      this.saved.length = 0;
      this.history.length = 0;
      this.rulesId.length = 0;
    },
    /** @param saveIndex{number} */
    remSavedResponse(saveIndex) {
      if (saveIndex === this.usingIndex) {
        this.rulesId.forEach(ruleId => ChromeTools.clearRule(ruleId));
        this.usingIndex = -1;
      }
      this.saved.splice(saveIndex, 1);
    },
    /** @param index{number} */
    setUsingIndex(index) {
      this.usingIndex = index;
    },
    async checkUsingResponse() {
      if (this.usingIndex === -1 || this.rulesId.length) {
        return;
      }
      return this._addResponseRules();
    },
    async remUsingResponse() {
      if (this.usingIndex !== -1) {
        this.rulesId.forEach(ruleId => ChromeTools.clearRule(ruleId));
        this.rulesId = [];
      }
    },
    /** @param savedIndex{number} */
    async useResponse(savedIndex) {
      if (this.usingIndex !== -1) {
        this.rulesId.forEach(ruleId => ChromeTools.clearRule(ruleId));
        this.rulesId = [];
      }

      this.usingIndex = this.usingIndex === savedIndex ? -1 : savedIndex;

      if (this.usingIndex !== -1) {
        await this._addResponseRules();
      }
    },
    /** @param value{{index: number, body: string}} */
    async editResponse({index, body}) {
      const response = this.saved[index];
      response.body = body;
      response.date = new Date().getTime();
      if (index === this.usingIndex) {
        await this._editResponseRules();
      }
    },
    async _addResponseRules() {
      const response = this.saved[this.usingIndex];
      this.rulesId = [
        await ChromeTools.addRule(this.url, response, 'modifyHeaders'),
        await ChromeTools.addRule(this.url, response, 'redirect')
      ];
    },
    async _editResponseRules() {
      await ChromeTools.editRule(this.rulesId[1], this.url, this.saved[this.usingIndex], 'redirect');
      await ChromeTools.editRule(this.rulesId[0], this.url, this.saved[this.usingIndex], 'modifyHeaders');
    }
  },
})());
