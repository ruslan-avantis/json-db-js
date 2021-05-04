const dir_app = process.env.DIR_APP ? process.env.DIR_APP : __dirname
const {DbJsonError, FatalError, ParseError, BaseError } = require(dir_app+'/db_exception.js')
const File = require(dir_app+'/table_file.js')
/** Data managing class
 *
 */
class TableData extends File {

	constructor(settings = {}) {
		super(settings)
	}
	
	/** Set table name
	 * @param string $table_name
	 * @param object $settings
	 * @return this
	 */
	static table(table_name, settings = {}) {
		const f = new TableData(settings)
		f.table_name = table_name
		f.setType('data')
		return f
	}

}

TableData.Error = class extends DbJsonError {
	constructor(message, code) {
	  super(message)
	  this.code = code
	}
}
  
module.exports = TableData