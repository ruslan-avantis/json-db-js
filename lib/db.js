'use strict'

const dir_app = process.env.JSON_DB_APP_DIR ? process.env.JSON_DB_APP_DIR : __dirname
const dbException = require(dir_app+'/db_exception.js')
const ObjClass = require(dir_app+'/obj_class.js')
const Plugin = require(dir_app+'/plugin.js')
//const TableData = require(dir_app+'/table_data.js')
//const TableConfig = require(dir_app+'/table_config.js')
const Relation = require(dir_app+'/table_relation.js')
const Validate = require(dir_app+'/validate.js')

/** Core class of json Data Base.
 *
 * There are classes to use JSON files like file database.
 * Using style was inspired by ORM classes.
 */
class DataBase {

	/** Contain returned data from file as object or array of objects
	 * @var mixed Data from table
	 */
	constructor(settings = {}) {

		/** Name of file (table)
		* @var string Name of table
		*/
		this.table_name

		/** Name of table
		* @var string
		*/
		this.data = []

		/** Pending functions with values
		* @see Database.setPending()
		* @var array
		*/
		this.pending = {}

		/** Validate class
		* @var function
		*/
		this.Validate

		/** Object with setted data
		* @var object Setted data
		*/
		this.obj = {}
 
		/** ID of current row if setted
		* @var integer Current ID
		*/
		this.currentId
 
		/** Key if current row if setted
		* @var integer Current key
		*/
		this.currentKey

		/** Information about to reset keys in array or not to
		* @var integer
		*/
		this.resetKeys = 1

		/** 
		* @var integer totalCount()
		*/
		this.total_count

		/** Settings class
		* @var object
		*/
		this.settings = {}
		if (settings) Object.assign(this.settings, settings)

	}

	/** Set table name
	 * @param string $name Name of table
	 * @return this
	 * @throws this.Error If there's problems with load file
	 */
	static table(table_name, settings = {}) {

		const table = Validate.table(table_name, settings)
		const table_exists = table.exists()

		if (table_exists === true) {
			const db = new DataBase(settings)
			db.table_name = table_name
			db.Validate = table
			db.setFields()
			db.setPending()
			return db
		} else {
			const err = `Table: "${table_name}" not exist`
			if (settings.console_error === true) {
				settings.consoleLog(err, __filename)
				return false
			} else throw new this.Error(err)
		}
	}

