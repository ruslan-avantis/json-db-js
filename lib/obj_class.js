/**
 * Data managing class
 *
 * @category Helpers

 */
class stdClass extends Object {
	constructor() {
		super()
	}
}

stdClass.Error = class extends Error {
	constructor(message, code) {
	  super(message)
	  this.code = code
	}
}
  
module.exports = stdClass