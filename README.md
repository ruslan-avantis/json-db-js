# JSON Data Base for Javascript (Node.js)
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
## Useful functions: Random Item Generate with the before and after prefix
```js
/** Random item generate. You can change this function to suit your needs.
 * @param string $before
 * @param string $after
 * @param array $words_1
 * @param array $words_2
 * @return object item
 */
const randomItem = async (before = '', after = '', words_1 = [], words_2 = []) => {
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
```
## :rocket: Simple Usage
```js
const Plugin = require('./lib/plugin.js')
//const words_it = require('./test/words_it.json')
//const words_ru = require('./test/words_ru.json')
const words_en = require('./test/words_en.json')

let db = new (require('./lib/db_run.js'))()

const settings = {
    'console_error': true,
    'consoleLog': (...arg) => { console.log(...arg) }
},
prefix_before = '_', // Field: '_alias'
prefix_after = '_1', // Field: 'alias_1'
// Table name with prefixes. Return '_demo_table_1'
table_name = Plugin.tableName('demo_table', prefix_before, prefix_after),
// Table config with prefixes. Return '_alias_1', '_title_1'
table_config = Plugin.tableConfig({
    'alias': 'string',
    'title': 'string',
    'description': 'string',
    'field_string': 'string',
    'field_boolean': 'boolean',
    'field_integer': 'integer',
    'field_double': 'double',
    'field_obj': 'object', // Fields of type array or object support search LIKE %text%
    'field_array': 'array', // Fields of type array or object support search LIKE %text%
    'sort': 'integer',
    'state': 'integer',
    'score': 'integer',
    'date_create': 'string',
    'date_update': 'string'
}, prefix_before, prefix_after),
settings_full = await db.getConfig()

// Database Run
const jsonDB = await db.run(settings)

const demoFunc = async () => {

    /** Database сonnecting table benchmark_table */
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
        // Generate new item
        let item = randomItem(prefix_before, prefix_after, words_en, words_en)
        // Set fields item
        for (let field in item) {
            table[field] = item[field]
        }
        // Create new item
        await table.save()
        // Get id new item
        id = await table.currentId

        console.log('Create new item id:', id)

    }
    
    // Get item object by object params
    let obj = await table.find({'id': 2000})
    console.log('-- find item by object params --', 'currentId: ', table.currentId, ', item: ', obj)

    // Get item object by id
    let obj2 = await table.find(1000)
    console.log('-- find item by id --', 'currentId: ', table.currentId, ', item: ', obj2)

}

demoFunc()

```

## Bulk Add Data
```js

const bulkAddData = async () => {

    // Database сonnecting table table_name
    const table = await jsonDB.table(table_name, await db.getConfig())

    let bulk_arr = [], bulk_i = 0

    while (bulk_i < 3) {
        let item = randomItem(prefix_before, prefix_after, words_en, words_en)
        bulk_arr.push(item)
        bulk_i++
    }

    let ids = await table.insert(bulk_arr)

}

bulkAddData()

```

## SELECT Data
```js

const selectData = async () => {

    // Database сonnecting table benchmark_table
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

selectData()

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
  const table_name = 'benchmark_table'
  // Set table
  const table = jsonDB.table(table_name, settings = {})

  table.name() // Returns table name
  table.getData() // Get rows from table
  table.setData() // Setting array data to table.data

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

  // Clear cache curent item
  table.clear()

  /** setter or getter field for item */
  table[field_name] // get
  table[field_name] = 1 // set
  delete table[field_name] // delete

  // Save-update item data
  table.save()
  // Delete curent item
  table.delete()

  // Bulk Insert Data. Create items from array or object
  table.insert(data)

  // SELECT
  // where operators ['=', '==', '===', '<>', '!=', '!==', '>', '<', '>=', '<=', 'LIKE', 'IN', 'NOT IN']
  table.where(field, operator, value) 
  table.andWhere(field, operator, value) // Alias for where(), setting AND for searching
  table.orWhere(field, operator, value) // Alias for where(), setting OR for searching
  table.orderBy(field, sort = 'ASC') // ASC or DESC, default sort = ASC 
  table.orderBySql('title DESC, id ASC') // ORDER BY an SQL like
  table.limit(number, offset = 0) // set limit and offset
  table.offset(offset) // set offset

  table.columns('*') // default all columns
  // or string SQL like
  table.columns('id AS _id, title, field_boolean AS boolean')
  // or array
  table.columns([
    {'column': 'id', 'as': '_id'},
    {'column': 'title'},
    {'column': 'field_boolean', 'as': 'boolean'}
  ])
  
  let data = await table.findAll() // Execute
  // or
  await table.findAll() // Execute
  let data = await table.data

  table.count()
  table.totalCount()

  // Get all data table
  let all_table_data = await table.getData()

```

## Support for SQL syntax
Currently only select is supported
```js

const jsonDbRun = require('./lib/db_run.js')

const sqlFunction = async () => {

    const table_name = 'benchmark_table'
    // Currently only select is supported
    let sql_string = `
        SELECT *
        FROM ${table_name}
        WHERE description LIKE '%world%'
        ORDER BY id DESC
        LIMIT 5 OFFSET 0
    `
    // or
    let sql_string = `
        SELECT id, title AS name, description AS desc_
        FROM ${table_name}
        WHERE id >= 100 AND id <= 1000 AND description LIKE '%world%'
        ORDER BY title, id DESC
        LIMIT 10 OFFSET 0
    `

    let data_sql = await jsonDB.query(sql_string, [], db.getConfig())

    console.log('data_sql:', data_sql)

}

sqlFunction()

```

## License
The MIT License (MIT). Please see [LICENSE](https://github.com/ruslan-avantis/json-db/blob/master/LICENSE) for more information.
