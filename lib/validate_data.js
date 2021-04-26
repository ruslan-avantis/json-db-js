const dir_app = process.env.JSON_DB_APP_DIR ? process.env.JSON_DB_APP_DIR : __dirname
const TableData = require(dir_app+'/table_data.js')
const TableConfig = require(dir_app+'/table_config.js')
const TableRelation = require(dir_app+'/table_relation.js')
const dbException = require(dir_app+'/db_exception.js')
const Plugin = (require(dir_app+'/plugin.js'))()

/**
 * Validation for tables
 *
 * @category Helpers
 */
class ValidateData {

	constructor(settings = {}) {

		/**
		* Name of table
		* @var string
		*/
		this.table_name
		
		/**
		* defined fields types: boolean, integer, double, string, array, object
		* @var array
		*/
		this.defined_types = ['boolean', 'integer', 'double', 'string', 'array', 'object']

		this.settings = {}
		if (settings) Object.assign(this.settings, settings)

		//console.log('ValidateData.constructor(settings)', this.settings)

	}

	/** Table name
	 * @param string table_name
	 * @return Validate
	 */
	static table(table_name, settings = {}) {
		const validate = new ValidateData(settings)
		validate.table_name = table_name
		return validate
	}

	/** Checking that types from array matching with [boolean, integer, string, double, array, object]
	 * @param array types Indexed array
	 * @return bool
	 * @throws dbException
	 */
	static types(types = []) {
		
		let diff = this.objectToArrayDiff(types, this.defined_types)

		if (diff.length === 0) {
			return true
		} else if (diff.length >= 1) {
			const err = `Wrong types: ${diff.split(', ')}. Available "boolean, integer, double, string, array, object`
			if (global.json_db.console_error === true) {
				global.json_db.consoleLog(err, __filename)
				return false
			} else throw new dbException(err)
		}
	}

	/** Compare object values with an array
	 * return an array of mismatches
	 * @param object obj
	 * @param array arr
	 * @return array
	 */
	static objectToArrayDiff(obj, arr = []) {
		if (obj && arr.length >= 1) {
			for (let key in obj) {
				let type = obj[key].toLowerCase()
				if (arr.indexOf(type) != -1) arr.push(type)
			}
		}
		return arr
	}

	/** Change keys and values case to lower
	 * @param array
	 * @return array
	 */
	static objToLowerCase(obj = {}) {
		let res = {}
		if (obj) {
			for (let i in obj) {
				if (typeof obj[i] == 'string') {
					let key = i.toLowerCase()
					let value = obj[i].toLowerCase()
					res[key] = value
				}
			}
		}
		return res
	}

	/** Delete ID field from arrays
	 * @param array fields
	 * @return array Fields without ID
	 */
	filterFields(fields = []) {
		if (fields.length >= 1 && Array.isArray(fields)) {
			const key = fields.indexOf('id')
			if (key != -1) {
				delete fields[key]
			}
		} else if (fields && fields['id']) {
			delete fields['id']
		}
		return fields
	}

	/** Checking that typed fields really exist in table
	 * @param array fields Indexed array
	 * @return boolean
	 * @throws dbException If field(s) does not exist
	 */
	fields(fields = []) {
		fields = this.filterFields(fields)
		let diff = Plugin.arrayDiff(fields, TableConfig.table(this.table_name, this.settings).fields())
		if (diff) {
			return true
		} else {
			const err = `Field(s) ${diff.join(', ')} does not exists in table ${this.table_name}`
			if (global.json_db.console_error === true) {
				global.json_db.consoleLog(err, __filename)
				return false
			} else throw new dbException(err)
		}
	}

	/** Checking that typed field really exist in table
	 * @param string name
	 * @return boolean
	 * @throws dbException If field does not exist
	 */
	field(name) {
		const array = TableConfig.table(this.table_name, this.settings).fields()
		//console.log(`field(${name}) array `, array)
		if (array && array.includes(name)) {
			return true
		} else {
			const err = `Field ${name} does not exists in table ${this.table_name}`
			if (global.json_db.console_error === true) {
				global.json_db.consoleLog(err, __filename)
				return false
			} else throw new dbException(err)
		}
	}

	/** Checking that Table and Config exists and throw exceptions if not
	 * @return boolean
	 * @throws dbException
	 */
	exists() {
		const tableData = TableData.table(this.table_name, this.settings)
		const tableConfig = TableConfig.table(this.table_name, this.settings)

		const data_exists = tableData.exists()
		const config_exists = tableConfig.exists()

		if (data_exists === false || config_exists === false) {
			const err = `Table ${this.table_name} does not exists`
			if (global.json_db.console_error === true) {
				global.json_db.consoleLog(err, __filename)
				return false
			} else throw new dbException(err)
			
		} else return true
	}

	/** Checking that typed field have correct type of value
	 * @param string name
	 * @param mixed value
	 * @return boolean
	 * @throws dbException If type is wrong
	 */
	type(name, value) {
		const schema = TableConfig.table(this.table_name, this.settings).schema()
		if (schema && Plugin.arrayKeyExists(name, schema) && typeof value == schema[name]) {
			return true
		} else {
			const err = `Wrong data type, type_name ${name} type_value ${value}`
			if (global.json_db.console_error === true) {
				global.json_db.consoleLog(err, __filename)
				return false
			} else throw new dbException(err)
		}
	}

	/** Checking that relation between tables exists
	 * @param string local local table
	 * @param string foreign related table
	 * @return bool relation exists
	 * @throws dbException
	 */
	relation(local, foreign) {
		const relations = TableConfig.table(local, this.settings).relations()
		if (relations[foreign]) {
			return true
		} else {
			const err = `Relation ${local} to ${foreign} doesn\'t exist`
			if (global.json_db.console_error === true) {
				global.json_db.consoleLog(err, __filename)
				return false
			} else throw new dbException(err)
		}
	}

	/** Checking that relation type is correct
	 * @param string $type 
	 * @return bool relation type
	 * @throws dbException Wrong relation type
	 */
	relationType(type) {
		const relations = TableRelation.relations()
		if (Plugin.inArray(type, relations)) {
			return true
		} else {
			const err = 'Wrong relation type'
			if (global.json_db.console_error === true) {
				global.json_db.consoleLog(err, __filename)
				return false
			} else throw new dbException(err)
		}
	}
}
 
ValidateData.Error = class extends Error {
	constructor(message, code) {
	  super(message)
	  this.code = code
	}
}

module.exports = ValidateData