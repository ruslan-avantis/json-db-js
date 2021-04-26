const dir_app = process.env.JSON_DB_APP_DIR ? process.env.JSON_DB_APP_DIR : __dirname
const dbException = require(dir_app+'/db_exception.js')
const ObjClass = require(dir_app+'/obj_class.js')
const Plugin = (require(dir_app+'/plugin.js'))()
const DataBase = require(dir_app+'/data_base.js')
const TableConfig = require(dir_app+'/table_config.js')
const ValidateData = require(dir_app+'/validate_data.js')

class Relation {

	constructor(settings = {}) {
		
		/**
		* Tables names
		* @var array tables
		*/
		this.tables = {
			'local': null,
			'foreign': null
		}

		/**
		* Relation keys names
		* @var array keys
		*/
		this.keys = {
			'local': null,
			'foreign': null
		}

		/**
		* Current relation type
		* @var string
		*/
		this.relationType

		/**
		* All relations types
		* @var array
		*/
		this.relations = ['belongsTo', 'hasMany', 'hasAndBelongsToMany']

		this.settings = {}
		if (settings) Object.assign(this.settings, settings)
	}

	/**
	 * Factory method
	 * @param string name Name of table
	 * @return Relation()
	 */
	 static table(table_name, settings = {}) {

		const table = ValidateData.table(table_name, settings)
		const table_exists = table.exists()

		if (table_exists) {
			const r = new Relation(settings)
			r.tables['local'] = table_name
			return r
		} else {
			const err = `Error set table name ${table_name}`
			if (global.json_db.console_error) {
				global.json_db.consoleLog(err, __filename)
				return false
			} else throw new dbException(err)
		}
	}

	/**
	 * Getter of junction table name in many2many relation
	 * @return boolean|string Name of junction table or false
	 */
	getJunction() {
		if (this.relationType == 'hasAndBelongsToMany') {
			let tables = this.tables
			//tables.sort((a,b) => {return a - b})
			return tables.join('_')
		}
		return false
	}

	/**
	 * Set relation type to field
	 * @param string relation Name of relation
	 */
	setRelationType(relation) {
		const validate = ValidateData.relationType(relation)
		if (validate) {
			this.relationType = relation
			return true
		} else {
			const err = `Error set relation ${relation} to field`
			if (global.json_db.console_error) {
				global.json_db.consoleLog(err, __filename)
				return false
			} else throw new dbException(err)
		}
	}

	/**
	 * Set table name
	 * @param string type local or foreign
	 * @param string name table name
	 */
	setTable(type, name) {
		const validate = ValidateData.table(name, this.settings).exists()
		if (validate === true) {
			this.tables[type] = name
			return true
		} else {
			const err = `Error set table ${name} type ${type}`
			if (global.json_db.console_error) {
				global.json_db.consoleLog(err, __filename)
				return false
			} else throw new dbException(err)
		}
	}

	/**
	 * Set key name
	 * @param string type local or foreign
	 * @param string key key name
	 * @return Relation()
	 * @throws dbException First you must define tables name
	 */
	setKey(type, key) {
		if (!Plugin.inArray(null, this.tables)) {

			const field = ValidateData.table(this.tables[type], this.settings).field(key)

			if (field === true) {
				this.keys[type] = key
				return this
			} else {
				const err = 'First you must define tables name'
				if (global.json_db.console_error) {
					global.json_db.consoleLog(err, __filename)
					return false
				} else throw new dbException(err)
			}
		}
	}

	/**
	 * Set local key name
	 * @param string key key name
	 * @return Relation()
	 * @throws dbException First you must define tables name
	 */
	localKey(key) {
		return this.setKey('local', key)
	}

	/**
	 * Set foreign key name
	 * @param string key key name
	 * @return Relation()
	 * @throws dbException First you must define tables name
	 */
	foreignKey(key) {
		return this.setKey('foreign', key)
	}

	/**
	 * Set relation one2many to table 
	 * @param string table Table name
	 * @return Relation()
	 */
	belongsTo(table) {
		this.setTable('foreign', table)
		this.setRelationType('belongsTo')
		return this
	}

	/**
	 * Set relation many2one to table 
	 * @param string table Table name
	 * @return Relation()
	 */
	hasMany(table) {
		this.setTable('foreign', table)
		this.setRelationType('hasMany')
		return this
	}

	/**
	 * Set relation many2many to table 
	 * @param string table Table name
	 * @return Relation()
	 */
	hasAndBelongsToMany(table) {
		this.setTable('foreign', table)
		this.setRelationType('hasAndBelongsToMany')
		return this
	}

	/**
	 * Use relation to table
	 * @param string table Table name
	 * @return Relation()
	 */
	with(table) {

		const relation = ValidateData.relation(this.tables['local'], table)
		
		if (relation !== false) {

			const config = TableConfig.table(this.tables['local'], this.settings).relations(this.tables['foreign'])

			this.setTable('foreign', table)	
			this.setRelationType(config.type)
			this.setKey('local', config.keys.local)
			this.setKey('foreign', config.keys.foreign)
	
			return this

		} else {
			const err = `Validate table: ${table} Error`
			if (global.json_db.console_error) {
				global.json_db.consoleLog(err, __filename)
				return false
			} else throw new dbException(err)
		}
	}

