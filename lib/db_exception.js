/**
 * Exception extend
 *
 * @category Exceptions
 */
class dbException {

	constructor(message) {
		this.name = 'dbException'
		this.message = message ? message : 'Error'
		this.stack = (new Error()).stack
	}
}

dbException.prototype = Object.create(Error.prototype)

module.exports = dbException