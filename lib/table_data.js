const dir_app = process.env.DIR_APP ? process.env.DIR_APP : (global.json_db.dir_app ? global.json_db.dir_app : __dirname)
const File = require(dir_app+'/data_base_file.js')
const dbException = require(dir_app+'/db_exception.js')
/**
 * Data managing class
 *
 * @category Helpers

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

TableData.Error = class extends dbException {
	constructor(message, code) {
	  super(message)
	  this.code = code
	}
}
  
module.exports = TableData