'use strict'

const dir_app = process.env.JSON_DB_APP_DIR ? process.env.JSON_DB_APP_DIR : __dirname
const {DbJsonError, FatalError, ParseError, BaseError } = require(dir_app+'/db_exception.js')
const Plugin = require(dir_app+'/plugin.js')
const TableData = require(dir_app+'/table_data.js')
const TableConfig = require(dir_app+'/table_config.js')

/** Validation for tables class
 *
 */
class ValidateData {

	constructor(settings = {}) {

		/** Name of table
		* @var string
		*/
		this.table_name

		/** Name schema
		* @var object
		*/
		this.table_schema
		
		/** defined fields types: boolean, integer, double, string, array, object
		* @var array
			js types ['bigint', 'number', 'string', 'boolean', 'object', 'symbol', 'null', 'undefined']
		*/
		this.defined_types = ['boolean', 'integer', 'double', 'string', 'array', 'object']

		/** Table Config class
		* @var class
		*/
		this.Config

		/** Table Data class
		* @var class
		*/
		this.Data

		/** Settings class
		* @var object
		*/
		this.settings = {}

		if (settings) Object.assign(this.settings, settings)

	}

	/** Table name
	 * @param string table_name
	 * @return Validate
	 */
	static table(table_name, settings = {}) {
		const validate = new ValidateData(settings)
		validate.table_name = table_name
		validate.Config = TableConfig.table(table_name, settings)
		validate.Data = TableData.table(table_name, settings)
		if (validate.Config.exists() === true) validate.schema()
		return validate
	}

	/** Checking that types from array matching with [boolean, integer, string, double, array, object]
	 * @param array types Indexed array
	 * @return bool
	 * @throws this.Error
	 */
	static types(types = []) {
		
		let diff = this.objectToArrayDiff(types, this.defined_types)

		if (diff.length === 0) {
			return true
		} else if (diff.length >= 1) {
			const err = `Wrong types: ${diff.split(', ')}. Available "boolean, integer, double, string, array, object`
			if (this.settings.console_error === true) {
				this.settings.consoleLog(err, __filename)
				return false
			} else throw new this.Error(err)
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

	/** Returning assoc array with types of fields
	 * @return array Fields type
	 */
	schema() {
		if (!this.table_schema) this.table_schema = this.Config.schema()
		return this.table_schema
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
	 * @throws this.Error If field(s) does not exist
	 */
	fields(fields = []) {
		fields = this.filterFields(fields)
		let diff = Plugin.arrayDiff(fields, this.Config.fields())
		if (diff) {
			return true
		} else {
			const err = `Field(s) ${diff.join(', ')} does not exists in table ${this.table_name}`
			if (this.settings.console_error === true) {
				this.settings.consoleLog(err, __filename)
				return false
			} else throw new this.Error(err)
		}
	}

	/** Checking that typed field really exist in table
	 * @param string name
	 * @return boolean
	 * @throws this.Error If field does not exist
	 */
	field(field) {

		if (field === 'id') return true

		const array_fields = this.Config.fields()
		const includes = array_fields.includes(field)

		if (array_fields && includes) {
			return true
		} else {
			const err = `Field ${field} does not exists in table ${this.table_name}`
			if (this.settings.console_error === true) {
				this.settings.consoleLog(err, __filename)
				return false
			} else throw new this.Error(err)
		}
	}

	/** Checking that Table and Config exists and throw exceptions if not
	 * @return boolean
	 * @throws this.Error
	 */
	exists() {
		if (this.Data.exists() === false || this.Config.exists() === false) {
			const err = `Table ${this.table_name} does not exists`
			if (this.settings.console_error === true) {
				this.settings.consoleLog(err, __filename)
				return false
			} else throw new this.Error(err)
			
		} else return true
	}

	/** Checking that typed field have correct type of value
	 * @param string $field
	 * @param mixed $value
	 * @return boolean true|false
	 * @throws this.Error If type is wrong
	 */
	type(field, value) {

		const schema = this.schema()

		let err, type

		if (field == 'id') type = 'integer'
		else if (schema[field]) type = schema[field]

		if (type) {

			value = Plugin.valueToType(type, value)

			const types = Plugin.valueType(value)

			if (!types[type]) err = `Wrong data type ${field} value ${value}`

		} else err = `Field ${field} does not exist`

		if (err) {
			if (this.settings.console_error === true) {
				this.settings.consoleLog(err, __filename)
				return undefined
			} else throw new this.Error(err)
		}
		else return value
	}

	/** Checking that relation between tables exists
	 * @param string local local table
	 * @param string foreign related table
	 * @return bool relation exists
	 * @throws this.Error
	 */
	relation(local, foreign) {
		const table_local = TableConfig.table(local, this.settings)
		const relations = table_local.relations()
		if (relations[foreign]) {
			return true
		} else {
			const err = `Relation ${local} to ${foreign} doesn\'t exist`
			if (this.settings.console_error === true) {
				this.settings.consoleLog(err, __filename)
				return false
			} else throw new this.Error(err)
		}
	}

	/** Checking that relation type is correct
	 * @param string $type 
	 * @return bool relation type
	 * @throws this.Error Wrong relation type
	 */
	relationType(type) {

		//const relation = TableData.table(this.table_name, this.settings)
		const relations = this.Data.relations()

		if (Plugin.inArray(type, relations)) {
			return true
		} else {
			const err = 'Wrong relation type'
			if (this.settings.console_error === true) {
				this.settings.consoleLog(err, __filename)
				return false
			} else throw new this.Error(err)
		}
	}

}
 
ValidateData.Error = class extends DbJsonError {
	constructor(message, code) {
	  super(message)
	  this.code = code
	}
}

module.exports = ValidateData