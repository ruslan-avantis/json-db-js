'use strict'

/** If starting without PM2
	Add variables from the .env file to process.env
**/
if (!process.env.PM2_RUN) {
	const dotenv = require('dotenv').config()
}
if (process.env.NODE_ENV) {
	console.log('process.env.NODE_ENV', process.env.NODE_ENV)
}

/** Change Max Listeners limit **/
const Emitter = require("events")
const emitter = new Emitter()

if (emitter.getMaxListeners() <= 100) {
	require('events').EventEmitter.defaultMaxListeners = 100
	console.log('emitter.getMaxListeners() -->  ', emitter.getMaxListeners())
}

const Plugin = require('../lib/plugin.js')
const words_en = require('../demo/words_en.json')
//const words_ru = require('./demo/words_ru.json')
//const words_it = require('./demo/words_it.json')
// Database Run Class
const db = new (require('../lib/db_run.js'))()//.setAutoCreate(true)

/** Random item generate. You can change this function to suit your needs.
 * @param string $before
 * @param string $after
 * @param array $words_1
 * @param array $words_2
 * @return object item
 */
const randomItem = (before = '', after = '', words_1 = [], words_2 = []) => {
    let item = {}
    item[`${before}alias${after}`] = Plugin.token()
    let title = Plugin.randomWord(words_1, 3)
    item[`${before}title${after}`] = title[0].toUpperCase() +title.slice(1)
    let description = Plugin.randomWord(words_1, 10)
    item[`${before}description${after}`] = description[0].toUpperCase() + description.slice(1)
    let field_string = Plugin.randomWord(words_1, 4)
    item[`${before}field_string${after}`] = field_string[0].toUpperCase() + field_string.slice(1)
    item[`${before}field_boolean${after}`] = Plugin.randomBoolean()
    item[`${before}field_double${after}`] = Plugin.randomFloat(1, 100, 2)
    item[`${before}field_integer${after}`] = Plugin.randomInteger(1000, 9999)
    item[`${before}field_array${after}`] = Plugin.randomArray([], 10, 'integer')
    item[`${before}field_object${after}`] = Plugin.randomObject(words_1, words_2, 20)
    item[`${before}sort${after}`] = Plugin.randomInteger(1, 10000)
    item[`${before}state${after}`] = Plugin.randomInteger(0, 2)
    item[`${before}score${after}`] = Plugin.randomInteger(111111, 1000000)
    item[`${before}date_create${after}`] = Plugin.dateFormat(Date.now(), "dd-mm-yyyy HH:MM:ss")
    item[`${before}date_update${after}`] = item[`${before}date_create${after}`]
    return item
}

class CustomClass {

	constructor() {
		this.settings = {}
		this.prefix_before = ''
		this.prefix_after = ''
		this.table_name = 'new_table'
		this.table_config
		this.DB
		this.table
	}

	static async connect(settings = {}, name = 'demo_table', table_param = {}, prefix_before = '', prefix_after = '') {

		let res = new CustomClass()
		res.settings = settings ? settings : {}
		res.prefix_before = prefix_before // Field: '_alias'
		res.prefix_after = prefix_after // Field: 'alias_1'

		// Table name with prefixes. Return '_demo_table_1'
		res.table_name = Plugin.tableName(name, res.prefix_before, res.prefix_after)

		// Table config with prefixes. Return '_alias_1', '_title_1'
		res.table_config = Plugin.tableConfig(table_param, res.prefix_before, res.prefix_after)

		// Database Run
		res.DB = await db.run(res.settings)
		res.settings = await db.getConfig()
		// Database сonnecting table --> this.table_name
		res.table = await res.DB.table(res.table_name, res.settings)

		if (res.table === false) {
			await res.DB.create(res.table_name, res.table_config, res.settings)
			res.table = await res.DB.table(res.table_name, res.settings)
		}
		return res
	}

	prefix(field) {
		return `${this.prefix_before}${field}${this.prefix_after}`
	}

	// Bulk Insert Data
	async bulkInsertData(count = 1) {

		const table = await this.table

		let id = table.lastId() ? table.lastId() : 0

		let i = 0, data = []

		console.log('bulkInsertData --> lastId:', id, 'Start create items. Curent ID = '+count)

		while (i < count) {
    		let obj = await randomItem(this.prefix_before, this.prefix_after, words_en, words_en)
			//obj.field_object = await randomItem(prefix_before, prefix_after, words_en, words_en)
			await data.push(obj)
			i++
			console.log('bulkInsertData --> i:', i)
		}

		let ids = await table.insert(data)
		console.log('bulkInsertData --> End create items. IDS:', ids)
		return ids
	}

