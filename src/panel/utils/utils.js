import {toRaw} from "vue";
import {useMainStore} from "../store/store";

export const DEFAULT_PORT = 3000;
export const DEFAULT_HOST = 'localhost';

const regExpSyntaxCharacter = /[\^$\\.*+?()[\]{}|]/g;
const DATABASE_NAME = 'ResponseTracker';
const STORAGE_ON_OFF_KEY = 'ResponseTracker::on';
const STORAGE_PORT_KEY = 'ResponseTracker::port';

export const escapeRegex = (value) => {
  return value.replace(regExpSyntaxCharacter, "\\$&");
}

/**
 * @param value{string}
 * @param char{string}
 * @return {string}
 */
export const trimRight = (value, char = ' ') => {
  if (!value.length || value[value.length - 1] !== char) {
    return value;
  }
  let i = value.length - 1;
  while (i > -1 && value[i] === char) {
    --i;
  }
  return value.slice(0, i + 1);
}

/**
 * @param value{string}
 * @param char{string}
 * @return {string}
 */
export const keepUntil = (value, char = ' ') => {
  for (let i = 0; i < value.length; ++i) {
    if (value[i] === char) {
      return value.slice(0, i);
    }
  }
  return value;
}

/**
 * @param response{IResponse}
 * @return {IResponse}
 */
export const responseToRaw = (response) => {
  return toRaw({
    ...response,
    headers: toRaw(response.headers.map(toRaw))
  });
}

export class Factory {
  /**
   * @param response{Response}
   * @param body{string}
   * @return {IResponse}
   */
  static createResponse(response, body) {
    return {
      body,
      date: Date.now(),
      headers: response.headers,
      status: response.status,
      type: response.headers.find((header) => header.name === 'content-type')?.value.split(';')[0] || 'text/json'
    }
  }

  /**
   * @return {IHeader}
   */
  static emptyHeader() {
    return {
      name: '',
      value: ''
    };
  }

  /**
   * @return {IResponse}
   */
  static emptyResponse() {
    return {
      body: '',
      date: 0,
      headers: [Factory.emptyHeader()],
      status: 200,
      type: 'text/json'
    };
  }

  /**
   * @return {ICustomResponse}
   */
  static emptyCustomResponse() {
    return {
      url: '',
      ...Factory.emptyResponse()
    };
  }

  /**
   * @param headers{IHeader[]}
   * @return {{[key: string]: string}}
   */
  static createHeaders(headers = []) {
    const res = {};
    for (const {name, value} of headers) {
      if (name) {
        res[name] = value;
      }
    }
    return res;
  }
}

export class ChromeTools {

  /**
   * @type {number}
   */
  static ID_COUNT = 1;

  /**
   * @param {string} urlFilter
   * @param {IResponse} response
   * @param {'redirect'|'modifyHeaders'} type
   * @return {Promise<number>}
   */
  static addRule(urlFilter, response, type) {
    const id = ChromeTools.ID_COUNT++;
    return new Promise((resolve) =>
      chrome.declarativeNetRequest.updateDynamicRules({
        addRules: [ChromeTools._ruleDefinition(id, urlFilter, response, type)]
      }, () => resolve(id))
    );
  }

  /**
   * @param {number} ruleId
   * @param {string} urlFilter
   * @param {IResponse} response
   * @param {'redirect'|'modifyHeaders'} type
   * @return {Promise<void>}
   */
  static editRule(ruleId, urlFilter, response, type) {
    return new Promise((resolve) =>
      chrome.declarativeNetRequest.updateDynamicRules({
        addRules: [ChromeTools._ruleDefinition(ruleId, urlFilter, response, type)],
        removeRuleIds: [ruleId]
      }, () => resolve())
    );
  }

  static getAllRules() {
    return new Promise((resolve) =>
      chrome.declarativeNetRequest.getDynamicRules((curRules) => {
        resolve(curRules);
      })
    );
  }