	/**
	 * Set specified relation
	 * @throws dbException Tables names or keys missing
	 */
	 setRelation() {
		if (!Plugin.inArray(null, this.tables) && !Plugin.inArray(null, this.keys)) {
			this.addRelation()
			return true
		}
		else {
			const err = 'Tables names or keys missing'
			if (global.json_db.console_error) {
				global.json_db.consoleLog(err, __filename)
				return false
			} else throw new dbException(err)
		}
	}

	/**
	 * Get relation information
	 * @return array relation information
	 */
	getRelation() {
		return {
			'tables': this.tables,
			'keys': this.keys,
			'type': this.relationType
		}
	}

	/**
	 * Remove relation
	 */
	removeRelation() {
		if (this.relationType == 'hasAndBelongsToMany') {
			
			const junction = this.getJunction()

			this.deleteRelationData(junction, this.tables['local'])
			this.deleteRelationData(junction, this.tables['foreign'])
		}

		this.deleteRelationData(this.tables['local'], this.tables['foreign'])
	}

	/**
	 * Add data to configs and create all necessary files
	 */
	addRelation() {

		if (this.relationType == 'hasAndBelongsToMany') {

			const junction = this.getJunction()

			const exists = ValidateData.table(junction, this.settings).exists()

			if (exists === false) {

				DataBase.create(
					junction,
					{
						[this.tables['local']+'_id']: 'integer',
						[this.tables['foreign']+'_id']: 'integer'
					}
				)

				this.insertRelationData(
					junction,
					this.tables['local'],
					'hasMany',
					{
						'local': this.tables['local']+'_id',
						'foreign': this.keys['local']
					}
				)

				this.insertRelationData(
					junction,
					this.tables['foreign'],
					'hasMany',
					{
						'local': this.tables['foreign']+'_id',
						'foreign': this.keys['foreign']
					}
				)
			}
		}

		this.insertRelationData(
			this.tables['local'],
			this.tables['foreign'],
			this.relationType,
			this.keys
		)

		return true
	}

	/**
	 * Inserts relation data to config file
	 * @param string from Local table
	 * @param string to Related table
	 * @param string type Relation type
	 * @param array keys Relationed keys
	 */
	insertRelationData(from, to, type, keys = []) {

		const config = TableConfig.table(from, this.settings)
		let content = config.get()

		if (content.relations && content.relations[to]) {

			content.relations[to] = {
				'type': type,
				'keys': keys
			}
	
			config.put(content)
	
			return true
		}
		return false
	}

	/**
	 * Inserts relation data to config file
	 * @param string from Local table
	 * @param string to Related table
	 */
	deleteRelationData(from, to) {

		const config = TableConfig.table(from, this.settings)
		let content = config.get()

		if (content.relations && content.relations[to]) {
			delete content.relations[to]
			config.put(content)
			return true
		} else return false
	}

	/**
	 * Process query with joined data
	 * @param object $row One row of data
	 * @return DataBase()
	 */
	join(row) {
		
		let keys = this.keys

		const foreignTable = DataBase.table(this.tables['foreign'], this.settings)

		if (this.relationType == 'hasAndBelongsToMany') {
			
			const table_name = this.getJunction()
			const DB = DataBase.table(table_name, this.settings)

			DB.groupBy(this.tables['local']+'_id')
			DB.where(this.tables['local']+'_id', '=', row[keys['local']])
			DB.findAll()
			DB.asArray(null, this.tables['foreign']+'_id')

			if (!this.join) return {}

			return foreignTable.where(keys['foreign'], 'IN', this.join[row[keys['local']]])
		}

		return foreignTable.where(keys['foreign'], '=', row[keys['local']])
	}

	/**
	 * 
	 * @param array $array
	 * @param string $part
	 * @return array
	 */
	build(arr, part) {
		
		let res = []
		
		for (let key in arr) {
			
			let row = arr[key]
			
			if (typeof row == 'object') {
				if (row instanceof ObjClass) {
					
					part = Plugin.ucfirst(part)

					if (!row[part]) {

						let query = this.join(row)

						if (this.relationType == 'belongsTo') {

							query = query.findAll() // !!!
							query = this.reset(query)[0] // !!!
						}

						row[part] = query
					}

					arr[key] = row[part]
					res.push(row[part])
				}
				else {
					row.with[part]
				}
			}
			else {
				const merge = this.build(row, part)
				res = res.concat(merge)
			}
		}
		return res
	}

	/**
	 * Get relations types
	 * @return array
	 */
	relations() {
		return this.relations
	}

}

Relation.Error = class extends Error {
	constructor(message, code) {
	  super(message)
	  this.code = code
	}
}
  
module.exports = Relation