# «jsonDbJs» - JSON Data Base for Node.js
JSON open source database. Written in Javascript. Distributed under the [MIT](https://opensource.org/licenses/MIT) license.

## The following libraries need to be installed
```json
{
  "assert": "^2.0.0",
  "benchmark": "^2.1.4",
  "chai": "^4.3.4",
  "curlrequest": "^1.0.1",
  "dateformat": "^3.0.3",
  "debug": "^4.3.1",
  "dotenv": "^8.2.0",
  "fs-extra": "^7.0.1",
  "helmet": "^3.21.2",
  "lodash": "^4.17.15",
  "mocha": "^8.3.2",
  "npm": "^6.8.0",
  "path": "^0.12.7",
  "promise": "^8.0.2",
  "uuid": "^3.3.2"
}
```

## Quick test

For a quick test run the file [demo.js](https://github.com/ruslan-avantis/json-db-js/blob/main/demo.js)
```bash
node demo.js
```

## :rocket: Simple Usage
```js
const Plugin = require('./lib/plugin.js')
//const words_it = require('./test/words_it.json')
//const words_ru = require('./test/words_ru.json')
const words_en = require('./test/words_en.json')

let db = new (require('./lib/db_run.js'))()

const demoFunc = async () => {

    //db.setAutoCreate(true)

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
        'field_obj': 'object',
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
    let table = await jsonDB.table(table_name, await settings_full)
    if (table === false) {
        await jsonDB.create(table_name, table_config, settings_full)
        table = await jsonDB.table(table_name, await settings_full)
    }

    let id = table.lastId()

    console.log('lastId:', id)

    // Creating random items up to the specified id
    while (id < 8000) {
        
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
        table.field_obj = {'a': 1, 'b': 2}
        table.field_array = [1,2,3,4,5]
        table.sort = Plugin.randomInteger(1, 10000)
        table.state = Plugin.randomInteger(0, 2)
        table.score = Plugin.randomInteger(111111, 1000000)
        table.date_create = Plugin.dateFormat(Date.now(), "dd-mm-yyyy HH:MM:ss")
        table.date_update = table.date_create

        // Create new item
        await table.save()

        id = await table.currentId

        console.log('Create new item id:', id)

    }
    
    /** Get item object by object params */
    let obj = await table.find({'id': 2000})
    console.log('-- find item by object params --', 'currentId: ', table.currentId, ', item: ', obj)

    /** Get item object by id */
    let obj2 = await table.find(1000)
    console.log('-- find item by id --', 'currentId: ', table.currentId, ', item: ', obj2)

    
}

demoFunc()

```

## Bulk Add Data
```js

async function demoFunc(table_name) {

    // Database сonnecting table table_name
    const table = await jsonDB.table(table_name, await db.getConfig())

    let bulk_arr = [], i = 0

    while (i < 3) {

        let item_obj = {}

        item_obj.alias = Plugin.token()

        let title = Plugin.randomWord(words_en, 3)
        item_obj.title = title[0].toUpperCase() +title.slice(1)

        let description = Plugin.randomWord(words_en, 10)
        item_obj.description = description[0].toUpperCase() + description.slice(1)

        let field_string = Plugin.randomWord(words_en, 4)
        item_obj.field_string = field_string[0].toUpperCase() + field_string.slice(1)

        item_obj.field_boolean = Plugin.randomBoolean()
        item_obj.field_double = Plugin.randomFloat(0, 100)
        item_obj.field_integer = Plugin.randomInteger(1000, 9999)
        item_obj.field_obj = {'a': 1, 'b': 2, 'c': 3, 'd': 4}
        item_obj.field_array = [1,2,3,4,5,6,7,8,9,10]

        item_obj.sort = Plugin.randomInteger(1, 10000)
        item_obj.state = Plugin.randomInteger(0, 2)
        item_obj.score = Plugin.randomInteger(111111, 1000000)
        item_obj.date_create = Plugin.dateFormat(Date.now(), "dd-mm-yyyy HH:MM:ss")
        item_obj.date_update = item_obj.date_create

        bulk_arr.push(item_obj)
    }

    let ids = await table.bulkInsert(bulk_arr)

}

demoFunc('demo_table')

```

## SELECT Data
```js

const demoFunc = async () => {

    // Set table name
    const table_name = 'demo_table'

    // Database сonnecting table demo_table
    const table = await jsonDB.table(table_name, await db.getConfig())

    /** Analog SELECT
     * `SELECT * FROM ${table_name} WHERE description LIKE '%world%' ORDER BY title ASC, id DESC LIMIT 5 OFFSET 0`
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
        .limit(5, 0) // .limit(number, offset)
        //.offset(0)
        .findAll()

    console.log('count: ', table.count(), 'Total count: ', table.totalCount(), ', data: ',  res.data)
}

demoFunc()

```

## Available static methods for table
```js

  const jsonDB = (new (require('./lib/db_run.js'))()).run()

  // Set table
  jsonDB.table(table_name, settings = {})
  jsonDB.from(table_name, settings = {}) // Alias for table()
  // Create table
  jsonDB.create(table_name = '', fields = {}, settings = {})
  // Delete table
  jsonDB.remove(table_name, settings = {})

  // SQL-like !!! Coming soon !!!
  jsonDB.sql(sql_string, values = [], settings = {})
```

## Available methods for table and items
```js
  const jsonDB = (new (require('./lib/db_run.js'))()).run()

  // Set table name
  const table_name = 'demo_table'
  // Set table
  const table = jsonDB.table(table_name, settings = {})

  table.name() // Returns table name
  table.getData() // Get rows from table
  table.setData() // Setting array data to table.data
  
  table.objectInsert(obj) // Create item from object
  table.bulkInsert(data) // Create items from array or object
  table.getRowKey(id) // Returns array key of row with specified ID
  table.clearKeyInfo() // Set NULL for currentId and currentKey and item id
  table.setFields()

  // last_id in curent table
  table.lastId()
  // Check if the given field exists
  table.isset(field)
  // table schema
  table.schema()

  // Get item data
  let obj = await table.find(id) // Get item by id
  let obj = await table.find({'id': 1}) // Get item by object data

  table.currentId
  table.currentKey

  /** setter or getter field for item */
  table[field_name] // get
  table[field_name] = 1 // set
  delete table[field_name] // delete

  // Save-update item data
  table.save()
  // delete curent item
  table.delete()
  // clear cache curent item
  table.clear()

  // SELECT
  // operators ['=', '==', '===', '<>', '!=', '!==', '>', '<', '>=', '<=', 'and', 'or']
  table.where(field, operator, value) 
  table.andWhere(field, operator, value) // Alias for where(), setting AND for searching
  table.orWhere(field, operator, value) // Alias for where(), setting OR for searching
  table.orderBy(field, sort) // ASC or DESC
  table.orderBySql('title DESC, id ASC') // ORDER BY an SQL-like
  table.limit(number, offset = 0) // set limit and offset
  table.offset(offset) // set offset
  
  let data = await table.findAll() // Execute
  // or
  await table.findAll() // Execute
  let data = await table.data

  table.count()
  table.totalCount()

  // Get all data table
  let all_table_data = await table.getData()

```

## Coming Soon: Support for SQL syntax
```js

const jsonDbRun = require('./lib/db_run.js')

const demoFunc = async () => {

    // Database configuration
    const db = new jsonDbRun()
    // Database Run
    const jsonDB = await db.run()
    // Database сonnecting table demo_table
    
    let sql_string = `SELECT * FROM products WHERE category_id IN (SELECT id FROM categories) ORDER BY id`
    /** Other examples
        `SELECT name FROM leaderboard ORDER BY score DESC LIMIT 5 OFFSET 3`
        `SELECT * FROM prods WHERE name LIKE '%keyword%' OR sku LIKE '%keyword%'`
        `SELECT a.name AS name 
         FROM (SELECT *, (price*quantity) AS new FROM Products ORDER BY new DESC, name ASC LIMIT 1 OFFSET 0) AS a`
     */

    let values = [] // [] or false or array values

    let data = await jsonDB.sql(sql_string, values, await db.getConfig())

    console.log('data', data)
}

demoFunc()

```

## License
The MIT License (MIT). Please see [LICENSE](https://github.com/ruslan-avantis/json-db/blob/master/LICENSE) for more information.
