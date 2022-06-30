console.info("Running...");

console.info("On message", !!chrome.runtime.onMessage);
chrome.runtime.onMessage?.addListener((request, _, sendResponse) => {
  console.log('Handling message', request);
  sendResponse();
});

const storageKey = 'response-tracker::storage';

class ChromeTools {

}

class ResponseTracker {
  /**
   * @type {Pattern[]}
   */
  patterns = [];

  init() {

  }

  /**
   * @param config{IPattern}
   */
  addPattern(config) {

  }
}

class IPattern {

  /**
   * @type {string}
   */
  pattern = '';

  /**
   * @type {IResult[]}
   */
  results = [];
}

class IResult {

  /**
   * @type {string}
   */
  url = '';

  /**
   * @type {IResponse[]}
   */
  saved = [];

  /**
   * @type {IResponse[]}
   */
  history = [];

  /**
   * @type {number}
   */
  usingIndex = -1;
}

class IResponse {
  /**
   * @type {number}
   */
  status = 0;

  /**
   * @type {string}
   */
  body = '';

  /**
   * @type {IHeader[]}
   */
  headers = [];

  /**
   * @type {number}
   */
  date = 0;
}

class IHeader {
  /**
   * @type {string}
   */
  key = '';

  /**
   * @type {string}
   */
  value = '';
}

/**
 * @template T
 */
/*class ILinkedList {

  /!**
   * @type {T}
   *!/
  cur = null;

  /!**
   * @type {T}
   *!/
  prev = null;

  /!**
   * @type {T}
   *!/
  next = null;

  /!**
   * @param cur{T}
   * @param prev{T}
   * @param next{T}
   *!/
  constructor(cur, prev, next) {
    this.cur = cur;
    this.prev = prev;
    this.next = next;
  }
}*/

/*chrome.tabs.executeScript({
  file: 'script.js'
});*/

console.log('tabs', chrome.tabs);

/*chrome.scripting.executeScript({
  files: ['script.js']
});*/

/*setTimeout(() => {
  chrome.tabs.onActivated.addListener(
    function ({tabId}) {
      console.log('TAB', tabId);
      chrome.scripting.executeScript({
        files: ['script.js']
      });
      // console.log('tab', tab);
      /!*if (message == "runContentScript") {
        chrome.tabs.executeScript({
          file: 'contentScript.js'
        });
      }*!/
    });
}, 2000);*/

/**

 [
 {
  pattern: string,
  results : [
    {
      url: string,
      saved: Response[] + using flag,
      history: [
        Response{
          status: number,
          body: string,
          headers: Header[],
          date: number
        }
      ]
    }
  ]
 }
 ]

 Features:
 - Add + Delete pattern.
 - Track history for each url that matches a pattern. (Max. 5)
 - Add history to saved list.
 - Set a saved response as result.
 - Remove saved response.
 - Search for patterns and urls.
 */