	// Get previous item by object params
	async findObject(find = {}) {
		const table = await this.table
		let obj = await table.find(find) 
		console.log('findObject(find = {}) --> find item by object params --> ', obj)
		return obj
	}

	// Get previous item by id
	async findId(id) {
		const table = await this.table
		let obj = await table.find(id)
		console.log(`findId(${id}) --> find item by id --> `, obj)
		return obj
	}

	// Get items by params
	async where() {

		const table = await this.table

		// `SELECT * FROM ${table_name} WHERE description LIKE '%world%' ORDER BY title ASC, id DESC LIMIT 5 OFFSET 0`
		let data = await table
			.where(this.prefix('description'), 'LIKE', 'Midair')
			//.where('id', '>=', 1)
			//.where('id', '<=', 10000)
			//.where('id', 'IN', '10')
			//.where(this.prefix('field_boolean'), 'NOT IN', true)
			//.where(this.prefix('title'), '>', 'AB')
			//.orderBySql(`${this.prefix('title')} DESC, id ASC`)
			.orderBy(this.prefix('title'), 'ASC')
			.orderBy('id', 'DESC')
			.limit(2, 0) // .limit(number, offset)
			//.offset(0)
			.columns('*') // default all columns
			//.columns(`id AS _id, ${this.prefix('title')}, ${this.prefix('field_boolean')} AS boolean`)
			// or
			.columns([
				{'column': 'id'},
				{'column': this.prefix('title'), 'as': 'title'},
				{'column': this.prefix('description'), 'as': 'description'},
				{'column': this.prefix('field_boolean'), 'as': 'bool'}
			])
			.findAll()
		console.log('count: ', data.count(), 'Total count: ', data.totalCount(), ', data: ',  data)

		return data
	}

	// INSERT
	async insertSqlLike() {

		const DB = await this.DB
		let object_item = await randomItem(this.prefix_before, this.prefix_after, words_en, words_en)
		let columns = [], values_1 = []

		for (let key in object_item) {
			let value = object_item[key]
			if (typeof value == 'string') values_1.push("'"+value+"'")
			else if (typeof value == 'object') values_1.push("'"+JSON.stringify(value)+"'")
			else values_1.push(value)
			columns.push(key)
		}

		let object_item_2 = await randomItem(this.prefix_before, this.prefix_after, words_en, words_en)
		let values_2 = []

		for (let key in object_item_2) {
			let value = object_item_2[key]
			if (typeof value == 'string') values_2.push("'"+value+"'")
			else if (typeof value == 'object') values_2.push("'"+JSON.stringify(value)+"'")
			else values_2.push(value)
		}

		let sql = `INSERT INTO ${this.table_name} (${[...columns]}) VALUES (${[...values_1]}), (${[...values_2]})`
		let ids = await DB.query(sql, [], this.settings)
		console.log('Count new items: ', ids.length, ', ids:', ids)

		return ids
	}

	// UPDATE
	async updateSqlLike() {

		const DB = await this.DB

		let object_update = await randomItem(this.prefix_before, this.prefix_after, words_en, words_en)
		let update_data = []

		for (let key in object_update) {
			let value = object_update[key]
			if (typeof value == 'string') update_data.push(`${key} = '${value}'`)
			else if (typeof value == 'object') update_data.push(`${key} = '${JSON.stringify(value)}'`)
			else update_data.push(`${key} = ${value}`)
		}

		let sql = `
    		UPDATE ${this.table_name}
    		SET ${update_data.join(',')}
    		WHERE id = 10
		`
		let data = await DB.query(sql, [], this.settings)
		console.log('UPDATE items: ', data)
		return data
	}
	
	// SELECT
	async selectSqlLike(num, keyword) {
		return eval(`this.#selectSqlLike_${num}(keyword)`)
	}

	// SELECT
	// Private method
	async #selectSqlLike_1(keyword) {
		const DB = await this.DB

