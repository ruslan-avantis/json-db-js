const dir_app = process.env.JSON_DB_APP_DIR ? process.env.JSON_DB_APP_DIR : __dirname
const File = require(dir_app+'/data_base_file.js')
const Plugin = require(dir_app+'/plugin.js')

/** Config managing class
 *
 * @category Helpers
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
		//console.log('-- Config.table(table_name) --')
		return config
	}

	/** Get key from returned config
	 * @param string field key
	 * @param bool assoc
	 * @return mixed
	 */
	getKey(field, assoc = false) {
		return this.get(assoc)[field]
	}

	/** Return array with names of fields
	 * @return array
	 */
	fields() {
		return Plugin.arrayKeys(this.getKey('schema', true))
	}

	/** Return relations configure
	 * @param mixed tableName null-all tables;array-few tables;string-one table relation informations
	 * @param boolean assoc Object or associative array
	 * @return array|object
	 */
	relations(tableName = null, assoc = false) {
		if (Array.isArray(tableName)) {
			const relations = this.getKey('relations', assoc)
			if (assoc) {
				return Plugin.arrayIntersectKey(relations, Plugin.arrayFlip(tableName))
			} else {
				return Plugin.arrayIntersectKey(relations, Plugin.arrayFlip(tableName))
			}
		} else if (tableName != null) {
			return assoc ? this.getKey('relations', assoc)[tableName] : ''
		}

		return this.getKey('relations', assoc)
	}

	/** Returning assoc array with types of fields
	 * @return array
	 */
	schema() {
		return this.getKey('schema', true)
	}

	/** Returning last ID from table
	 * @return integer
	 */
	lastId() {
		return this.getKey('last_id')
	}

}

TableConfig.Error = class extends Error {
	constructor(message, code) {
	  super(message)
	  this.code = code
	}
}
  
module.exports = TableConfig