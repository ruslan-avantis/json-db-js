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
let emitter = new Emitter()

if (emitter.getMaxListeners() <= 100) {
	require('events').EventEmitter.defaultMaxListeners = 100
	console.log('emitter.getMaxListeners() -->  ', emitter.getMaxListeners())
}

//const {DbJsonError, FatalError, ParseError, BaseError } = require(dir_app+'/db_exception.js')
const Plugin = require('../lib/plugin.js')
const words_en = require('../demo/words_en.json')
const { countBy } = require('lodash')
//const words_ru = require('./demo/words_ru.json')
//const words_it = require('./demo/words_it.json')

// Database configuration
let db = new (require('../lib/db_run.js'))()//.setAutoCreate(true)

const randomItem = async () => {
	let obj_item = {}
	obj_item.alias = await Plugin.token()
	let title = await Plugin.randomWord(words_en, 3)
	obj_item.title = await title[0].toUpperCase() +title.slice(1)
	let description = await Plugin.randomWord(words_en, 10)
	obj_item.description = await description[0].toUpperCase() + description.slice(1)
	let field_string = await Plugin.randomWord(words_en, 4)
	obj_item.field_string = await field_string[0].toUpperCase() + field_string.slice(1)
	obj_item.field_boolean = await Plugin.randomBoolean()
	obj_item.field_double = await Plugin.randomFloat(0, 100)
	obj_item.field_integer = await Plugin.randomInteger(1000, 9999)
	obj_item.field_array = await Plugin.randomArray(words_en, 10)
	obj_item.field_object = await Plugin.randomObject(words_en, words_en, 20)
	obj_item.sort = await Plugin.randomInteger(1, 10000)
	obj_item.state = await Plugin.randomInteger(0, 2)
	obj_item.score = await Plugin.randomInteger(111111, 1000000)
	obj_item.date_create = await Plugin.dateFormat(Date.now(), "dd-mm-yyyy HH:MM:ss")
	obj_item.date_update = await obj_item.date_create
	return obj_item
}

let demoJsonDabaBase = async () => {

	const settings = {
		'console_error': true,
		'consoleLog': (...arg) => { console.log(...arg) }
	  },
	  table_name = 'benchmark_table',
	  table_config = {
		'alias': 'string',
		'title': 'string',
		'description': 'string',
		'field_string': 'string',
		'field_boolean': 'boolean',
		'field_integer': 'integer',
		'field_double': 'double',
		'field_object': 'object',
        'field_array': 'array',
		'sort': 'integer',
		'state': 'integer',
		'score': 'integer',
		'date_create': 'string',
		'date_update': 'string'
	  },
	  settings_full = await db.getConfig()

	// Database Run
	const jsonDB = await db.run(settings)

	/** Database сonnecting table demo_table */
	let table = await jsonDB.table(table_name, settings_full)
	if (table === false) {
		await jsonDB.create(table_name, table_config, settings_full)
		table = await jsonDB.table(table_name, settings_full)
	}
	
	let sql = `
		SELECT alias, title, description AS _desc, field_string AS string, field_boolean AS bool, field_double AS double, field_integer AS integer, sort, state, score, date_create
		FROM ${table_name}
		WHERE id >= 100 AND id <= 10000 AND description LIKE '%world%'
		ORDER BY title ASC, id DESC
		LIMIT 5 OFFSET 0
	`

	let data_sql = await jsonDB.query(sql, [], settings_full)

	console.log('data_sql:', data_sql)

	/** Bulk Insert Data */
	let id = table.lastId()
	let count = 10, i = 0, data = []

	console.log('lastId:', id, 'Start create items. Curent ID = '+count)

	while (i < count) {
    	let obj = await randomItem()
		obj.field_object = await randomItem()
		await data.push(obj)
		i++
		console.log('i:', i)
	}

	let ids = await table.insert(data)

	data = []
	i = 0

	console.log('End create items. IDS:', ids)
	
	/** Get previous item by id or object params */
	let obj1 = await table.find({'id': 2000})
	console.log('-- find item by object params --', 'currentId: ', table.currentId, ', item: ', obj1)

	let obj2 = await table.find(1000)
	console.log('-- find item by id --', 'currentId: ', table.currentId, ', item: ', obj2)
	
	/** `SELECT * FROM ${table_name} WHERE description LIKE '%world%' ORDER BY title ASC, id DESC LIMIT 5 OFFSET 0`
	*/
	let res = await table
		.where('description', 'LIKE', 'world')
		//.where('id', '>=', 1)
		//.where('id', '<=', 10000)
		//.where('id', 'IN', '10')
		//.where('field_boolean', 'NOT IN', true)
		//.where('title', '>', 'AB')
		//.orderBySql('title DESC, id ASC')
		.orderBy('title', 'ASC')
		.orderBy('id', 'DESC')
		.limit(2, 0) // .limit(number, offset)
		//.offset(0)
		.columns('*') // default all columns
		//.columns('id AS _id, title, field_boolean AS boolean')
		// or
		//.columns([
		//	{'column': 'id', 'as': '_id'},
		//	{'column': 'title'},
		//	{'column': 'field_boolean', 'as': 'boolean'}
		//])
		.findAll()

	console.log('count: ', table.count(), 'Total count: ', table.totalCount(), ', data: ',  res.data)
	
}

demoJsonDabaBase()