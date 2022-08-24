import {ChromeTools, Factory} from './utils/utils';

export class ResponseTracker {

  /**
   * @type {StoreDefinition<'main'>}
   */
  store = null;

  /**
   * @param req{chrome.devtools.network.Request}
   */
  _handleOnRequestFinished = (req) => {
    req?.getContent((body) => {
      if (req.request && req.response && !req.response.redirectURL) {
        this.store.handleRequest(req.request.url, Factory.createResponse(req.response, body));
      }
    }, 'base64');
  };

  _handleDebugMatch = (match) => {
    console.debug("Rule matched:", match);
  };

  /**
   * @param store{StoreDefinition<'main'>}
   */
  constructor(store) {
    this.store = store;
  }


  async onInit() {
    await ChromeTools.clearAllRules();
    chrome.devtools.network.onRequestFinished.addListener(this._handleOnRequestFinished);
    chrome.declarativeNetRequest.onRuleMatchedDebug?.addListener(this._handleDebugMatch);
  }

  async onDestroy() {
    chrome.declarativeNetRequest.onRuleMatchedDebug?.removeListener?.(this._handleDebugMatch);
    chrome.devtools.network.onRequestFinished.removeListener(this._handleOnRequestFinished);
    await ChromeTools.clearAllRules();
  }

  async onReset() {
    await this.onDestroy();
    await this.onInit();
  }
}
