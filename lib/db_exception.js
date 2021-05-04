exports.BaseError = class BaseError extends Error {
	/**
	 * @class BaseError
	 * @constructor
	 * @private
	 * @param  {String} code Error code
	 * @param  {String} message Error message
	 */
	constructor(code, message) {
	  super(`${code}: ${message}`)
	  this.code = code
	}
	toJSON() {
	  return {
		code: this.code,
		message: this.message,
	  }
	}
  }
  
  
  exports.FatalError = class FatalError extends exports.BaseError {
	/**
	 * Fatal Error. Error code is `"FATALERROR"`.
	 * @class FatalError
	 * @constructor
	 * @param  {String|Error} data Error object or message
	 */
	constructor(data) {
	  const error = (typeof data === 'string') ? null : data
	  const message = error ? error.message : data
	  super('FATALERROR', message)
	  if (error) this.stack = error.stack
	}
  }
  
  exports.ParseError = class ParseError extends exports.BaseError {
	/**
	 * Error during parsing. Error code is `"PARSEERROR"`.
	 * @class ParseError
	 * @constructor
	 * @param  {String} message Error message
	 * @param  {http.IncomingMessage} response Server response
	 */
	constructor(message, response) {
	  super('PARSEERROR', message)
	  this.response = response
	}
  }
  
  
  exports.DbJsonError = class DbJsonError extends exports.BaseError {
	/**
	 * Error returned from Telegram. Error code is `"ETELEGRAM"`.
	 * @class DbJsonError
	 * @constructor
	 * @param  {String} message Error message
	 * @param  {http.IncomingMessage} response Server response
	 */
	constructor(message, response) {
	  super('DbJsonError', message)
	  this.response = response
	}
  }