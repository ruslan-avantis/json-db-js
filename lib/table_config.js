const dir_app = process.env.JSON_DB_APP_DIR ? process.env.JSON_DB_APP_DIR : __dirname
const File = require(dir_app+'/table_file.js')
const Plugin = require(dir_app+'/plugin.js')
const dbException = require(dir_app+'/db_exception.js')

/** Config managing class
 *
 */
class TableConfig extends File {

	constructor(settings = {}) {
		super(settings)
	}

	/** Set table name
	 * @param string $table_name
	 * @param object $settings
	 * @return this
	 */
	static table(table_name, settings = {}) {
		const config = new TableConfig(settings)
		config.table_name = table_name
		config.setType('config')
		return config
	}

	/** Get key from returned config
	 * @param string field key
	 * @param bool assoc
	 * @return mixed
	 */
	getKey(field) {
		return this.get()[field]
	}

	/** Returning assoc array with types of fields
	 * @return array
	 */
	schema() {
		return this.getKey('schema', true)
	}

	/** Return array with names of fields
	 * @return array
	 */
	fields() {
		return Plugin.arrayKeys(this.schema())
	}

	/** Return relations configure
	 * @param mixed tableName null-all tables;array-few tables;string-one table relation informations
	 * @param boolean assoc Object or associative array
	 * @return array|object
	 */
	relations(tableName = null) {
		if (Array.isArray(tableName)) {
			const relations = this.getKey('relations')
			return Plugin.arrayIntersectKey(relations, Plugin.arrayFlip(tableName))
		} else if (tableName != null) {
			return this.getKey('relations')[tableName]
		}
		return this.getKey('relations')
	}

	/** Returning last ID from table
	 * @return integer
	 */
	lastId() {
		return this.getKey('last_id')
	}

}

TableConfig.Error = class extends dbException {
	constructor(message, code) {
	  super(message)
	  this.code = code
	}
}
  
module.exports = TableConfig