chrome.devtools.panels.create("Response Tracker", null, 'panel/panel.html');

/**
 * @param req{{request: Request, getContent: Function}}
 */

/*const handleOnRequestFinished = (req) => {
  req?.getContent((body) => {
    if (!req.request) {
      return;
    }
    const {request} = req;
    chrome.runtime.sendMessage({
      type: 'response',
      message: {
        url: request.url,
        response: body
      }
    });
  });
};

async function clearAllRules() {
  console.log('clear', chrome.declarativeNetRequest);
  const curRules = await new Promise((resolve) =>
    chrome.declarativeNetRequest.getDynamicRules(resolve)
  );
  chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: curRules.map((rule) => rule.id),
  });
}

clearAllRules()
  .then(() => {
    chrome.declarativeNetRequest.updateDynamicRules({
      addRules: [
        {
          id: 1,
          priority: 1,
          action: {
            type: "redirect",
            redirect: {
              url: `data:text/json;base64,eyJ0ZXN0IjogdHJ1ZX0=`
            }
          },
          condition: {urlFilter: `https://www.google.com/!*`},
        }
      ]
    });
  });


chrome.devtools.network.onRequestFinished.addListener(handleOnRequestFinished);

chrome.management.onDisabled?.addListener(() => {
  console.debug('Management event: onDisabled');
  chrome.devtools.network.onRequestFinished.removeListener(handleOnRequestFinished);
});*/

