const dir_app = process.env.JSON_DB_APP_DIR ? process.env.JSON_DB_APP_DIR : __dirname
const TableConfig = require(dir_app+'/table_config.js')
const ValidateData = require(dir_app+'/validate_data.js')

/** Core Data Base Class
 * 
 */
 class DataBaseCore {

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

		this.settings = {}
		if (settings) Object.assign(this.settings, settings)

	}

	/** Sort operators
	 * @return object
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
			'or': '||'
		}
	}

	/** Set pending functions in right order with default values (Empty).
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

	/** Returning object with config for table
	 * @return object Config
	 */
	config() {
		return TableConfig.table(this.table_name, this.settings).get()
	}

	/** Return array with names of fields
	 * @return array Fields
	 */
	fields() {
		return TableConfig.table(this.table_name, this.settings).fields()
	}

	/** Returning assoc array with types of fields
	 * @return array Fields type
	 */
	schema() {
		return TableConfig.table(this.table_name, this.settings).schema()
	}

	/** Limit returned data
	 *
	 * Should be used at the end of chain, before end method
	 * @param integer $number Limit number
	 * @param integer $offset Offset number
	 * @return Database()
	 */
	limit(number, offset = 0) {
		this.pending['limit'] = {offset, number}
		return this
	}

	/** offset returned data
	 *
	 * Should be used at the end of chain, before end method
	 * @param integer $offset Offset number
	 * @return Database()
	 */
	offset(offset) {
		this.pending['limit']['offset'] = offset
		return this
	}

	/** JOIN other tables
	 * @param string table relations separated by :
	 * @return Database()
	 */
	with(join_table) {
		this.pending['with'] = join_table.split(':')
		return this
	}

	/**  Where function, like SQL
	 *
	 * Operators:
	 * - Standard operators (=, !=, >, <, >=, <=)
	 * - IN (only for array value)
	 * - NOT IN (only for array value)
	 *
	 * @param string field Field name
	 * @param string op Operator
	 * @param mixed value Field value
	 * @return Database()
	 */
	where(field, op, value) {
		if (!this.pending['where']) this.pending['where'] = []
		this.pending['where'].push({
			'type': 'and',
			'field': field,
			'op': op,
			'value': value,
		})
		return this
	}

	/** Alias for where()
	 * @param string field Field name
	 * @param string op Operator
	 * @param mixed value Field value
	 * @return Database()
	 */
	andWhere(field, op, value) {
		this.where(field, op, value)
		return this
	}

	/**  Alias for where(), setting OR for searching
	 * @param string $field Field name
	 * @param string $op Operator
	 * @param mixed $value Field value
	 * @return Database()
	 */
	orWhere(field, op, value) {
		if (!this.pending['where']) this.pending['where'] = []
		this.pending['where'].push({
			'type': 'or',
			'field': field,
			'op': op,
			'value': value,
		})
		return this
	}

	/** Sorting data by field
	 * @param string key Field name
	 * @param string direction ASC|DESC
	 * @return Database()
	 */
	orderBy(key, direction = 'ASC') {
		const table_field = ValidateData.table(this.table_name, this.settings).field(key)
		if (table_field === true) {
			const directions = {
				'ASC': 'asc',
				'DESC': 'desc'
			}
			let sort = [key, (directions[direction] ? directions[direction] : 'asc')]
			this.pending['orderBy'].push(sort)
		}
		return this
	}

	/** properties an sql-like string
	 * "city, price desc" or "city ASC, price DESC"
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
	 * @return Database()
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

	/** Default sort function
	 * @param string x
	 * @param string y
	 * @return number -1, 0, 1
	 */
	#sortXY(x, y) {
		return x > y ? 1 : x < y ? -1 : 0
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

	/** Sort an array of objects by more than one field.
	 * @
	 */
	orderByPending() {
		// order_param = [['id', 'desc'],['title', 'asc']]
		let order_param = this.pending['orderBy']
		if (Array.isArray(order_param) && order_param.length >= 1) {
			this.data.sort(this.#orderByFieldSort(order_param))
		}
		// Sort by id by default
		else this.data.sort(this.#sortXY)
	}
}

DataBaseCore.Error = class extends Error {
	constructor(message, code) {
	  super(message)
	  this.code = code
	}
}
  
module.exports = DataBaseCore