const dir_app = process.env.JSON_DB_APP_DIR ? process.env.JSON_DB_APP_DIR : __dirname
const TableData = require(dir_app+'/table_data.js')
const TableConfig = require(dir_app+'/table_config.js')
const TableRelation = require(dir_app+'/table_relation.js')
const dbException = require(dir_app+'/db_exception.js')
const ObjClass = require(dir_app+'/obj_class.js')
const Plugin = (require(dir_app+'/plugin.js'))()
const ValidateData = require(dir_app+'/validate_data.js')
const Core = require(dir_app+'/data_base_core.js')

/** Core class of jsonDB.
 *
 * There are classes to use JSON files like file database.
 *
 * Using style was inspired by ORM classes.
 *
 */
class DataBase extends Core {

	/** Contain returned data from file as object or array of objects
	 * @var mixed Data from table
	 */
	constructor(settings = {}) {

		super(settings)

		/**
		* Object with setted data
		* @var object Setted data
		*/
		this.obj = {}
 
		/**
		* ID of current row if setted
		* @var integer Current ID
		*/
		this.currentId
 
		/**
		* Key if current row if setted
		* @var integer Current key
		*/
		this.currentKey

		/**
		* Information about to reset keys in array or not to
		* @var integer
		*/
		this.resetKeys = 1

	}

	/** Set table name
	 * @param string $name Name of table
	 * @return this
	 * @throws dbException If there's problems with load file
	 */
	static table(table_name, settings = {}) {

		const table = ValidateData.table(table_name, settings)
		const table_exists = table.exists()

		if (table_exists === true) {
			const db = new DataBase(settings)
			db.table_name = table_name
			db.setFields()
			db.setPending()
			return db
		}
		else {
			const err = `Table: "${table_name}" not exist`
			if (settings.console_error === true) {
				settings.consoleLog(err, __filename)
				return false
			} else throw new dbException(err)
		}
	}

	/** Set table name. Alias for table()
	 * @param string $name Name of table
	 * @return this
	 * @throws dbException If there's problems with load file
	 */
	 static from(table_name, settings = {}) {
		return this.table(table_name, settings)
	 }

	/** Creating new table
	 *
	 * For example few fields:
	 *
	 * DataBase.create('news', {
	 *  'title': 'string',
	 *  'content': 'string',
	 *  'rating': 'double',
	 *  'author': 'integer'
	 * }, settings)
	 *
	 * Types of field:
	 * - boolean
	 * - integer
	 * - string
	 * - double (also for float type)
	 * - object (without validation of nested fields)
	 * - array (without validation of nested fields)
	 *
	 * ID field isn't required (it will be created automatically) but you can specify it at first place.
	 *
	 * @uses TableData.objToLowerCase() to lower case keys and values of object
	 * @uses TableData.exists() to check if data file exists
	 * @uses TableConfig.exists() to check if config file exists
	 * @uses ValidateData.types() to check if type of fields are correct
	 * @uses TableData.put() to save data file
	 * @uses TableConfig.put() to save config file
	 * @param string $name Table name
	 * @param array $fields Field configuration
	 * @param object $settings
	 * @throws dbException If table exist
	 */
	static create(table_name, fields = {}, settings = {}) {

		const dataTable = TableData.table(table_name, settings)
		const configTable = TableConfig.table(table_name, settings)
		
		const data_exists = dataTable.exists()
		const config_exists = configTable.exists()

		if (data_exists === true && config_exists === true) {
			const err = `Table ${table_name} already exists`
			if (settings.console_error === true) {
				settings.consoleLog(err, __filename)
				return false
			} else throw new dbException(err);
		} else {

			fields = ValidateData.objToLowerCase(fields)

			const valid_types = ValidateData.types(fields)

			console.log('ValidateData.objToLowerCase(fields)', fields, 'valid_types', valid_types)

			if (valid_types === true) {

				Object.assign({'id': 'integer'}, fields)
	
				let data = new ObjClass()
				data.last_id = 0
				data.schema = fields
				data.relations = new ObjClass()
	
				if (dataTable.put([]) != false && configTable.put(data) != false) {
					return true
				}
			}
		}
		return false
	}

	/** Removing table with config
	 * @uses TableData.remove() to remove data file
	 * @uses TableConfig.remove() to remove config file
	 * @param string $name Table name
	 * @return boolean|dbException
	 */
	static remove(table_name, settings = {}) {
		
		const tableData = TableData.table(table_name, settings)
		const tableConfig = TableConfig.table(table_name, settings)

		if (tableData.remove() === true && tableConfig.remove() === true) {
			return true
		}
		return false
	}

