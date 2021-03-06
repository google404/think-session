const helper = require('think-helper');
const assert = require('assert');
const SESSION = Symbol('think-context-session');

/**
 * default session options
 */
const defaultOptions = {
  maxAge: 24 * 3600 * 1000 // 1 day
};
/**
 * default cookie options
 * https://github.com/pillarjs/cookies#cookiesset-name--value---options--
 */
const defaultCookieOptions = {
  name: 'thinkjs',
  autoUpdateRate: 0.5,
  path: '/', // a string indicating the path of the cookie
  httpOnly: true,
  sameSite: false,
  signed: false,
  overwrite: false,
  encrypt: false // encrypt cookie data
  // maxAge: '',
  // expires: '',
  // domain: '',
  // secure: false,
  // keys: []
};
/**
 * Session Manage
 */
class Session {
  /**
   * constructor
   * @param {Object} ctx context
   * @param {Object} options session options
   */
  constructor(ctx, options = {}) {
    this.ctx = ctx;
    const sessionConfig = helper.parseAdapterConfig(ctx.config('session'), options);
    this.options = helper.extend({}, defaultOptions, sessionConfig);
    // transform humanize time to ms
    this.options.maxAge = helper.ms(this.options.maxAge);
    assert(helper.isFunction(this.options.handle), 'session.handle must be a function');
    this.cookieOptions = Object.assign({}, defaultCookieOptions, ctx.config('cookie'), this.options.cookie);
    this.cookieOptions.maxAge = this.options.maxAge;
  }
  /**
   * get session instance
   */
  getSessionInstance() {
    if (!this.ctx[SESSION]) {
      const Handle = this.options.handle;
      let instance;
      // store session data on cookie
      if (Handle.onlyCookie) {
        instance = new Handle(this.cookieOptions, this.ctx);
      } else {
        const name = this.cookieOptions.name;
        let cookie = this.ctx.cookie(name, undefined, this.cookieOptions);
        let fresh = false;
        if (!cookie) {
          cookie = helper.uuid();
          this.ctx.cookie(name, cookie, this.cookieOptions);
          fresh = true;
        }
        this.options.cookie = cookie;
        this.options.fresh = fresh;
        instance = new Handle(this.options, this.ctx, this.cookieOptions);
      }
      this.ctx[SESSION] = instance;
    }
    return this.ctx[SESSION];
  }
  /**
   * get or set session data
   * @param {String} name 
   * @param {Mixed} value 
   */
  run(name, value) {
    const instance = this.getSessionInstance();
    // delete session
    if (name === null) {
      return Promise.resolve(instance.delete());
    }
    // get session
    if (value === undefined) {
      return Promise.resolve(instance.get(name));
    }
    assert(helper.isString(name), 'session.name must be a string');
    // set session
    return Promise.resolve(instance.set(name, value));
  }
}

module.exports = Session;