		let sql = `
			SELECT 
				id,
				${this.prefix('alias')} AS alias,
				${this.prefix('title')} AS title,
				${this.prefix('description')} AS description,
				${this.prefix('field_string')} AS string,
				${this.prefix('field_boolean')} AS bool, 
				${this.prefix('field_double')} AS double,
				${this.prefix('field_integer')} AS integer,
				${this.prefix('sort')} AS sort,
				${this.prefix('state')} AS state,
				${this.prefix('score')} AS score,
				${this.prefix('date_create')} AS date_create
			FROM ${this.table_name}
			WHERE id >= 1 AND id <= 10000 AND ${this.prefix('description')} LIKE '%${keyword}%'
			ORDER BY ${this.prefix('title')} ASC, id DESC
			LIMIT 5 OFFSET 0
		`
		let data = await DB.query(sql, [], this.settings)
		console.log('selectSqlLike_1 --> count:', data.length, data)
		return data
	}

	// SELECT
	// Private method
	async #selectSqlLike_2(keyword) {
		const DB = await this.DB
		let sql = `
			SELECT id, ${this.prefix('field_array')} AS array
			FROM ${this.table_name}
			WHERE ${this.prefix('field_array')} LIKE '%${keyword}%'
			LIMIT 5 OFFSET 0
		`
		let data = await DB.query(sql, [], this.settings)
		console.log('selectSqlLike_2 --> count:', data.length, data)
		return data
	}

	// SELECT
	// Private method
	async #selectSqlLike_3(id) {
		const DB = await this.DB
		let sql = `
			SELECT 
				id,
				${this.prefix('alias')} AS alias,
				${this.prefix('title')} AS title,
				${this.prefix('description')} AS description,
				${this.prefix('field_string')} AS string,
				${this.prefix('field_boolean')} AS bool, 
				${this.prefix('field_double')} AS double,
				${this.prefix('field_integer')} AS integer,
				${this.prefix('sort')} AS sort,
				${this.prefix('state')} AS state,
				${this.prefix('score')} AS score,
				${this.prefix('date_create')} AS date_create
			FROM ${this.table_name}
			WHERE id = ${id}
		`
		let data = await DB.queryMulti(sql, this.settings)
		console.log('selectSqlLike_3 --> count:', data.length, data)
		//console.log('selectSqlLike_3:', JSON.stringify(data, null, 2))
		return data
	}

	// LEFT JOIN
	async selectLeftJoinSqlLike_1() {
		//console.log('arguments', arguments)
		const DB = await this.DB
		const table_name_2 = arguments[0] ? arguments[0] : 'demo_table_2'
		const table_name_3 = arguments[1] ? arguments[1] : 'demo_table_3'
		let sql = `
			SELECT *
			FROM ${this.table_name} AS t
			LEFT JOIN ${table_name_2} AS o ON t.id = o.id
			LEFT JOIN ${table_name_3} AS s ON o.id = s.id
			ORDER BY id
		`
		let data = await DB.queryMulti(sql, this.settings)
		console.log('selectLeftJoinSqlLike_1 --> count:', data.length, data)
		return data
	}

}

const run = async () => {

	const custom_settings = {'console_error': true}
	const table_alias = 'demo_table'
	const structure_tables = {
		'alias': 'string',
		'title': 'string',
		'description': 'string',
		'field_string': 'string',
		'field_boolean': 'boolean',
		'field_integer': 'integer',
		'field_double': 'double',
		'field_object': 'object', // Fields of type array or object support search LIKE %text%
		'field_array': 'array', // Fields of type array or object support search LIKE %text%
		'sort': 'integer',
		'state': 'integer',
		'score': 'integer',
		'date_create': 'string',
		'date_update': 'string'
	}

	const table = await CustomClass.connect(custom_settings, table_alias, structure_tables, '_')
	
	// Add 10 items to the table
	await table.bulkInsertData(10)

	let find = {
		//'id': 5,
		//[table.prefix('description')]: 'keyword',
		[table.prefix('field_integer')]: '9893',
	}

	await table.findObject(find)

	await table.findId(10)

	await table.where()

	// SQL Like
	await table.insertSqlLike()

	await table.updateSqlLike()

	// using private methods 
	await table.selectSqlLike(1, 'Systemiser')
	await table.selectSqlLike(2, '826')
	await table.selectSqlLike(3, 5)

	// Let's create a second table for join queries
	//const table_2 = await CustomClass.connect(custom_settings, table_alias, structure_tables, '_', '_2')
	// Add 10 items to the table
	//await table_2.bulkInsertData(10)
	// Let's create a third table for join queries
	//const table_3 = await CustomClass.connect(custom_settings, table_alias, structure_tables, '_', '_3')
	// Add 10 items to the table
	//await table_3.bulkInsertData(10)

	// SQL Like SELECT JOIN
	// Coming soon !!! I am finalizing.
	//await table.selectLeftJoinSqlLike_1(table_2.table_name, table_3.table_name)
}

run()