	/** Check if the given field exists
	 * @param string $name Field name
	 * @return boolean true|false
	 */
	isset(field) {
		return (this.obj[field] != 'undefined' && this.obj[field] != null)
	}

	/** Get rows from table
	 * @uses TableData.get() to get data from file
	 * @return array
	 */
	getData() {
		return TableData.table(this.table_name, this.settings).get()
	}

	/** Setting array data to DataBase.data
	 */
	setData() {
		this.data = this.getData()
	}

	/** Returns table name
	 * @return string table name
	 */
	name() {
		return this.table_name
	}

	/** Alias name()
	 * @return string table name
	 */
	tableName() {
		return this.name()
	}

	/** Create item from object
	 * @param object $data
	 * @return boolean true|false
	 */
	objectInsert(data = {}) {

		if (!this.obj) this.obj = {}

		for (let field in data) {
			if (data[field]) this.obj[field] = data[field]
		}

		if (this.obj) {
			this.save()
			this.setFields()
			this.clearKeyInfo()
			this.setPending()
		} else return false

		return true
	}

	/** Bulk Insert Data
	 * @param mixed $data array or object
	 * @return boolean true|false
	 */
	bulkInsert(data) {
		if (Array.isArray(data) && data.length >= 1) {
			for (let value of data) {
				this.objectInsert(value)
			}
		} else if (typeof data == 'object') {
			this.objectInsert(data)
		} else {
			const err = `Invalid data format. Expected: array or object. data: ${data}`
			if (settings.console_error === true) {
				settings.consoleLog(err, __filename)
				return false
			} else throw new dbException(err)
		}
		return true
	}

	/** Returns array key of row with specified ID
	 * @param integer $id Row ID
	 * @return integer row key
	 * @throws dbException If there's no data with that ID
	 */
	getRowKey(id) {

		this.data = this.getData()

		if (this.data.length >= 1) {
			for (let i in this.data) {
				let v = this.data[i]
				if (v.id == Number(id)) {
					return i;
					break;
				}
			}
		} else {
			const err = `No data found with ID: ${id}`
			if (settings.console_error === true) {
				settings.consoleLog(err, __filename)
				return false
			} else throw new dbException(err)
		}
	}

	/** Set NULL for currentId and currentKey and item id
	 */
	clearKeyInfo() {
		this.currentId = this.currentKey = this.obj.id = 0
	}

	/** Setting fields with default values
	 * @uses Plugin.isNumeric() to check if type of field is numeric
	 */
	setFields() {

		const schema = this.schema()

		for (let field in schema) {

			Object.defineProperty(this, field, {
				set: function(value) { this.obj[field] = value; },
				get: function() { return this.obj[field]; },
				configurable: true
			})

			const type = schema[field]

			if (Plugin.isNumeric(type) && field != 'id') this[field] = 0
			else this[field] = null
			
		}
	}

	/** Clear info about previous queries
	 */
	clearQuery() {
		this.setPending()
		this.clearKeyInfo()
		return true
	}

	/** Execute pending functions
	 */
	pendingData() {
		this.setData()
		for (let func in this.pending) {
			let args = this.pending[func]
			if (args != '' && args != undefined) {
				let functionName = func+'Pending'
				this[functionName]()
			}
		}
		//clear pending values after executed query
		this.clearQuery()
		return true
	}

	/** Pending function for with(), joining other tables to current
	 * @return true or false
	 */
	withPending() {
		
		const joins = this.pending['with']

		if (joins.length >= 1) {
			for (let join of joins) {
			
				const local = (join.length >= 1) ? join.slice(-2, 1)[0] : this.table_name
				const foreign = (join[(join.length-1)]) ? join[(join.length-1)] : null
				const relation = TableRelation.table(local, this.settings).with(foreign)
	
				let data = this.data
	
				for (let part of join) {
					data = relation.build(data, part)
				}
			}
			return true
		} else return false
	}

