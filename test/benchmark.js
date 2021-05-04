'use strict'

/** Change Max Listeners limit **/
const Emitter = require("events")
let emitter = new Emitter()

console.log('emitter.getMaxListeners()', emitter.getMaxListeners())

if (emitter.getMaxListeners() <= 20) {
	require('events').EventEmitter.defaultMaxListeners = 20
}

console.log('emitter.getMaxListeners() 2 ', emitter.getMaxListeners())

const Benchmark = require('benchmark')
const suite = new Benchmark.Suite
const Plugin = require('../lib/plugin.js')
const db = new (require('../lib/db_run.js'))()
//const words_ru = require('../demo/words_ru.json')
const words_en = require('../demo/words_en.json')
//const { initial } = require("lodash")

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
	'field_object': 'object',
    'field_array': 'array',
	'sort': 'integer',
	'state': 'integer',
	'score': 'integer',
	'date_create': 'string',
	'date_update': 'string'
  },
  settings_full = await db.getConfig()

  let i = 1, ii = 1, id = 0

  suite
  .add('table.create', () => {
	ii++
	let table = jsonDB.table(table_name, settings_full)

    if (table === false) {
        jsonDB.create(table_name, table_config, settings_full)
        table = jsonDB.table(table_name, settings_full)
    }

  })
  .add('items.create', async () => {
	ii++
	const table = await jsonDB.table(table_name, settings_full)
	if (table) {
		await table.clear()
		let new_obj = await randomItem()
		for (let field in new_obj) {
			table[field] = await new_obj[field]
		}
		table['field_object'] = await randomItem()
		// Create new item
		await table.save()
	}
  })
  .add('insert', async () => {
	ii++
	const table = await jsonDB.table(table_name, settings_full)
	if (table) {
		let bulk_arr = [], bulk_i = 0
		while (bulk_i < 3) {
			let field_object = await randomItem()
			await bulk_arr.push(field_object)
			bulk_i++
		}
		let ids = await table.insert(bulk_arr)
	}
  })
  .add('table.find.id', async () => {
	ii++
	const table = await jsonDB.table(table_name, settings_full)
	if (table) {
		const id_ = await Plugin.randomInteger(1, i*50)
		const obj = await table.find(id_)
		//console.log('table.find.id:', 'ii', ii, obj.id)
	}
  })
  .add('table.find.obj', async () => {
	ii++
	const table = await jsonDB.table(table_name, settings_full)
	if (table) {
		const id_ = await Plugin.randomInteger(1, i*100)
		const obj = await table.find({ id: id_ })
		//console.log('table.find.obj.id:', 'ii', ii, obj.id)
	}
  })
  .add('table.select', async () => {
	ii++
	const table = await jsonDB.table(table_name, settings_full)
	if (table) {
		const data = await table
			.where('id', '>=', i*1)
			.where('id', '<=', i*10)
			.limit(i, 0)
			.findAll()
		//console.log('table.select:', 'ii', ii, data)
	}
  })
  .add('table.select.orderBy', async () => {
	ii++
	const table = await jsonDB.table(table_name, settings_full)
	if (table) {
		const data = await table
			.where('description', 'LIKE', 'world')
			.orderBy('title', 'ASC')
			.orderBy('id', 'DESC')
			.limit(i, 0)
			.findAll()
		//console.log('table.select:', 'ii', ii, data)
	}
  })
  .add('table.select.orderBySql', async () => {
	ii++
	const table = await jsonDB.table(table_name, settings_full)
	if (table) {
		const data = await table
        	.where('description', 'LIKE', 'world')
        	.orderBySql('title DESC, id ASC')
        	.limit(i, 0)
        	.findAll()
		//console.log('table.select:', 'ii', ii, data)
	}
  })
  .add('table.lastId()', async () => {
	ii++
	const table = await jsonDB.table(table_name, settings_full)
    if (table) {
		id = await table.lastId()
		//console.log('lastId:', 'ii', ii, id)
	}
  })
  .on('cycle', async event => {
    i++
    console.log(`i: ${i} , ii: ${ii} , ${event.target}`)
  })
  .run()

}

benchmarkRun()