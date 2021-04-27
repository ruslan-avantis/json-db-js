'use strict'

const Benchmark = require('benchmark')
const suite = new Benchmark.Suite
const Plugin = require('../lib/plugin.js')
const db = new (require('../lib/json_db.js'))()

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

    await jsonDB.create(table_name, table_config, settings_full)

  })
  .add('item.create', async () => {

    let table = await jsonDB.table(table_name, settings_full)

    // New item
	  table.alias = await Plugin.token()
	  table.title = 'Test 13'
	  table.description = 'description 13'
	  table.field_string = 'title_ru Test 13'
	  table.field_boolean = true
	  table.field_integer = 500
	  table.field_double = 10.20
	  table.sort = 1
	  table.state = 1
    table.score = 12

    // Create New Item
    await table.save()

    id = table.id

  })
  .add('table.bulkInsert', async () => {
    
    let table = await jsonDB.table(table_name, settings_full)

    await table.bulkInsert(bulk_arr)

  })
  .add('table.find', async () => {
    
    let table = await jsonDB.table(table_name, settings_full)
    
	  // Get previous item by id
	  await demo_table.find(id)
	  // Edit Item
	  demo_table.alias = await Plugin.token()
	  demo_table.state = 0
	  demo_table.score = 55
	  demo_table.title = 'Edit title'
	  demo_table.description = 'Edit description'
	  demo_table.field_string = 'Edit string'
	  // Update Item
	  await demo_table.save()

  })
  .add('table.select', async () => {

    let table = await jsonDB.table(table_name, settings_full)

    data = await table
      .where('id', '>=', 1)
		  .where('id', '<=', 10)
		  .where('title', '>', 'a')
		  //.orderBySql('title DESC, id ASC')
		  .orderBy('title', 'ASC')
		  .orderBy('id', 'DESC')
		  .limit(10) // .limit(number, offset)
		  .offset(0)
		  .findAll()

  })
  .on('cycle', event => {
    i++
    console.log(` i: ${i} n/ ${event.target}`)
  })
  .run()

}

benchmarkRun()