	/** Filter function for array.filter() in where()
	 * @return boolean
	 */
	wherePending() {

		this.data = this.data.filter(row => {

			const pending = this.pending['where']

			let clause = '',
				result = true

			if(pending.length >= 1) {

				const operator = this.getOperator()

				for(let key in pending) {

					let condition = pending[key]
				
					for(let name in condition) {
						this[name] = condition[name]
					}

					if (Array.isArray(this.value) && this.op == 'IN') {
						this.value = (Plugin.inArray(row[this.field], this.value)) ? 1 : 0
						this.op = '=='
						this.field = 1
					} else if (!Array.isArray(this.value) && Plugin.inArray(this.op, ['LIKE', 'like'])) {
						//let specials = '.\+*?[^]$(){}=!<>|:-';
						let preg = Plugin.pregQuote(this.value)
						let regex = "/^"+preg.replace('%', '(.*?)')+'$/si'
						this.value = row[this.field].match(regex)
						this.op = '=='
						this.field = 1
					} else if (!Array.isArray(this.value) && this.op != 'IN') {
						this.value = Plugin.isString(this.value) ? `"${this.value.toLowerCase()}"` : this.value
						this.op = operator[this.op] ? operator[this.op] : '=='
						this.field = Plugin.isString(row[this.field]) ? `"${row[this.field].toLowerCase()}"` : row[this.field]
					}

					this.type = (key == 0) ? null : ' '+operator[this.type]

					clause += [this.type, this.field, this.op, this.value].join(' ')
 
				}

				delete this.type
				delete this.field
				delete this.op
				delete this.value
			}

			if (clause != '') result = eval(clause)

			return result
		})
	}

	/** Grouping results by one field
	 * @param string $column
	 * @return this
	 */
	groupBy(column) {

		const valid_column = ValidateData.table(this.table_name, this.settings).field(column)

		if (valid_column === true) {
			this.resetKeys = 0
			this.pending['groupBy'] = column
		}
		
		return this
	}

	/** Grouping array pending method
	 */
	groupByPending() {
		
		const column = this.pending['groupBy'], grouped = []
		const data = this.data
		
		for (let object of data) {
			grouped[object[column]] = object
		}
		
		this.data = grouped

		return true
	}

	/** Pending function for limit()
	*/
	limitPending() {
		const limit = this.pending['limit']
		const offset = limit['offset']
		const number = limit['number']
		this.data = this.data.slice(offset, number)
		return true
	}

	/** Returning data as indexed or assoc array.
	 * @param string key Field that will be the key, NULL for Indexed
	 * @param string value Field that will be the value
	 * @return array
	 */
	asArray(key = null, value = null) {
		
		const isNull = Plugin.isNull
		
		if (!isNull(key)) {
			ValidateData.table(this.table_name, this.settings).field(key)
		}
		if (!isNull(value)) {
			ValidateData.table(this.table_name, this.settings).field(value)
		}

		let res = {}
		
		if (!this.resetKeys) {

			if (isNull(key) && isNull(value)) {
				return this.data
			} else {
				for (let rowKey in this.data) {
					
					let data = this.data[rowKey]
					
					res[rowKey] = {}
					
					for (let row of data) {
						if (isNull(key)) {
							res[rowKey] = row[value]
						}
						else if (isNull($value)) {
							res[rowKey][row[key]] = row
						}
						else {
							res[rowKey][row[key]] = row[value]
						}
					}
				}
			}
		} else {
			if (isNull(key) && isNull(value)) {
				for(let data of this.data) {
					res = get_object_vars(data) //!!!
				}
			} else {
				for (let data of this.data) {
					if (isNull(key)) {
						res = data[value]
					}
					else if (isNull(value)) {
						res[data[key]] = data
					}
					else {
						res[data[key]] = data[value]
					}
				}
			}
		}

		return res
	}

	/** Add new fields to table, array schema like in create() function
	 * @param array $fields Associative array
	 */
	addFields(fields = []) {
		
		fields = ValidateData.arrToLower(fields)

		const values = Plugin.arrayValues(fields)
		const types = ValidateData.types(values)
		const schema = this.schema()

		fields = Plugin.arrayDiffAssoc(fields, schema)

		if (fields) {

			let config = this.config()
			config.schema = Plugin.arrayMerge(schema, fields)

			let data = this.getData()

			for(let key in data) {

				//let object = data[key]
				for(let name in fields) {
					let type = fields[name]
					if (Plugin.isNumeric(type)) data[key][name] = 0
					else data[key][name] = null
				}
			}

			Data.table(this.table_name, this.settings).put(data)
			Config.table(this.table_name, this.settings).put(config)
		}
	}

