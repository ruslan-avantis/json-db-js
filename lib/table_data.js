const dir_app = process.env.DIR_APP ? process.env.DIR_APP : (global.json_db.dir_app ? global.json_db.dir_app : __dirname)
const File = require(dir_app+'/data_base_file.js')

/**
 * Data managing class
 *
 * @category Helpers

 */
class TableData extends File {

	constructor(settings = {}) {
		super(settings)
	}
	
	static table(table_name, settings = {}) {
		const f = new TableData(settings)
		f.table_name = table_name
		f.setType('data')
		return f
	}

}

TableData.Error = class extends Error {
	constructor(message, code) {
	  super(message)
	  this.code = code
	}
}
  
module.exports = TableData