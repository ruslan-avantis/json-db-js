# «jsonDbJs» - JSON Data Base for Node.js
JSON open source database. Written in Javascript. Distributed under the [MIT](https://opensource.org/licenses/MIT) license.

## The following libraries need to be installed
```bash
fs-extra
sanitize-html
path
uuid
crypto
dateformat
curlrequest
```

## :rocket: Simple Usage

```js
const jsonDbRun = require('./lib/json_db.js')
const Plugin = (require('./lib/plugin.js'))()

const demoFunc = async () => {

    const db = new jsonDbRun().setAutoCreate(true)

    let settings = {
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

    // Database Run
    const jsonDB = await db.run(settings)

    // Table Name
    let table_name = 'demo_table'
    
    // Table Fields. The 'id' field is added automatically
    // fields types: ['boolean', 'integer', 'double', 'string', 'array', 'object']
    let table_fields = {
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
    }
    
    // Create Table
    await jsonDB.create(table_name, table_fields, await db.getConfig())

    // Database сonnecting table demo_table
    const demo_table = await jsonDB.table('demo_table', await db.getConfig())

    // New item
    demo_table.alias = await Plugin.token()
    demo_table.title = 'Test 13'
    demo_table.description = 'description 13'
    demo_table.field_string = 'title_ru Test 13'
    demo_table.field_boolean = true
    demo_table.field_integer = 500
    demo_table.field_double = 10.20
    demo_table.sort = 1
    demo_table.state = 1
    demo_table.score = 12

    // Create New Item
    await demo_table.save()

    // Get ID Item
    let id = demo_table.id
    
    console.log('demo_table.id: ', id)

    // Edit Curent Item
    demo_table.state = 5
    demo_table.score = '103'
    // Update Curent Item
    await demo_table.save()

    // Clear Cache Item
    await demo_table.clear()
    
    console.log('-- Clear Cache Item --', demo_table)

    // New Item
    demo_table.alias = await Plugin.token()
    demo_table.title = 'title'
    demo_table.description = 'description'
    demo_table.field_string = 'string'
    demo_table.field_boolean = true
    demo_table.field_integer = 300
    demo_table.field_double = 15.70
    demo_table.sort = 2
    demo_table.state = 3
    demo_table.score = 10
    // Create New Item
    await demo_table.save()

    console.log('-- Get id new item --', demo_table.id)

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

    console.log('-- Update item data --', demo_table)
}

demoFunc()

```

## Bulk Add Data
```js
const jsonDbRun = require('./lib/json_db.js')
const Plugin = (require('./lib/plugin.js'))()

async function demoFunc() {

    // Database Connect
    const db = new jsonDbRun()
    // Database Run
    const jsonDB = await db.run()

    // Database сonnecting table demo_table
    const demo_table = await jsonDB.table('demo_table', await db.getConfig())
    
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
        },
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
        }
    ]

    let ids = await demo_table.bulkInsert(bulk_arr)

}

demoFunc()

```

## SELECT Data
```js
const jsonDbRun = require('./lib/json_db.js')

const demoFunc = async () => {

    // Database configuration
    const db = new jsonDbRun()
    // Database Run
    const jsonDB = await db.run()
    // Database сonnecting table demo_table
    const demo_table = await jsonDB.table('demo_table', await db.getConfig())

    let data = await demo_table
        .where('id', '>=', 1)
        .where('id', '<=', 10)
        .where('title', '>', 'AB')
        //.orderBySql('title DESC, id ASC')
        .orderBy('title', 'ASC')
        .orderBy('id', 'DESC')
        .limit(10) // .limit(number, offset)
        .offset(0)
        .findAll()

    console.log('data', data)
}

demoFunc()

```

## License
The MIT License (MIT). Please see [LICENSE](https://github.com/ruslan-avantis/json-db/blob/master/LICENSE) for more information.