	/** Set table name. Alias for table()
	 * @param string $name Name of table
	 * @return this
	 * @throws this.Error If there's problems with load file
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
	 * @uses Validate.types() to check if type of fields are correct
	 * @uses TableData.put() to save data file
	 * @uses TableConfig.put() to save config file
	 * @param string $name Table name
	 * @param array $fields Field configuration
	 * @param object $settings
	 * @throws this.Error If table exist
	 */
	static create(table_name, fields = {}, settings = {}) {

		const table = Validate.table(table_name, settings)

		const data_exists = table.Data.exists()
		const config_exists = table.Config.exists()

		

		if (data_exists === true && config_exists === true) {
			const err = `Table ${table_name} already exists`
			if (settings.console_error === true) {
				settings.consoleLog(err, __filename)
				return false
			} else throw new this.Error(err)
		} else {

			fields = Validate.objToLowerCase(fields)

			const valid_types = Validate.types(fields)

			if (valid_types === true) {

				Object.assign({'id': 'integer'}, fields)
	
				let data = new ObjClass()
				data.last_id = 0
				data.schema = fields
				data.relations = {}

				let dataPut = table.Data.put([])
				let configPut = table.Config.put(data)

				//console.log('----- create() ------ ', dataPut, configPut)
	
				if (dataPut != false && configPut != false) {
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
	 * @return boolean|this.Error
	 */
	static remove(table_name, settings = {}) {
		const table = Validate.table(table_name, settings)
		//const tableData = TableData.table(table_name, settings)
		//const tableConfig = TableConfig.table(table_name, settings)

		if (table.Data.remove() === true && table.Config.remove() === true) {
			return true
		}
		return false
	}

	/** get operators ['=', '==', '===', '<>', '!=', '!==', '>', '<', '>=', '<=', 'and', 'or']
	 * @return object operators
	 */
	getOperator() {
		return {
			'==': '==',
			'===': '===',
			'=': '==',
			'!=': '!=',
			'!==': '!==',
			'<>': '!=',
			'>': '>',
			'<': '<',
			'>=': '>=',
			'<=': '<=',
			'and': '&&',
			'or': '||',
			'AND': '&&',
			'OR': '||',
			'like': 'LIKE',
			'LIKE': 'LIKE',
			'IN': 'IN',
			'NOT IN': 'NOT IN'
		}
	}

	/** Set pending functions in right order with default values (Empty).
	 * @set object this.pending
	 * @return boolean true
	 */
	setPending() {
		this.pending = {
			'where': [],
			'orderBy': [],
			'limit': {},
			'with': [],
			'groupBy': []
		}
		return true
	}

	obj() {
		return this.obj
	}

	/** Returning object with config for table
	 * @return object Config
	 */
	config() {
		return this.Validate.Config.get()
	}

	/** Return array with names of fields
	 * @return array Fields
	 */
	fields() {
		return this.Validate.Config.fields()
	}

	/** Returning assoc array with types of fields
	 * @return array Fields type
	 */
	schema() {
		return this.Validate.Config.schema()
	}

	/** random uid
	 */
	randomUid(length = 16) {
		return Plugin.randomInteger(length, 32)
	}

	/** get alias
	 * @return uuid.v4()
	 */
	alias() {
		return Plugin.v4()
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
		return this.Validate.Data.get()
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
	table_name() {
		return this.table_name
	}

	/** Create item from object
	 * @param object $data
	 * @return boolean true|false
	 */
	objectInsert(data = {}) {

		const schema = this.schema()

		for (let field in data) {

			if (schema[field]) {

				let value = data[field]
				let valid_value = this.Validate.type(field, value)

				if (valid_value === true) {

					let type = schema[field]

					this[field] = Plugin.valueToType(type, value)
				}
			}
		}

		if (this.obj) {
			this.save()
			this.clear()
			return true
		} else return false

	}

	/** Bulk Insert Data
	 * @param mixed $data array or object
	 * @return boolean true|false
	 */
	bulkInsert(data) {
		if (Array.isArray(data) && data.length >= 1) {
			for (let obj of data) {
				this.objectInsert(obj)
			}
		} else if (typeof data == 'object') {
			this.objectInsert(data)
		} else {
			const err = `Invalid data format. Expected: array or object. data: ${data}`
			if (settings.console_error === true) {
				settings.consoleLog(err, __filename)
				return false
			} else throw new this.Error(err)
		}
		return true
	}

	/** Returns array key of row with specified ID
	 * @param integer $id Row ID
	 * @return integer row key
	 * @throws this.Error If there's no data with that ID
	 */
	getRowKey(id, data = []) {

		if (!data[0]) {
			data = this.getData()
			this.data = data
		}

		if (data.length >= 1) {
			for (let i in data) {
				let v = data[i]
				if (v.id == Number(id)) {
					return i;
					break;
				}
			}
		} else {
			const err = `No data found with id: ${id}`
			if (this.settings.console_error === true) {
				this.settings.consoleLog(err, __filename)
				return false
			} else throw new this.Error(err)
		}
	}

	clearData() {
		this.data = []
	}

	/** Set NULL for currentId and currentKey and item id
	 */
	clearKeyInfo() {
		this.currentId = this.currentKey = this.obj.id = null
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

	/**  Where function, like SQL
	 *
	 * Operators:
	 * - Standard operators (=, ==, ===, !=, !==, <>, >, <, >=, <=)
	 * - IN (only for array value)
	 * - NOT IN (only for array value)
	 *
	 * @param string field Field name
	 * @param string op Operator
	 * @param mixed value Field value
	 * @return this
	 */
	where(field, op, value, type = 'and') {

		value = this.Validate.type(field, value)

		const valid_field = this.Validate.field(field)
		const valid_op = this.getOperator()[op] ? true : false
		const valid_type = (type == 'and' || type == 'or') ? true : false

		if (valid_field === true && valid_op === true && valid_type === true) {
			this.pending.where.push({
				'type': type,
				'field': field,
				'op': op,
				'value': value
			})
		}
		return this
	}

	/** Alias for where()
	 * @param string field Field name
	 * @param string op Operator
	 * @param mixed value Field value
	 * @return this
	 */
	andWhere(field, op, value) {
		this.where(field, op, value)
		return this
	}

	/**  Alias for where(), setting OR for searching
	 * @param string $field Field name
	 * @param string $op Operator
	 * @param mixed $value Field value
	 * @return this
	 */
	orWhere(field, op, value) {
		this.where(field, op, value, 'or')
		return this
	}

	/** JOIN other tables
	 * @param string table relations separated by :
	 * @return this
	 */
	with(join_table) {
		this.pending.with = join_table.split(':')
		return this
	}

	/** Sorting data by field
	 * @param string key Field name
	 * @param string direction ASC|DESC
	 * @return this
	 */
	orderBy(key, direction = 'ASC') {
		const valid_field = this.Validate.field(key)
		if (valid_field === true) {
			const directions = {
				'ASC': 'asc',
				'DESC': 'desc'
			}
			let sort = [key, (directions[direction] ? directions[direction] : 'asc')]
			this.pending.orderBy.push(sort)
		}
		return this
	}

	/** properties an sql-like string
	 * "city, price desc" or "city ASC, price DESC"
	 * @param string $string_sql
	 * @return array
	 */
	#stringSQL(string_sql) {
		let arr = string_sql.split(/\s*,\s*/).map((prop) => {
			prop = prop.match(/^([^\s]+)(\s*desc)?/i)
			if(prop[2] && (prop[2].toLowerCase()).trim() === 'desc') {
				return [prop[1] , 'DESC']
			}
			else return [prop[1] , 'ASC']
		})
		return arr
	}

	/** Sorting data by field
	 * @param string sql like
	 * @return this
	*/
	orderBySql(string_sql_like) {
		let arr = this.#stringSQL(string_sql_like)
		if (arr.length >= 1) {
			for (let v of arr) {
				this.orderBy(v[0], v[1])
			}
		}
		return this
	}

	/** Sort function by multiple fields
	 * @param array [['id', 'desc'],['title', 'asc']]
	 * @return function
	 */
	#orderByFieldSort(fields) {
		return (a, b) => fields.map(c => {
			let dir = 1
			if (c[1] === 'desc') dir = -1
			let field = c[0]
			// if (c[0] === '-') { dir = -1; field=c.substring(1); } else field=c
			// return x > y ? 1 : x < y ? -1 : 0
			return a[field] > b[field] ? dir : a[field] < b[field] ? -(dir) : 0
		}).reduce((p, n) => p ? p : n, 0)
	}

	/** Grouping results by one field
	 * @param string $column
	 * @return this
	 */
	groupBy(column) {

		const valid_column = this.Validate.field(column)

		if (valid_column === true) {
			this.resetKeys = 0
			this.pending['groupBy'] = column
		}

		return this
	}

	/** Limit returned data
	 *
	 * Should be used at the end of chain, before end method
	 * @param integer $number Limit number
	 * @param integer $offset Offset number
	 * @return this
	 */
	limit(number, offset = 0) {
		this.pending.limit = {offset, number}
		return this
	}

	/** offset returned data
	 *
	 * Should be used at the end of chain, before end method
	 * @param integer $offset Offset number
	 * @return this
	 */
	offset(offset) {
		this.pending.limit.offset = offset
		return this
	}

	/** Filter function for array.filter() in where()
	 * @return boolean
	 */
	wherePending() {

		this.data = this.data.filter(row => {

			const pending = this.pending.where

			let clause = '',
				result = true

			if (pending.length >= 1) {

				const operator = this.getOperator()

				for(let key in pending) {

					let condition = pending[key]
				
					for(let name in condition) {
						this[name] = condition[name]
					}

					let value = row[this.field]
					let value_in_array = Plugin.inArray(value, this.value)
					let value_is_array = Array.isArray(this.value)

					if (value_is_array && this.op == 'NOT IN') {
						this.value = (value_in_array) ? 1 : 0
						this.op = '!='
						this.field = 1
					} else if (value_is_array && this.op == 'IN') {
						this.value = (value_in_array) ? 1 : 0
						this.op = '=='
						this.field = 1
					} else if (!value_is_array && Plugin.inArray(this.op, ['LIKE', 'like'])) {

						//let specials = '.\+*?[^]$(){}=!<>|:-';
						//let preg = Plugin.pregQuote(this.value)
						//let regex = "/^"+preg.replace('%', '(.*?)')+'$/si'
						//this.value = row[this.field].match(regex)

						value = value.toLowerCase()
						this.value = this.value.toLowerCase()
						const index_of = value.indexOf(this.value)

						this.value = (index_of != -1) ? 1 : 0
						this.op = '=='
						this.field = 1

					} else if (!value_is_array && this.op != 'IN') {
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

	/** Pending function for with(), joining other tables to current
	 * @return true or false
	 */
	withPending() {
		
		const joins = this.pending.with

		if (joins.length >= 1) {

			for (let join of joins) {
			
				const local = (join.length >= 1) ? join.slice(-2, 1)[0] : this.table_name
				const foreign = (join[(join.length-1)]) ? join[(join.length-1)] : null

				const relation_table = Relation.with(foreign)
	
				let data = this.data
	
				for (let part of join) {
					data = relation_table.build(data, part)
				}
			}
			return true
		} else return false
	}

	/** Grouping array pending method
	 */
	groupByPending() {
		const column = this.pending.groupBy
		if (column.length >= 1) {
			const grouped = []

			for (let object of this.data) {
				grouped[object[column]] = object
			}
			
			this.data = grouped
		}
		return true
	}

	/** Sort an array of objects by more than one field.
	 */
	orderByPending() {
		// this.pending.orderBy = [['id', 'desc'],['title', 'asc']]
		let order_param = this.pending.orderBy
		if (Array.isArray(order_param) && order_param.length >= 1) {
			this.data.sort(this.#orderByFieldSort(order_param))
		}
		// Sort by id by default
		else this.data.sort((x, y) => {
			return x.id > y.id ? 1 : x.id < y.id ? -1 : 0
		})
	}

	/** Pending function for limit()
	*/
	limitPending() {
		const limit = this.pending['limit']
		const offset = limit['offset']
		let number = limit['number']

		this.total_count = this.data.length
		if (number > this.total_count) number = this.total_count

		this.data = this.data.slice(offset, number)

		return true
	}

	/** Execute pending functions
	 */
	pendingData() {

		this.setData()

		for (let func in this.pending) {
			let args = this.pending[func]
			if (args) {
				let functionName = func+'Pending'
				this[functionName]()
			}
		}
		//clear pending values after executed query
		this.clearQuery()
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
			//this.Validate.field(key)
		}
		if (!isNull(value)) {
			//this.Validate.field(value)
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
		
		//fields = this.validate.arrToLower(fields)

		const values = Plugin.arrayValues(fields)
		//const types = Validate.types(values)
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

			this.Validate.Data.put(data)
			this.Validate.Config.put(config)
		}
	}

	/** Delete fields from array
	 * @param array $fields Indexed array
	 */
	deleteFields(fields = []) {

		//!!!
		// fields = Validate.arrToLower(fields)

		const validate_fields = this.Validate.fields(fields)

		if (validate_fields === true) {

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
			if (this.settings.console_error === true) {
				this.settings.consoleLog(err, __filename)
				return false
			} else throw new this.Error(err)
		}
	}

	/** Returning assoc array with relationed tables
	 * @param string|null $tableName
	 * @return array Fields type
	 */
	relations(tableName = null) {
		return this.Validate.Config.relations(tableName, true)
	}

	/** Returning last ID from table
	 * @return integer Last ID
	 */
	lastId() {
		return this.Validate.Config.lastId()
	}

	/** Saving inserted or updated data
	 */
	save() {

		let data = this.getData()

		if (this.currentId == null) {
			let table_config = this.config()
			table_config.last_id++
			this.obj.id = table_config.last_id
			this.currentId = table_config.last_id
			this.Validate.Config.put(table_config)
			if (!Array.isArray(data)) data = []
			data.push(this.obj)
		} else if (this.currentId != null) {
			this.currentKey = this.getRowKey(this.currentId, data)
			this.obj.id = this.currentId
			data[this.currentKey] = this.obj
		} else return false

		this.Validate.Data.put(data)
		this.data = []

		return true
	}

	/** Deleting loaded data
	 * @return boolean
	 */
	delete() {

		let data = this.getData()

		if (this.currentId >= 1) {

			this.currentKey = this.getRowKey(this.currentId, data)

			delete data[this.currentKey]

		} else {
			this.pendingData()
			let old = data
			data = Plugin.arrayDiffKey(old, this.data)
		}

		this.data = Plugin.arrayValues(data)

		let res = this.Validate.Data.put(this.data)

		this.setFields()
		this.clearKeyInfo()
		this.setPending()

		return res ? true : false
	}

	clear() {
		const schema = this.schema()
		for (let field in schema) {
			delete this[field]
			//Object.defineProperty(this, field, {
				//set: undefined,
				//get: undefined
			//})
		}
		if (this.obj) this.obj = {}
		this.setFields()
		this.setPending()
		this.clearKeyInfo()
		return true
	}

	/** Return count in integer or array of integers (if grouped)
	 * @return mixed
	 */
	count() {
		return this.data.length
	}

	totalCount() {
		return this.total_count
	}

	/** Returns one row with specified ID or object fields
	 * @param mixed $data item id or object fields
	 * @return object item
	 */
	find(data) {
		let res = {}
		if (typeof data == 'object') {
			res = this.findObj(data)
		} else if (Plugin.isInt(data)) {
			res = this.findId(Number(data))
		} else {
			const err = `Error param data: ${data}`
			if (this.settings.console_error) {
				this.settings.consoleLog(err, __filename)
				return false
			} else throw new this.Error(err)
		}
		return res
	}

	/** Returns one row with specified ID
	 * @param integer $id Row ID
	 * @return object item
	 */
	findId(id = null) {
		if (id !== null) {

			this.data = this.getData()
			this.currentKey = this.getRowKey(id, this.data)

			if (this.data.length >= 1 && this.data[this.currentKey]) {

				const data_item = this.data[this.currentKey]
			
				for(let field in data_item) {
					this[field] = data_item[field]
				}
				this.obj.id = data_item.id
				this.currentId = this.obj.id
				this.data = []
				this.currentKey = null

			} else return false
		} else {

			this.setData()
			this.limit(1, 0)
			this.findAll()

			if (this.data.length >= 1) {

				// this.currentKey = this.getRowKey(this.currentId)
				
				const data_item = this.data[0]

				this.data = []

				for(let field in data_item) {
					this.obj[field] = data_item[field]
				}
				this.obj.id = data_item.id
				this.currentKey = null
				this.currentId = this.obj.id
			}
		}
		return this.obj
	}

	getById(id) {
		return findId(id)
	}

	/** Returns one row with specified ID
	 * @param integer $id Row ID
	 * @return object item
	 */
	findObj(obj = {}) {

		if (!obj) return false

		this.clear()

		for (let key in obj) {
			this.where(key, '=', obj[key])
		}

		this.limit(1)
		this.findAll()

		if (this.data[0] && this.data[0].id) {

			const data_item = this.data[0]

			this.data = []

			for(let field in data_item) {
				this.obj[field] = data_item[field]
			}

			this.currentKey = null
			this.currentId = this.obj.id
		}
		
		return this.obj
	}

	/** Make data ready to read
	 */
	findAll() {
		this.pendingData()
		//this.data = this.resetKeys ? Plugin.arrayValues(this.data) : this.data
		return this
	}

	/** Debug functions, prints whole query with values
	 */
	#debug() {
		
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

DataBase.Error = class extends dbException {
	constructor(message, code) {
	  super(message)
	  this.code = code
	}
}
  
module.exports = DataBase