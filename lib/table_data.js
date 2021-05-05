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
		const res = new TableData(settings)
		res.table_name = table_name
		res.setType('data')
		return res
	}

}
  
module.exports = TableData