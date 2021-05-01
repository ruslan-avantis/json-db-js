'use strict'

const Benchmark = require('benchmark')
const suite = new Benchmark.Suite
const Plugin = require('../lib/plugin.js')
const db = new (require('../lib/db_run.js'))()
const words_ru = require('./words_ru.json')
const words_en = require('./words_en.json')

let benchmarkRun = async () => {

  const settings = {
    'console_error': true,
    'consoleLog': (...arg) => { console.log(...arg) }
  },
  jsonDB = await db.run(settings),
  table_name = 'benchmark_table',
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

  let data = [], obj = {}, id, i = 1

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

  suite
  .add('table.create', async () => {
    //await jsonDB.create(table_name, table_config, settings_full)
  })
  /** */
  .add('item.create', async () => {

    let table = await jsonDB.table(table_name, settings_full)

	await table.clear()

    // New item
	table.alias = Plugin.token()
	table.title = Plugin.randomWord(words_ru, 3)
	table.title = table.title[0].toUpperCase() + table.title.slice(1)
	table.description = Plugin.randomWord(words_en, 10)
	table.description = table.description[0].toUpperCase() + table.description.slice(1)
	table.field_string = Plugin.randomWord(words_en, 4)
	table.field_string = table.field_string[0].toUpperCase() + table.field_string.slice(1)
	table.field_boolean = Plugin.randomBoolean()
	table.field_double = Plugin.randomFloat(0, 100)
	table.field_integer = Plugin.randomInteger(1000, 9999)
	table.sort = Plugin.randomInteger(1, 10000)
	table.state = Plugin.randomInteger(0, 2)
	table.score = Plugin.randomInteger(111111, 1000000)

    // Create New Item
    await table.save()

  })
  
  //.add('table.bulkInsert', async () => {
    
    //let table = await jsonDB.table(table_name, settings_full)

    //await table.bulkInsert(bulk_arr)

  //})
  //.add('table.find', async () => {
    /**
    let table = await jsonDB.table(table_name, settings_full)
    
	// Get previous item by id
	await table.find(id)
	// Edit Item
	table.alias = await Plugin.token()
	table.title = await Plugin.randomWord(words_ru, 3)
	table.title = await table.title[0].toUpperCase() + table.title.slice(1)
	table.description = await Plugin.randomWord(words_en, 10)
	table.description = await table.description[0].toUpperCase() + table.description.slice(1)
	table.field_string = await Plugin.randomWord(words_en, 4)
	table.field_string = await table.field_string[0].toUpperCase() + table.field_string.slice(1)
	table.field_boolean = true
	table.field_integer = await Plugin.randomInteger(1000, 9999)
	table.sort = await Plugin.randomInteger(1, 9999)
	table.state = await Plugin.randomInteger(0, 1)
	table.score = await Plugin.randomInteger(1, 9999)
	// Update Item
	await table.save()
	*/

  //})
  //.add('table.select', async () => {
  	/**
    let table = await jsonDB.table(table_name, settings_full)

    data = await table
		//.where('id', '>=', 1)
		//.where('id', '<=', 10)
		.where('description', 'LIKE', 'world')
		//.where('title', '>', 'a')
		//.orderBySql('title DESC, id ASC')
		.orderBy('title', 'ASC')
		.orderBy('id', 'DESC')
		.limit(2) // .limit(number, offset)
		.offset(0)
		.findAll()
	*/

  //})
  .on('cycle', event => {
    i++
    console.log(` i: ${i} n/ ${event.target}`)
  })
  .run()

}

benchmarkRun()