/*

/!**
 * @type {Config[]}
 *!/
const configs = [];
const storageKey = 'ng-redirector::storage';

class Config {
  static ID_COUNT = 1;

  constructor(config) {
    this.configValue = null;

    this.cookiesValue = "";
    this.updateCookieOnTabActivation = false;
    this.cookiesChangeDebounce = null;

    this.toSchema = null;
    this.toDomain = null;
    this.toPort = null;
    this.to = null;

    this.fromSchema = null;
    this.fromDomain = null;
    this.fromPort = null;
    this.from = null;

    this.pathFilters = null;
    this.customHeaders = null;
    this.requiredCookies = null;
    this.pathsRewrite = null;

    this.curRules = [];

    if (config) {
      this.fillValues(config);
    }
  }

  getUrlRedirectFilters() {
    return this.pathFilters.map((path) => [this.to, path].join(""));
  }

  async fillCookies() {
    const cookies = await new Promise((resolve) => chrome.cookies.getAll({url: this.from}, resolve));
    this.cookiesValue = cookies
      .map((cookie) => `${cookie.name}=${cookie.value}`)
      .join("; ");
  }

  async setRules() {
    const rulesToAdd = [];
    const urlsFilterRedirect = this.getUrlRedirectFilters();

    await this.fillCookies();

    for (let index = 0; index < this.pathFilters.length; ++index) {
      // Redirect
      rulesToAdd.push({
        id: Config.ID_COUNT++,
        priority: 1,
        action: {
          type: "redirect",
          redirect: {
            transform: {
              scheme: this.toSchema,
              host: this.toDomain,
              port: this.toPort,
            },
          },
        },
        condition: {urlFilter: `${this.from}${this.pathFilters[index]}`},
      });

      // Add headers
      rulesToAdd.push({
        id: Config.ID_COUNT++,
        priority: 1,
        action: {
          type: "modifyHeaders",
          requestHeaders: [
            // Cookies
            {
              header: "cookie",
              operation: "set",
              value: this.cookiesValue,
            },
            // Custom
            ...this.customHeaders.map((h) => ({
              header: h.name,
              operation: "set",
              value: h.value
            }))
          ],
          responseHeaders: [
            // Cors
            {
              header: "access-control-allow-origin",
              operation: "set",
              value: this.from,
            },
          ],
        },
        condition: {urlFilter: urlsFilterRedirect[index]},
      });
    }

    for (let index = 0; index < this.pathsRewrite.length; ++index) {
      const {searchPattern, replaceValue} = this.pathsRewrite[index];
      const path = searchPattern.startsWith('^') ? searchPattern.slice(1) : `.*${searchPattern}`;

      // Redirect by pattern.
      rulesToAdd.push({
        id: Config.ID_COUNT++,
        priority: 2,
        action: {
          type: "redirect",
          redirect: {
            regexSubstitution: `${this.toDomain}${this.toPort ? `:${this.toPort}` : ''}${replaceValue}`
          }
        },
        condition: {regexFilter: `${this.toDomain.replaceAll('.', '\\.')}${this.toPort ? `:${this.toPort}` : ''}${path}`}
      });
    }

    console.info("Updating rules...");
    chrome.declarativeNetRequest.updateDynamicRules({
      addRules: rulesToAdd
    });
    this.curRules = await new Promise((resolve) =>
      chrome.declarativeNetRequest.getDynamicRules(resolve)
    );
    console.info("Rules updated!", this.curRules);
  }

  async removeRules() {
    chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: this.curRules.map((rule) => rule.id),
    });
    this.curRules = [];
    const unchangedRules = await new Promise((resolve) =>
      chrome.declarativeNetRequest.getDynamicRules(resolve)
    );
    console.info("Rules removed!", unchangedRules);
  }

  async cookieChange(tab) {
    await this.removeRules();
    await this.setRules();
    chrome.tabs.reload(tab.id);
  }

  async showCookieChangeAlert(tab) {
    this.updateCookieOnTabActivation = false;
    await new Promise((resolve) => chrome.scripting.executeScript({
      target: {tabId: tab.id},
      files: ["confirm-alert.js"],
    }, resolve));
    chrome.tabs.sendMessage(
      tab.id,
      {
        type: "show-confirmation",
        payload: "Cache was changed! Wanna reload the page?",
      },
      (response) => {
        if (!response) {
          return;
        }
        this.cookieChange(tab);
      }
    );
  }


  /!**
   * @param {CookieChangeInfo} change
   *!/
  cookiesChanged(change) {
    this.cookiesChangeDebounce = null;
    if (
      change.cookie.domain !== this.fromDomain ||
      !this.requiredCookies[change.cookie.name]
    ) {
      return;
    }
    clearTimeout(this.cookiesChangeDebounce);
    this.cookiesChangeDebounce = setTimeout(async () => {
      const prevCookiesValue = this.cookiesValue;
      await this.fillCookies();
      this.updateCookieOnTabActivation = prevCookiesValue !== this.cookiesValue;
      if (!this.updateCookieOnTabActivation) {
        return;
      }
      const tab = await getCurrentTab();
      if (!!tab?.url.startsWith(this.from)) {
        console.debug('Cookie changed', change);
        this.showCookieChangeAlert(tab);
      }
    }, 500);
  }

  /!**
   * @param {TabActiveInfo} activeInfo
   *!/
  async tabChanged(activeInfo) {
    const tab = await new Promise((resolve) => chrome.tabs.get(activeInfo.tabId, resolve));
    if (this.updateCookieOnTabActivation && !!tab?.url.startsWith(this.from)) {
      this.showCookieChangeAlert(tab);
    }
  }

  fillValues(value) {
    this.configValue = value;
    this.fromSchema = value.from.schema;
    this.fromDomain = value.from.host;
    this.fromPort = value.from.port;
    this.from = `${this.fromSchema}://${this.fromDomain}${this.fromPort ? `:${this.fromPort}` : ""}`;
    this.toSchema = value.to.schema;
    this.toDomain = value.to.host;
    this.toPort = value.to.port;
    this.to = `${this.toSchema}://${this.toDomain}${this.toPort ? `:${this.toPort}` : ""}`;
    this.pathFilters = value.rules;
    this.customHeaders = value.headers;
    this.pathsRewrite = value.pathsRewrite;
    this.requiredCookies = value.cookies.reduce(
      (accum, cur) => ({...accum, [cur]: true}),
      {}
    );
  }
}

async function getCurrentTab() {
  let queryOptions = {active: true, currentWindow: true};
  let [tab] = await new Promise((resolve) => chrome.tabs.query(queryOptions, resolve));
  return tab;
}

async function resetConfigurations() {
  for (const config of configs) {
    await config.removeRules();
  }
  configs.length = 0;
}

async function fillConfigurations(configurations) {
  await resetConfigurations();
  for (const configuration of configurations) {
    const config = new Config(configuration);
    await config.fillCookies();
    await config.setRules();
    configs.push(config);
  }
}

async function setConfigurationsStorage() {
  return new Promise((resolve) => {
    const configsValues = [];
    for (const config of configs) {
      configsValues.push(config.configValue);
    }
    chrome.storage.sync.set({[storageKey]: JSON.stringify(configsValues)}, () => resolve());
  });
}

async function getConfigurationsStorage() {
  return new Promise((resolve) => {
    chrome.storage.sync.get([storageKey], (values) => {
      if (values?.[storageKey]) {
        return resolve(JSON.parse(values[storageKey]));
      }
      return resolve([]);
    });
  });
}

async function removeConfigurationsStorage() {
  return new Promise((resolve) => {
    chrome.storage.sync.remove([storageKey], () => resolve());
  });
}

async function clearAllRules() {
  const curRules = await new Promise((resolve) =>
    chrome.declarativeNetRequest.getDynamicRules(resolve)
  );
  chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: curRules.map((rule) => rule.id),
  });
}

function debugMatches() {
  console.debug('Debugging matches', !!chrome.declarativeNetRequest.onRuleMatchedDebug);
  chrome.declarativeNetRequest.onRuleMatchedDebug?.addListener((o) => {
    console.debug("Rule matched:", o);
  });
}

let handleListenOnInstall = () => {
  // Empty by design.
};

function startListenOnInstall() {
  let retries = null;

  const loadInitialValues = async () => {
    try {
      await new Promise((resolve) => chrome.tabs.create({url: "popup/popup.html"}, resolve));
      console.info("Loaded initial values.");
    } catch (e) {
      console.error(e);
      console.info("Could not load initial values. Retrying...");
      clearTimeout(retries);
      retries = setTimeout(loadInitialValues, 2000);
    }
  };

  // Check whether new version is installed
  console.debug('Initiating for the first time', !!chrome.runtime.onInstalled);
  handleListenOnInstall = async (details) => {
    if (details.reason === "install" || details.reason === "update") {
      const lastRules = await new Promise((resolve) =>
        chrome.declarativeNetRequest.getDynamicRules(resolve)
      );
      chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: lastRules.map((rule) => rule.id),
      });
      await loadInitialValues();
    }
  };
  chrome.runtime.onInstalled?.addListener(handleListenOnInstall);
}

function stopListenOnInstall() {
  chrome.runtime.onInstalled?.removeListener(handleListenOnInstall);
}

/!**
 * @param {any} request
 * @param {MessageSender} _
 * @param {(response: any) => void} sendResponse
 *!/
const handleListenToConfigs = (request, _, sendResponse) => {
  console.debug('Handling configuration message', request);
  if (request.type === "reset-config") {
    resetConfigurations().then(() => removeConfigurationsStorage());
    sendResponse("reset");
    return;
  }
  if (request.type !== "update-config") {
    return;
  }

  try {
    fillConfigurations(request.payload).then(() => setConfigurationsStorage());
    sendResponse("updated");
  } catch (e) {
    console.error(e);
    sendResponse({type: "error", payload: JSON.stringify(e)});
  }
};

function startListenToConfigs() {
  console.debug('Listening to configuration messages', !!chrome.runtime.onMessage);
  chrome.runtime.onMessage?.addListener(handleListenToConfigs);
}

function stopListenToConfigs() {
  chrome.runtime.onMessage?.removeListener(handleListenToConfigs);
}

/!**
 * @param {CookieChangeInfo} change
 *!/
const handleListenToCookies = (change) => {
  const trackDomain = {};
  configs.forEach((config) => {
    if (trackDomain[config.fromDomain]) {
      return;
    }
    trackDomain[config.fromDomain] = true;
    config.cookiesChanged(change);
  });
}

function startListenToCookies() {
  console.debug('Listening to cookies change', !!chrome.cookies.onChanged);
  chrome.cookies.onChanged?.addListener(handleListenToCookies);
}

function stopListenToCookies() {
  chrome.cookies.onChanged?.removeListener(handleListenToCookies);
}

/!**
 * @param {TabActiveInfo} activeInfo
 *!/
const handleListenToTabChange = (activeInfo) => {
  const trackUrl = {};
  configs.forEach((config) => {
    if (trackUrl[config.from]) {
      return;
    }
    trackUrl[config.from] = true;
    config.tabChanged(activeInfo);
  });
};

function startListenToTabChange() {
  console.debug('Listening to tab change', !!chrome.tabs.onActivated);
  chrome.tabs.onActivated?.addListener(handleListenToTabChange);
}

function stopListenToTabChange() {
  chrome.tabs.onActivated?.removeListener(handleListenToTabChange);
}

let isLifecycleStarted = false;
let lifecycleStartTimeout = null;

function lifecycle() {
  console.debug('Listening to browser startup', !!chrome.runtime.onStartup);

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
  }, 1000);
}

async function onInit() {
  console.info('Initiating execution');

  clearTimeout(lifecycleStartTimeout);

  await clearAllRules();
  await fillConfigurations(await getConfigurationsStorage());

  startListenOnInstall();
  startListenToConfigs();
  startListenToCookies();
  startListenToTabChange();
}

async function onDestroy() {
  console.info('Destroying execution');

  stopListenToTabChange();
  stopListenToCookies();
  stopListenToConfigs();
  stopListenOnInstall();

  await resetConfigurations();
}

function start() {
  setInterval(() => console.info("Alive!"), 10000);

  debugMatches();
  lifecycle();
}

start();
*/