  /**
   * @param id{number}
   * @return {Promise<void>}
   */
  static clearRule(id) {
    return new Promise((resolve) =>
      chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: [id],
      }, () => resolve())
    );
  }

  static clearAllRules() {
    return new Promise((resolve) =>
      chrome.declarativeNetRequest.getDynamicRules((curRules) => {
        chrome.declarativeNetRequest.updateDynamicRules({
          removeRuleIds: curRules.map((rule) => rule.id),
        }, () => resolve(curRules));
      })
    );
  }

  /** @return {IStorage}  */
  static async loadState() {
    /** @type {IStorage}  */
    const state = {
      isOn: localStorage.getItem(STORAGE_ON_OFF_KEY) === 'true',
      port: +(localStorage.getItem(STORAGE_PORT_KEY) || DEFAULT_PORT),
      patterns: [],
      results: [],
      customResults: []
    };

    const dbRequest = ChromeTools._openDatabase();

    await new Promise((resolve) => {
      dbRequest.onsuccess = async (event) => {
        const db = event.target.result;
        const tx = db.transaction(['patterns', 'results', 'customResults']);

        const handleCursor = (objectStoreName, targetArray) => {
          return new Promise((resolve, reject) => {
            const objectStore = tx.objectStore(objectStoreName);
            const cursorHandler = objectStore.openCursor();
            cursorHandler.onsuccess = (event) => {
              const cursor = event.target.result;
              if (cursor) {
                targetArray.push(cursor.value);
                cursor.continue();
              } else {
                resolve();
              }
            };
            cursorHandler.onerror = () => reject();
          });
        };

        await Promise.all([
          handleCursor('patterns', state.patterns),
          handleCursor('results', state.results),
          handleCursor('customResults', state.customResults)
        ]);

        tx.oncomplete = (event) => {
          console.debug('Transaction completed: database retrieval finished.', event);
          resolve();
        };

        tx.onerror = (event) => {
          console.debug('Transaction not completed due to error. Database retrieval could not be completed.', event);
          resolve();
        };

        return tx.complete;
      };

      dbRequest.onerror = () => resolve();
    });

    return state;
  }

  /** @param state{IStorage}  */
  static async saveState(state) {
    const dbRequest = ChromeTools._openDatabase();

    await new Promise((resolve) => {
      dbRequest.onsuccess = (event) => {
        const db = event.target.result;
        console.debug('Adding data to database', db.objectStoreNames);

        const tx = db.transaction(['patterns', 'results', 'customResults'], 'readwrite');
        const patternsStore = tx.objectStore('patterns');
        for (const item of state.patterns) {
          patternsStore.put(item);
        }
        const resultsStore = tx.objectStore('results');
        for (const item of state.results) {
          resultsStore.put(item);
        }
        const customResultsStore = tx.objectStore('customResults');
        for (const item of state.customResults) {
          customResultsStore.put(item);
        }

        tx.oncomplete = (event) => {
          localStorage.setItem(STORAGE_ON_OFF_KEY, state.isOn ? 'true' : 'false');
          localStorage.setItem(STORAGE_PORT_KEY, `${state.port}`);
          console.debug('Transaction completed: database modification finished.', event);
          resolve();
        };

        tx.onerror = (event) => {
          console.debug('Transaction not completed due to error. Duplicate items not allowed.', event);
          resolve();
        };

        return tx.complete;
      };

      dbRequest.onerror = () => resolve();
    });
  }

  /** @return {IDBOpenDBRequest} */
  static _openDatabase() {
    const createObjectStores = (db) => {
      if (!db.objectStoreNames.contains('patterns')) {
        db.createObjectStore('patterns', {keyPath: 'pattern'});
      }

      if (!db.objectStoreNames.contains('results')) {
        db.createObjectStore('results', {keyPath: 'url'});
      }

      if (!db.objectStoreNames.contains('customResults')) {
        db.createObjectStore('customResults', {keyPath: 'url'});
      }
    };

    const dbRequest = indexedDB.open(DATABASE_NAME, 1, () => {
      console.debug('Connected to database');
    });

    dbRequest.onupgradeneeded = (event) => {
      const db = event.target.result;
      createObjectStores(db);
    };

    return dbRequest;
  }

  /**
   * @param {number} id
   * @param {string} urlFilter
   * @param {IResponse} response
   * @param {'redirect'|'modifyHeaders'} type
   */
  static _ruleDefinition(id, urlFilter, response, type) {
    return {
      id,
      priority: 1,
      action: this._ruleDefinitionAction(response, type),
      condition: {
        regexFilter: (type === 'redirect' ? '^' : '') + escapeRegex(keepUntil(trimRight(urlFilter, '/'), '?')) + '(\\?(.)+)?$',
        resourceTypes: [
          'csp_report', 'font', 'image', 'main_frame', 'media', 'object', 'other', 'ping', 'script',
          'stylesheet', 'sub_frame', 'webbundle', 'websocket', 'webtransport', 'xmlhttprequest'
        ]
      }
    };
  }

  /**
   * @param {IResponse} response
   * @param {'redirect'|'modifyHeaders'} type
   */
  static _ruleDefinitionAction(response, type) {
    switch (type) {
      case 'redirect':
        return {
          type: "redirect",
          redirect: {
            regexSubstitution: `https://${DEFAULT_HOST}:${useMainStore().serverPort}?from=\\0`
          }
        };
      case 'modifyHeaders':
        return {
          type: "modifyHeaders",
          requestHeaders: [{
            operation: 'set',
            header: 'x-definition',
            value: JSON.stringify({
              status: response.status,
              response: response.body,
              headers: Factory.createHeaders(response.headers)
            })
          }]
        };
      default:
        return null;
    }
  }
}
