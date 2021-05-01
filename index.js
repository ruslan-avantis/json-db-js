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

let demoJsonDabaBase = async () => {

	const Plugin = require('./lib/plugin.js')
	//const words_ru = require('./test/words_ru.json')
	const words_en = require('./test/words_en.json')
	// Database configuration
	let db = new (require('./lib/db_run.js'))()//.setAutoCreate(true)

	const settings_ = {
		'auto_create': true,
		'JSON_DB_CRYPT': false,
		'JSON_DB_API': false,
		'console_error': true,
		'consoleLog': (...arg) => { console.log(...arg) },
		'dir': {
			'JSON_DB_DIR': process.env.JSON_DB_DIR ? process.env.JSON_DB_DIR : __dirname+'/_json_db_',
			'JSON_DB_CORE_DIR': __dirname+'/_json_db_/core',
			'JSON_DB_LOG_DIR': __dirname+'/_json_db_/log',
			'STRUCTURE_REP': 'https://raw.githubusercontent.com/ruslan-avantis/structure-db/master/db.json'
		},
		'HTTP_CODES': 'https://raw.githubusercontent.com/ruslan-avantis/APIS/master/http-codes.json'
	}

	const settings = {
		'console_error': true,
		'consoleLog': (...arg) => { console.log(...arg) }
	  },
	  table_name = 'demo_table',
	  table_config = {
		'alias': 'string',
		'title': 'string',
		'description': 'string',
		'field_string': 'string',
		'field_boolean': 'boolean',
		'field_integer': 'integer',
		'field_double': 'double',
		'sort': 'integer',
		'state': 'integer',
		'score': 'integer'
	  },
	  settings_full = await db.getConfig()

	// Database Run
	const jsonDB = await db.run(settings)

	/** Database сonnecting table demo_table */
	let table = await jsonDB.table(table_name, await settings_full)
	if (table === false) {
		await jsonDB.create(table_name, table_config, settings_full)
		table = await jsonDB.table(table_name, await settings_full)
	}

	let id = table.lastId()

	console.log('lastId:', id)

	// Creating random items up to the specified id
	while (id < 5000) {
		
		// Clear cache item
		await table.clear()

    	// New item
		table.alias = Plugin.token()
		let title = Plugin.randomWord(words_en, 3)
		table.title = title[0].toUpperCase() +title.slice(1)
		let description = Plugin.randomWord(words_en, 10)
		table.description = description[0].toUpperCase() + description.slice(1)
		let field_string = Plugin.randomWord(words_en, 4)
		table.field_string = field_string[0].toUpperCase() + field_string.slice(1)
		table.field_boolean = Plugin.randomBoolean()
		table.field_double = Plugin.randomFloat(0, 100)
		table.field_integer = Plugin.randomInteger(1000, 9999)
		table.sort = Plugin.randomInteger(1, 10000)
		table.state = Plugin.randomInteger(0, 2)
		table.score = Plugin.randomInteger(111111, 1000000)

    	// Create new item
    	await table.save()

		id = await table.currentId

		console.log('Create new item id:', id)

	}
	
	/** Get previous item by id or object params */

	let obj = await table.find({'id': 2000})
	console.log('-- find item by object params --', 'currentId: ', table.currentId, 'item: ', obj)

	let obj2 = await table.find(1000)
	console.log('-- find item by id --', 'currentId: ', table.currentId, 'item: ', obj2)

	/** SELECT */ 
	let res = await table
		//.where('id', '>=', 1)
		//.where('id', '<=', 10000)
		.where('description', 'LIKE', 'worlds')
		//.where('id', 'IN', '10')
		//.where('field_boolean', 'NOT IN', true)
		//.where('title', '>', 'AB')
		//.orderBySql('title DESC, id ASC')
		.orderBy('title', 'ASC')
		.orderBy('id', 'DESC')
		.limit(5, 0) // .limit(number, offset)
		//.offset(0)
		.findAll()

	console.log(`SELECT * FROM ${table_name} WHERE description LIKE '%world%'`, 'count()', table.count(), 'data',  res.data)

	/** Bulk Add Data

	let bulk_arr = [
		{
			"alias": Plugin.token(),
			"title": "title bulk Insert",
			"description": "description bulk Insert",
			"field_string": "Test field string",
			"field_boolean": false,
			"field_integer": 120,
			"field_double": 25.60,
			"sort": 1,
			"state": 1,
			"score": 10
		}, {
			"alias": Plugin.token(),
			"title": "title bulk Insert",
			"description": "description bulk Insert",
			"field_string": "Test field string",
			"field_boolean": false,
			"field_integer": 120,
			"field_double": 25.60,
			"sort": 1,
			"state": 1,
			"score": 10
		}
	]

	demo_table.bulkInsert(bulk_arr)
	*/

}

demoJsonDabaBase()