/*class Factory {
  /!**
   * @param req{Request}
   * @param body{string}
   * @return {IResponse}
   *!/
  static createResponse(req, body) {
    return {
      body,
      date: Date.now(),
      headers: Factory.createHeaders(req.headers),
      status: 200
    }
  }

  /!**
   * @param headers{Headers}
   * @return {IHeader[]}
   *!/
  static createHeaders(headers) {
    const res = [];
    for (const [key, value] of headers.entries()) {
      res.push({key, value});
    }
    return res;
  }
}

class ChromeTools {

  /!**
   * @type {number}
   *!/
  static ID_COUNT = 1;

  static addRule(urlFilter = 'https://www.google.com/!*', mediaType = 'text/json', data = 'eyJ0ZXN0IjogdHJ1ZX0=') {
    const id = ChromeTools.ID_COUNT++;
    return new Promise((resolve) =>
      chrome.declarativeNetRequest.updateDynamicRules({
        addRules: [
          {
            id,
            priority: 1,
            action: {
              type: "redirect",
              redirect: {
                url: `data:${mediaType};base64,${data}`
              }
            },
            condition: {urlFilter},
          }
        ]
      }, () => resolve(id))
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
}

class ResponseTracker {

  /!**
   * @type {Pattern[]}
   *!/
  patterns = [];

  /!**
   * @param req{chrome.devtools.network.Request}
   *!/
  _handleOnRequestFinished = (req) => {
    req?.getContent((body) => {
      if (req.request) {
        this._handleRequest(req.request, body);
      }
      /!*const {request} = req;
      chrome.runtime.sendMessage({
        type: 'response',
        message: {
          url: request.url,
          response: body
        }
      });*!/
    });
  };

  async onInit() {
    await ChromeTools.clearAllRules();
    chrome.devtools.network.onRequestFinished.addListener(this._handleOnRequestFinished);
  }

  async onDestroy() {
    chrome.devtools.network.onRequestFinished.removeListener(this._handleOnRequestFinished);
    await ChromeTools.clearAllRules();
  }

  /!**
   * @param config{IPattern}
   *!/
  addPattern(config) {
    this.patterns.push(new Pattern(config));
  }

  /!**
   * @param patternIndex{number}
   *!/
  remPattern(patternIndex) {
    this.patterns[patternIndex].clearPattern();
    this.patterns.splice(patternIndex, 1);
  }

  /!**
   * @param request{Request}
   * @param body{string}
   *!/
  _handleRequest(request, body) {
    for (const pattern of this.patterns) {
      if (pattern.test(request.url)) {
        pattern.addResponse(request.url, Factory.createResponse(request, body));
      }
    }
  }
}

class Pattern {

  /!**
   * @type {IPattern}
   *!/
  config = null;

  /!**
   * @type {RegExp}
   *!/
  pattern = null;

  /!**
   * @type {Map<string, Result>}
   *!/
  results = null;

  /!**
   * @param config{IPattern}
   *!/
  constructor(config) {
    this.setPattern(config);
  }

  /!**
   * @param config{IPattern}
   *!/
  setPattern(config) {
    if (this.config) {
      this._destroyPattern();
    }
    this.config = config;
    this._initPattern();
  }

  clearPattern() {
    this._destroyPattern();
  }

  /!**
   * @param url{string}
   * @param response{IResponse}
   *!/
  addResponse(url, response) {
    if (!this.results.has(url)) {
      this.results.set(url, new Result(url));
    }
    this.results.get(url).addResponse(response);
  }

  /!**
   * @param url{string}
   * @return {boolean}
   *!/
  test(url) {
    return this.pattern.test(url);
  }

  _initPattern() {
    /!*chrome.runtime.sendMessage({
      type: 'add_pattern',
      message: {
        pattern: this.config.pattern
      }
    });*!/
    this.pattern = new RegExp(this.config.pattern);
    this.results = new Map();
  }

  _destroyPattern() {
    this.results.clear();
    this.results = null;
    this.pattern = null;
    /!*chrome.runtime.sendMessage({
      type: 'rem_pattern',
      message: {
        pattern: this.config.pattern
      }
    });*!/
  }
}

class Result {

  /!**
   * @type {number}
   *!/
  static MAX_HISTORY = 5;

  /!**
   * @type {number}
   *!/
  static MAX_SAVED = 5;

  /!**
   * @type {string}
   *!/
  url = '';

  /!**
   * @type {IResponse[]}
   *!/
  history = [];

  /!**
   * @type {IResponse[]}
   *!/
  saved = [];

  /!**
   * @type {number}
   *!/
  usingIndex = -1;

  /!**
   * @param url{string}
   *!/
  constructor(url) {
    this.url = url;
  }

  /!**
   * @param response{IResponse}
   *!/
  addResponse(response) {
    if (this.history.length >= Result.MAX_HISTORY) {
      this.history = this.history.slice(1);
    }
    this.history.push(response);
  }

  /!**
   * @param historyIndex{number}
   *!/
  addSavedResponse(historyIndex) {
    if (this.saved.length < Result.MAX_SAVED) {
      this.saved.unshift({...this.history[historyIndex]});
    }
  }

  /!**
   * @param saveIndex{number}
   *!/
  remSavedResponse(saveIndex) {
    if (saveIndex === this.usingIndex) {
      this.usingIndex = -1;
    }
    this.saved.splice(saveIndex, 1);
  }

  /!**
   * @param savedIndex{number}
   *!/
  useResponse(savedIndex) {
    this.usingIndex = savedIndex;
  }
}

// --- INITIATING ---

let instance = new ResponseTracker();

async function onInit() {
  console.info('Initiating execution');

  clearTimeout(lifecycleStartTimeout);

  await instance?.onDestroy();
  await instance.onInit();
}

async function onDestroy() {
  console.info('Destroying execution');

  await instance.onDestroy();
}

let isLifecycleStarted = false;
let lifecycleStartTimeout = null;

setInterval(() => console.info("Alive!"), 10000);

chrome.runtime.onInstalled?.addListener(() => {
  console.debug('Runtime event: onInstalled');
  onInit();
  isLifecycleStarted = true;
});
chrome.runtime.onUninstalled?.addListener(() => {
  console.debug('Runtime event: onUninstalled');
  onDestroy();
});

chrome.management.onEnabled?.addListener(() => {
  console.debug('Management event: onEnabled');
  onInit();
  isLifecycleStarted = true;
});
chrome.management.onDisabled?.addListener(() => {
  console.debug('Management event: onDisabled');
  onDestroy();
});

chrome.runtime.onSuspend?.addListener(() => {
  console.debug('Runtime event: onSuspend');
  onDestroy();
});
chrome.runtime.onSuspendCanceled?.addListener(() => {
  console.debug('Runtime event: onSuspendCanceled');
  onInit();
  isLifecycleStarted = true;
});

clearTimeout(lifecycleStartTimeout);
lifecycleStartTimeout = setTimeout(() => {
  if (!isLifecycleStarted) {
    console.debug('Executed manual start');
    onInit();
    isLifecycleStarted = true;
  }
}, 1000);*/
