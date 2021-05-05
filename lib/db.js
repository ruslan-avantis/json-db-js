'use strict'

const { indexOf } = require("benchmark")

const dir_app = process.env.JSON_DB_APP_DIR ? process.env.JSON_DB_APP_DIR : __dirname
const {DbJsonError, FatalError, ParseError, BaseError } = require(dir_app+'/db_exception.js')
const ObjClass = require(dir_app+'/obj_class.js')
const Plugin = require(dir_app+'/plugin.js')
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

	static test() {
		return 'test OK'
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
			const res = new DataBase(settings)
			res.table_name = table_name
			res.Validate = table
			res.setFields()
			res.setPending()
			return res
		} else {
			const err = `Table: "${table_name}" not exist`
			if (settings.console_error === true) {
				settings.consoleLog(err, __filename)
				return false
			} else throw new DbJsonError(err)
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
			} else throw new DbJsonError(err)
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

	static #formatWhere(format, table) {
		if (format.where != null) {
			let where_arr = this.#whereParse(format.where)
			for (let v of where_arr) {
				if (v.type != 'AND' || v.type != 'OR') v.type = 'AND'
				table.where(v.column, v.operator, v.value, v.type)
			}
		}
	}

	static #formatOrderBy(format, table) {
		if (format.orderby != null) {
			for (let v of format.orderby) {
				table.orderBy(v.expr.column, v.type)
			}
		}
	}

	static #formatLimit(format, table) {
		if (format.limit != null) {
			let limit = format.limit.value[0].value ? format.limit.value[0].value : 0
			let offset = format.limit.value[1].value ? format.limit.value[1].value : 0
			table.limit(limit, offset)
		}
	}

	static #formatWith(format, table) {
		if (format.with != null) {
			for (let v of format.with) {
				table.with(v.join_table)
			}
		}
	}

	static #formatGroupBy(format, table) {
		if (format.groupby != null) {
			for (let v of format.groupby) {
				table.groupBy(v.column)
			}
		}
	}

	static #formatColumns(format, table) {
		if (format.columns != null) {
			let columns_arr = []
			for (let v of format.columns) {
				if (v.expr && v.expr.column) {
					let as = v.as ? v.as : null
					columns_arr.push({'column': v.expr.column, as})
				}
			}
			table.columns(columns_arr)
		}
	}

	static #whereParse(where, op = 'AND') {
		//console.log('op', op, where)
		let arr = []
		if (where.operator == 'AND' || where.operator == 'OR') {
			let arr2 = this.#whereParse(where.left, where.operator)
			arr = arr.concat(arr2)
			let arr3 = this.#whereParse(where.right, where.operator)
			arr = arr.concat(arr3)
		} else if (where.left.column && where.right.value) {
			let obj = {}
			obj.column = where.left.column
			obj.value = where.right.value
			obj.operator = where.operator
			obj.type = op
			arr.push(obj)
		}
		return arr
	}

	static #tableParse(ast, settings = {}) {
		let tables = []
		if (ast.from && ast.from.length >= 1) {
			for(let key in  ast.from) {
				let table_alias = ast.from[key].as ? ast.from[key].as : ast.from[key].table
				let table_connect = this.table(ast.from[key].table, settings)
				tables.push({
					'table_name': ast.from[key].table,
					'table_alias': table_alias,
					'as': ast.from[key].as,
					'ast': ast.from[key],
					'connect': table_connect,
					'data': table_connect.getData()
				})
			}
		} else if (ast.table && ast.table.length >= 1) {
			for(let key in  ast.table) {
				let table_alias = ast.table[key].as ? ast.table[key].as : ast.table[key].table
				let table_connect = this.table(ast.table[key].table, settings)
				tables.push({
					'table_name': ast.table[key].table,
					'table_alias': table_alias,
					'as': ast.table[key].as,
					'ast': ast.table[key],
					'connect': table_connect,
					'data': table_connect.getData()
				})
			}
		}
		return tables
	}

	static query(sql, values = [], settings = {}) {

		//const { Parser } = require('node-sql-parser')
		const parser = new (Plugin.Parser())()

		const format = parser.astify(sql)

		//console.log('format', JSON.stringify(format, null, 2))

		let table_name

		if (format.from && format.from[0] && format.from[0].table) {
			table_name = format.from[0].table
		} else if (format.table && format.table[0] && format.table[0].table) {
			table_name = format.table[0].table
		}
		
		if (table_name != false && format.type) {

			let table = this.table(table_name, settings)

			if (format.type == 'select') {

				this.#formatWhere(format, table)
				this.#formatWith(format, table)
				this.#formatGroupBy(format, table)
				this.#formatOrderBy(format, table)
				this.#formatLimit(format, table)
				this.#formatColumns(format, table)
				//console.log('query pending --> ', table.pending)
				table.findAll()
	
				return table.data ? table.data : []

			} else if (format.type == 'insert') {

				let arr = []
				let values = format.values ? format.values : null
				let columns = format.columns ? format.columns : null
				
				if (values != null && Array.isArray(values) && values.length >= 1 && columns != null && Array.isArray(columns) && columns.length >= 1) {
					for (let arr_values of values) {
						let obj = {}
						for (let key in arr_values.value) {
							let value = arr_values.value[key].value
							let column = columns[key]
							obj[column] = value
						}
						arr.push(obj)
					}
				}

				let set_values = format.set ? format.set : null

				if (set_values != null && Array.isArray(set_values) && set_values.length >= 1) {
					let obj = {}
					for (let arr_values of set_values) {
						let value = arr_values.value.value
						let column = arr_values.column
						obj[column] = value
					}
					arr.push(obj)
				}

				if (arr.length >= 1) {
					console.log('insert', arr)
					return table.insert(arr)
				}
			} else if (format.type == 'update') {

				this.#formatWhere(format, table)
				this.#formatOrderBy(format, table)
				this.#formatLimit(format, table)
				table.findAll()

				let data = table.data ? table.data : [],
					obj = {},
					set_values = format.set ? format.set : null

				if (set_values != null && Array.isArray(set_values) && set_values.length >= 1) {
					for (let arr_values of set_values) {
						let value = arr_values.value.value
						let column = arr_values.column
						obj[column] = value
					}
				}

				if (data.length >= 1) {
					for (let key in data) {
						for (let col in obj) {
							if (data[key][col]) data[key][col] = obj[col]
						}
					}
					return table.update(data)
				}
			} else if (format.type == 'delete') {
				this.#formatWhere(format, table)
				this.#formatOrderBy(format, table)
				this.#formatLimit(format, table)
				return table.delete()
			}
		}
		return false
	}

	static queryMulti(sql_string, settings = {}) {

		const parser = new (Plugin.Parser())()
		const ast = parser.astify(sql_string)

		if (ast.type) {

			let tables = this.#tableParse(ast, settings), res = []

			if (tables.length >= 1) {
				for (let table_key in tables) {

					let table  = tables[table_key]
					let left_table  = tables[Number(table_key)-1] ? tables[Number(table_key)-1] : false
	
					if (ast.type == 'select') {
						if (table_key == 0) {
	
							this.#formatWhere(ast, table.connect)
							this.#formatWith(ast, table.connect)
							this.#formatGroupBy(ast, table.connect)
							this.#formatOrderBy(ast, table.connect)
							this.#formatLimit(ast, table.connect)
							this.#formatColumns(ast, table.connect)
							//console.log('query pending --> ', table.pending)
							table.connect.findAll()
							res = table.connect.data ? table.connect.data : []
						} else {

							let on = table.ast.on
							let join_type = table.ast.join

							//[this.type, this.field, this.op, this.value].join(' ')

							if (join_type == 'INNER JOIN') {
								let op = `val.${on.left.column} ${this.getOperators()[on.operator]} e.${on.right.column}`
								res = res.map((e) => {
									return Object.assign({}, e, table.data.reduce((acc, val) => {
										if (eval(op)) {
											return val
										} else {
											return acc
										}
									}, {}))
								})
							} else if (join_type == 'LEFT JOIN') {
								let op = `val.${on.left.column} ${this.getOperators()[on.operator]} e.${on.right.column}`
								console.log('left_table', left_table.table_name)
								res = res.map((e) => {
									return Object.assign({}, e, table.data.reduce((acc, val) => {
										//console.log('eval', op, eval(op))
										if (eval(op)) {
											return val
										} else {
											//console.log('acc', acc, 'eval', op, eval(op))
											return acc
										}
									}, table.connect.schema()))
								})
							} else if (join_type == 'RIGHT JOIN') {
								let op = `val.${on.left.column} ${this.getOperators()[on.operator]} e.${on.right.column}`
								res = table.data.map((e) => {
									return Object.assign({}, e, res.reduce((acc, val) => {
										if (eval(op)) {
											return val
										} else {
											return {} // acc
										}
									}, table_left.connect.schema()))
								})
							}
						}
					} else if (ast.type == 'insert') {
		
						let arr = []
						let values = ast.values ? ast.values : null
						let columns = ast.columns ? ast.columns : null
						
						if (values != null && Array.isArray(values) && values.length >= 1 && columns != null && Array.isArray(columns) && columns.length >= 1) {
							for (let arr_values of values) {
								let obj = {}
								for (let key in arr_values.value) {
									let value = arr_values.value[key].value
									let column = columns[key]
									obj[column] = value
								}
								arr.push(obj)
							}
						}
		
						let set_values = ast.set ? ast.set : null
		
						if (set_values != null && Array.isArray(set_values) && set_values.length >= 1) {
							let obj = {}
							for (let arr_values of set_values) {
								let value = arr_values.value.value
								let column = arr_values.column
								obj[column] = value
							}
							arr.push(obj)
						}
		
						if (arr.length >= 1) {
							console.log('insert', arr)
							res = table.connect.insert(arr)
						}
					} else if (ast.type == 'update') {
		
						this.#formatWhere(ast, table.connect)
						this.#formatOrderBy(ast, table.connect)
						this.#formatLimit(ast, table.connect)
						table.connect.findAll()
		
						let data = table.connect.data ? table.connect.data : [],
							obj = {},
							set_values = ast.set ? ast.set : null
		
						if (set_values != null && Array.isArray(set_values) && set_values.length >= 1) {
							for (let arr_values of set_values) {
								let value = arr_values.value.value
								let column = arr_values.column
								obj[column] = value
							}
						}
		
						if (data.length >= 1) {
							for (let key in data) {
								for (let col in obj) {
									if (data[key][col]) data[key][col] = obj[col]
								}
							}
							res = table.connect.update(data)
						}
					} else if (ast.type == 'delete') {
						this.#formatWhere(ast, table.connect)
						this.#formatOrderBy(ast, table.connect)
						this.#formatLimit(ast, table.connect)
						res = table.connect.delete()
					}
				}
			}

			if (res) {
				return res
			}
		}
		return false
	}

	static getOperators() {
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
			'like': '==',
			'LIKE': '==',
			'IN': '==',
			'NOT IN': '!='
		}
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
			'like': '==',
			'LIKE': '==',
			'IN': '==',
			'NOT IN': '!='
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
			'groupBy': [],
			'columns': []
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

	#saveArray(arr) {

		let ids = [], data = this.getData()

		if (!Array.isArray(data) || !data) data = []

		const table_schema = this.schema()
		let table_config = this.config()

		if (arr.length >= 1) {
			for (let obj of arr) {

				table_config.last_id++

				let data_obj = {}
				data_obj.id = table_config.last_id
				
				for (let key in obj) {
					let value = this.Validate.type(key, obj[key])
					if (value != undefined && table_schema[key]) {
						data_obj[key] = Plugin.valueToType(table_schema[key], obj[key])
					}
				}

				ids.push(data_obj.id)
				data.push(data_obj)
			}
			this.Validate.Config.put(table_config)
			this.Validate.Data.put(data)
			this.data = []
		}
		return ids
	}

	/** Bulk Insert Data
	 * @param mixed $data array or object
	 * @return boolean true|false
	 */
	insert(data) {

		let ids = []

		if (Array.isArray(data) && data.length >= 1) {
			ids = this.#saveArray(data)
		} else if (typeof data == 'object') {
			let arr = []
			arr.push(data)
			ids = this.#saveArray(arr)
		} else {
			const err = `Invalid data format. Expected: array or object. data: ${data}`
			if (this.settings.console_error === true) {
				this.settings.consoleLog(err, __filename)
				return false
			} else throw new DbJsonError(err)
		}
		//this.settings.consoleLog('insert --> ids: ', ids)
		return ids
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
			} else throw new DbJsonError(err)
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

		//value = this.Validate.type(field, value)
		const valid_field = this.Validate.field(field)
		const valid_op = this.getOperator()[op] ? true : false

		type = type.toLowerCase()
		const valid_type = (type == 'and' || type == 'or') ? true : false

		if (valid_field === true && valid_op === true && valid_type === true) {
			
			if (op == 'LIKE' || op == 'like') {

				op = 'LIKE'
				value = String(value)

				if (value.indexOf('%') != -1) {
					value = value.replace(/[%]/g, '')
				}
			}

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

	columns(params = '*') {

		if (params != '*') {
			if (typeof params == 'string') {
				if (params.indexOf(', ') != -1) {
					params = params.split(', ')
				} else if (params.indexOf(',') != -1) {
					params = params.split(',')
				} else if (params.indexOf(': ') != -1) {
					params = params.split(': ')
				} else if (params.indexOf(':') != -1) {
					params = params.split(':')
				}
			}
			//arr = arr.replace(/\s/g, '')
			//arr = arr.toLowerCase()
			if (Array.isArray(params)) {
				for (let key in params) {
	
					let v = params[key]
		
					if (typeof v == 'string') {
	
						v = v.toLowerCase()
	
						if (v.indexOf(' as ') != -1) {
							let arr2 = v.split(' as ')
							params[key] = {'column': arr2[0], 'as': arr2[1]}
						} else {
							params[key] = {'column': v, 'as': null}
						}
					} else if (typeof v == 'object') {
						if (v.column) {
							params[key].column = v.column
							params[key].as = v.as ? v.as : null
						}
					}
				}
				this.pending.columns = params
			}
		}
		return this
	}

	/** Filter in columns()
	 * @return boolean
	 */
	columnsPending() {

		const columns = this.pending.columns
		const schema = this.schema()

		for (var key in this.data) {
			let obj = this.data[key]
			for (var i in obj) {
				if (schema[i] == 'object' || schema[i] == 'array') {
					if (obj.hasOwnProperty(i)) {
						if (typeof obj[i] == 'string') {
							this.data[key][i] = JSON.parse(obj[i])
						}
					}
				}
			}
		}

		if (Array.isArray(columns) && columns.length >= 1 && this.data.length >= 1) {

			let new_data = []

			for (var obj of this.data) {
				let new_obj = {}
				for (var i in obj) {
					if (obj.hasOwnProperty(i) ) {
						let index = columns.findIndex(a => a.column == i)
						if (index != -1) {
							if (columns[index].as == null) new_obj[i] = obj[i]
							else new_obj[columns[index].as] = obj[i]
						}
					}
				}
				new_data.push(new_obj)
			}

			this.data = new_data
			return true
		}

		return false
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

					if (this.field && this.value != 'undefined') {

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

							value = (String(value)).toLowerCase()
							this.value = (String(this.value)).toLowerCase()
							this.value = (value.indexOf(this.value) != -1) ? 1 : 0
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
				}

				if (this.type != 'undefined') delete this.type
				if (this.field != 'undefined') delete this.field
				if (this.op != 'undefined') delete this.op
				if (this.value != 'undefined') delete this.value
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
			} else throw new DbJsonError(err)
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
		if (!Array.isArray(data)) data = []

		const schema = this.schema()

		let data_obj = {}
		for (let key in this.obj) {
			let value = this.Validate.type(key, this.obj[key])
			if (value != undefined && schema[key]) {
				data_obj[key] = Plugin.valueToType(schema[key], this.obj[key])
			}
		}

		if (this.currentId == null) {
			let table_config = this.config()
			table_config.last_id++
			this.obj.id = table_config.last_id
			data_obj.id = this.obj.id
			this.currentId = table_config.last_id
			this.Validate.Config.put(table_config)
			data.push(data_obj)
		} else if (this.currentId != null) {
			this.currentKey = this.getRowKey(this.currentId, data)
			this.obj.id = this.currentId
			data_obj.id = this.obj.id
			data[this.currentKey] = data_obj

		} else return false

		this.Validate.Data.put(data)
		this.data = []

		//this.settings.consoleLog('save() --> ', this.currentId)

		return true
	}

	update(values) {

		if (!Array.isArray(values) && typeof values == 'object') {
			values = [values]
		}

		if (Array.isArray(values)) {

			let data = this.getData()

			const schema = this.schema()
	
			for (let key in values) {
	
				let obj = values[key]
				if (obj.id >= 1) {

					for (let key_o in obj) {

						let value = this.Validate.type(key_o, obj[key_o])

						if (key_o == 'id') {
							obj[key_o] = Number(obj[key_o])
						} else if (value != undefined && schema[key_o]) {
							obj[key_o] = Plugin.valueToType(schema[key_o], obj[key_o])
						}
					}
		
					const index = data.findIndex(v => v.id === obj.id)
					if (index != -1) Object.assign(data[index], obj)
				}
			}
			this.Validate.Data.put(data)
			return true
		}
		return false
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
			data = Plugin.arrayDiffKey(data, this.data)
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
		} else if (Plugin.isInteger(data)) {
			res = this.findId(Number(data))
		} else {
			const err = `Error param data: ${data}`
			if (this.settings.console_error) {
				this.settings.consoleLog(err, __filename)
				return false
			} else throw new DbJsonError(err)
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
		return this
	}
}
  
module.exports = DataBase