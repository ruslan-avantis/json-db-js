# «jsonDbJs» - JSON Data Base for Node.js
JSON open source database. Written in Javascript. Distributed under the [MIT](https://opensource.org/licenses/MIT)license.


## :tada: Install
```bash
npm install node-sql-parser --save
```
## :rocket: Usage
```js
const jsonDbRun = require('./lib/json_db.js')
const Plugin = await (require('./lib/plugin.js'))()

// Database configuration
let db = new jsonDbRun().setAutoCreate(true)

const settings = {
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

```

## License
The MIT License (MIT). Please see [LICENSE](https://github.com/ruslan-avantis/json-db/blob/master/LICENSE) for more information.
