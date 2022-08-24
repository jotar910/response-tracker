/**
 * @type{{
 *  pattern: string
 * }}
 */
class IPattern {
}

/**
 * @type{{
 *  url: string,
 *  patterns: string[],
 *  using: number,
 *  history: IResponse[],
 *  saved: IResponse[]
 * }}
 */
class IResult {
}

/**
 * @type{{
 *  url: string,
 *  response: IResponse
 * }}
 */
class ICustomResult {
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
   * @type {string}
   */
  type = '';

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
  name = '';

  /**
   * @type {string}
   */
  value = '';
}

class ICustomResponse extends IResponse {
  /**
   * @type {string}
   */
  url = '';
}

/**
 * @type{{
 *    isOn: boolean,
 *    port: number,
 *    patterns: IPattern[],
 *    results: IResult[],
 *    customResults: ICustomResult[]
 * }}
 */
class IStorage {
}
