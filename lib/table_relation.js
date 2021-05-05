const dir_app = process.env.JSON_DB_APP_DIR ? process.env.JSON_DB_APP_DIR : __dirname
const {DbJsonError, FatalError, ParseError, BaseError } = require(dir_app+'/db_exception.js')
const Plugin = require(dir_app+'/plugin.js')
const ObjClass = require(dir_app+'/obj_class.js')
const DataBase = require(dir_app+'/db.js')
const TableConfig = require(dir_app+'/table_config.js')
const Validate = require(dir_app+'/validate.js')

/** Relation class
 *
 */
class Relation {

	constructor(settings = {}) {
		
		/** Tables names
		* @var array tables
		*/
		this.tables = {
			'local': null,
			'foreign': null
		}

		/** Relation keys names
		* @var array keys
		*/
		this.keys = {
			'local': null,
			'foreign': null
		}

		/** Current relation type
		* @var string
		*/
		this.relationType

		/** All relations types
		* @var array
		*/
		this.relations = ['belongsTo', 'hasMany', 'hasAndBelongsToMany']

		/** Settings class
		* @var object
		*/
		this.settings = {}
		if (settings) Object.assign(this.settings, settings)
	}

	/**
	 * Factory method
	 * @param string name Name of table
	 * @return this
	 */
	static table(table_name, settings = {}) {
		if (Validate.table(table_name, settings).exists() === true) {
			const r = new Relation(settings)
			r.tables['local'] = table_name
			return r
		} else {
			const err = `Error set table name ${table_name}`
			if (settings.console_error) {
				settings.consoleLog(err, __filename)
				return false
			} else throw new DbJsonError(err)
		}
	}

	/**
	 * Use relation to table
	 * @param string table Table name
	 * @return this
	 * @throws this.Error
	 */
	 with(table) {

		const relation = Validate.relation(this.tables['local'], table)
		if (relation === true) {

			const local_table = TableConfig.table(this.tables['local'])
			const relations = local_table.relations(this.tables['foreign'])

			const r = new Relation(settings)
			r.setTable('foreign', table)
			r.setRelationType(relations.type)
			r.setKey('local', relations.keys.local)
			r.setKey('foreign', relations.keys.foreign)
			return r

		} else {
			const err = `relation local table: ${table} Error`
			if (this.settings.console_error) {
				this.settings.consoleLog(err, __filename)
				return false
			} else throw new DbJsonError(err)
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
		const relation_type = Validate.relationType(relation)
		if (relation_type) {
			this.relationType = relation_type
			return true
		} else {
			const err = `Error set relation ${relation_type} to field`
			if (this.settings.console_error) {
				this.settings.consoleLog(err, __filename)
				return false
			} else throw new DbJsonError(err)
		}
	}

	/**
	 * Set table name
	 * @param string type local or foreign
	 * @param string name table name
	 */
	setTable(type, name) {
		if (Validate.table(name, this.settings).exists() === true) {
			this.tables[type] = name
			return true
		} else {
			const err = `Error set table ${name} type ${type}`
			if (this.settings.console_error) {
				this.settings.consoleLog(err, __filename)
				return false
			} else throw new DbJsonError(err)
		}
	}

	/**
	 * Set key name
	 * @param string type local or foreign
	 * @param string key key name
	 * @return this
	 * @throws this.Error First you must define tables name
	 */
	setKey(type, key) {
		if (!Plugin.inArray(null, this.tables)) {
			if (Validate.table(this.tables[type], this.settings).field(key) === true) {
				this.keys[type] = key
				return this
			} else {
				const err = 'First you must define tables name'
				if (this.settings.console_error) {
					this.settings.consoleLog(err, __filename)
					return false
				} else throw new DbJsonError(err)
			}
		}
	}

	/**
	 * Set local key name
	 * @param string key key name
	 * @return this
	 */
	localKey(key) {
		return this.setKey('local', key)
	}

	/**
	 * Set foreign key name
	 * @param string key key name
	 * @return this
	 */
	foreignKey(key) {
		return this.setKey('foreign', key)
	}

	/**
	 * Set relation one2many to table 
	 * @param string table Table name
	 * @return this
	 */
	belongsTo(table) {
		this.setTable('foreign', table)
		this.setRelationType('belongsTo')
		return this
	}

	/**
	 * Set relation many2one to table 
	 * @param string table Table name
	 * @return this
	 */
	hasMany(table) {
		this.setTable('foreign', table)
		this.setRelationType('hasMany')
		return this
	}

	/**
	 * Set relation many2many to table 
	 * @param string table Table name
	 * @return this
	 */
	hasAndBelongsToMany(table) {
		this.setTable('foreign', table)
		this.setRelationType('hasAndBelongsToMany')
		return this
	}

	/**
	 * Set specified relation
	 * @throws this.Error Tables names or keys missing
	 */
	setRelation() {
		if (!Plugin.inArray(null, this.tables) && !Plugin.inArray(null, this.keys)) {
			this.addRelation()
			return true
		}
		else {
			const err = 'Tables names or keys missing'
			if (this.settings.console_error) {
				this.settings.consoleLog(err, __filename)
				return false
			} else throw new DbJsonError(err)
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
	insertRelationData(from, to, type, keys = {}) {

		const table_config = TableConfig.table(from, this.settings)

		let config_data = table_config.get()

		if (config_data.relations && config_data.relations[to]) {

			config_data.relations[to] = {
				'type': type,
				'keys': keys
			}
	
			table_config.put(config_data)
	
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

		const table_config = TableConfig.table(from, this.settings)
		let config_data = table_config.get()

		if (config_data.relations && config_data.relations[to]) {
			delete config_data.relations[to]
			table_config.put(config_data)
			return true
		} else return false
	}

	/**
	 * Process query with joined data
	 * @param object $row One row of data
	 * @return this
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

						let query = this.join(row) //!!!\\

						if (this.relationType == 'belongsTo') {

							query = query.findAll() //!!!\\
							query = this.reset(query)[0] //!!!\\
						}

						row[part] = query
					}

					arr[key] = row[part]
					res.push(row[part])

				} else {
					row.with[part] //!!!\\
				}
			} else {
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
  
module.exports = Relation