	/** Delete fields from array
	 * @param array $fields Indexed array
	 */
	deleteFields(fields = []) {

		fields = ValidateData.arrToLower(fields)

		const table_fields = ValidateData.table(this.table_name, this.settings).fields(fields)

		if (table_fields === true) {

			let config = this.config()
		
			config.schema = Plugin.arrayDiffKey(this.schema(), Plugin.arrayFlip(fields))

			let data = this.getData()
		
			for(let key in data) {
				for(let name of fields) {
					delete data[key][name]
				}
			}

			Data.table(this.table_name, this.settings).put(data)
			Config.table(this.table_name, this.settings).put(config)

		} else {
			const err = `fields: ${fields.split(', ')} Validate Error`
			if (settings.console_error === true) {
				settings.consoleLog(err, __filename)
				return false
			} else throw new dbException(err)
		}
	}

	/** Returning assoc array with relationed tables
	 * @param string|null $tableName
	 * @return array Fields type
	 */
	relations(tableName = null) {
		return TableConfig.table(this.table_name).relations(tableName, true)
	}

	/** Returning last ID from table
	 * @return integer Last ID
	 */
	lastId() {
		return TableConfig.table(this.table_name, this.settings).lastId()
	}

	/** Saving inserted or updated data
	 */
	save() {

		let data = this.getData()

		if (!this.currentId) {

			let table_config = this.config()
			
			table_config.last_id++
			
			TableConfig.table(this.table_name, this.settings).put(table_config)

			this.obj.id = table_config.last_id

			if (!Array.isArray(data)) data = []

			data.push(this.obj)
  
		} else {
			this.obj.id = this.currentId
			data[this.currentKey] = this.obj
		}

		TableData.table(this.table_name, this.settings).put(data)

		return true
	}

	/** Deleting loaded data
	 * @return boolean
	 */
	delete() {

		let data = this.getData()

		if (this.currentId >= 1) {

			this.currentKey = this.getRowKey(this.currentId)

			delete data[this.currentKey]

		} else {
			this.pendingData()
			let old = data
			data = Plugin.arrayDiffKey(old, this.data)
		}

		this.data = Plugin.arrayValues(data)

		let res = TableData.table(this.table_name, this.settings).put(this.data)

		this.setFields()
		this.clearKeyInfo()
		this.setPending()

		return res ? true : false
	}

	clear() {
		const schema = this.schema()
		for (let field in schema) {
			Object.defineProperty(this, field, {
				set: undefined,
				get: undefined
			})
		}
		this.obj = {}
		this.setFields()
		this.setPending()
		this.clearKeyInfo()
		return true
	}

	/** Return count in integer or array of integers (if grouped)
	 * @return mixed
	 */
	count() {
		let count = {}
		if (!this.resetKeys) {
			for (let group in this.data) {
				let data = this.data[group]
				count[group] = data.length
			}
		} else {
			count = this.data.length
		}
		return count
	}

	/** Returns one row with specified ID
	 * @param integer $id Row ID
	 * @return \jsonDB\Database
	 */
	find(id = null) {

		if (id !== null) {

			this.currentId = id
			this.currentKey = this.getRowKey(id)

			if (this.data.length >= 1 && this.data[this.currentKey]) {

				const data_item = this.data[this.currentKey]
			
				for(let field in data_item) {
					this[field] = data_item[field]
				}

				this.data = []
				this.currentKey = 0

			} else return false
		}
		else {

			this.setData()
			this.limit(1)
			this.findAll()

			if (this.data.length >= 1) {

				// this.currentKey = this.getRowKey(this.currentId)
				this.currentKey = 0
				
				const data_item = this.data[0]

				this.data = []

				for(let field in data_item) {
					this.obj[field] = data_item[field]
				}
				this.currentId = this.obj.id
			}
		}
		return this
	}

	getById(id) {
		return find(id)
	}

	/** Make data ready to read
	 */
	findAll() {
		this.pendingData()
		this.data = this.resetKeys ? Plugin.arrayValues(this.data) : this.data
		return this
	}

	/** Debug functions, prints whole query with values
	 */
	debug() {
		
		let print = `jsonDbJs.table(${this.table_name})\n`
		
		for(let key in this.pending) {
			
			let values = this.pending[key]
			
			if (values) {

				if (Array.isArray(values)) {
					
					if (Array.isArray(values[0])) {
						
						for(let value of values) {
							
							if (key == 'where') {
								array_shift(value)
							}
							
							if (key == 'with') {
								params = value.join(':')
							}
							else {
								params = value.join(', ')
							}
							print += '\t ->'+key+'('+params+') \n'
						}
					}
					else {
						params = values.join(', ')
						print += '\t ->'+key+'('+params+')'+'\n'
					}
				}
				else {
					print += '\t ->'+key+'('+values+')'+'\n'
				}
			}
		}
		console.log(print)
		clearQuery()
	}
}
  
module.exports = DataBase