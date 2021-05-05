if (!global.json_db) global.json_db = {}
global.json_db.consoleLog = (...arg) => {
	console.log(...arg)
}

//global.json_db.console_error = true 
//global.json_db.console_plugin = false

const dir_app = process.env.JSON_DB_APP_DIR ? process.env.JSON_DB_APP_DIR : __dirname

const {DbJsonError, FatalError, ParseError, BaseError } = require(dir_app+'/db_exception.js')
const Plugin = require(dir_app+'/plugin.js')
const fs = Plugin.fs()
const curl = Plugin.curl()
const TableRelation = require(dir_app+'/table_relation.js')
const Validate = require(dir_app+'/validate.js')
const DataBase = require(dir_app+'/db.js')

/** Data Base Class
 *
 */
class JsonDataBase {

	constructor(settings = {}) {

		/** Settings class
		* @var object
		*/
		this.settings = {}
		this.settings.crypt // true|false Шифруем или нет
		this.settings.temp // Очередь на запись. true|false
		this.settings.cached = false
		this.settings.cached_life_time = false
		this.settings.api // true|false Если установить false база будет работать как основное хранилище
		this.settings.size = 50000
		this.settings.max_size = 1000000
		this.settings.structure = __dirname+'/../structure.json'
		this.settings.export
		this.settings.auto_create = true
		this.settings.STRUCTURE_REP = 'https://raw.githubusercontent.com/ruslan-avantis/structure-db/master/db.json'
		this.settings.console_error = process.env.JSON_DB_CONSOLE_ERR ? process.env.JSON_DB_CONSOLE_ERR : false
		this.settings.consoleLog = (...arg) => { console.log(...arg) }
		this.settings.JSON_DB_CRYPT = process.env.JSON_DB_CRYPT ? process.env.JSON_DB_CRYPT : false
		this.settings.HTTP_CODES = "https://github.com/ruslan-avantis/APIS-2018/tree/master/http-codes/"
		this.settings.dir = {}
		this.settings.dir.JSON_DB_DIR = process.env.JSON_DB_DIR ? process.env.JSON_DB_DIR : __dirname+'/../_json_db_'
		this.settings.dir.JSON_DB_CORE_DIR = this.settings.dir.JSON_DB_DIR+'/core'
		this.settings.dir.JSON_DB_LOG_DIR = this.settings.dir.JSON_DB_DIR+'/log'
		this.settings.key = {}

		if (settings) this.settings = Object.assign(this.settings, settings)

	}

	/** Configuration and formation of a global variable
	 * @return true
	 */
	async setConfig(user_settings = {}) {

		if(user_settings) this.settings = await Object.assign(this.settings, user_settings)

		// Проверяем существуют ли необходимые каталоги, если нет создаем
		for (let key in this.settings.dir) {
			let dir = this.settings.dir[key]
			if (!fs.existsSync(dir)){ fs.mkdirSync(dir) }
		}
		// Создаем ключ доступа
		if (!fs.existsSync(this.settings.dir.JSON_DB_CORE_DIR+'/key_db.txt')) {
			//let ajax_key = Key.createNewRandomKey()
			//let key_db = ajax_key.saveToAsciiSafeString()
			this.settings.key.db = '1234567890'
			fs.writeFileSync(this.settings.dir.JSON_DB_CORE_DIR+'/key_db.txt', this.settings.key.db, 'utf8')
		}

		return this.settings
	}

	/** Get settings object
	* @return object
	*/
	async getConfig() {
		return this.settings
	}

	/** Start function
	 * @return this interface
	 */
	async run(settings = {}) {

		if (settings) settings = await this.setConfig(settings)

		const JSON_DB_CORE_DIR = await settings.dir.JSON_DB_CORE_DIR
		const JSON_DB_CORE_FILE = await JSON_DB_CORE_DIR+'/db.json'
		const STRUCTURE_REP = await settings.STRUCTURE_REP
		const STRUCTURE = await settings.structure
		const table_queue = await Validate.table('queue', settings)
		const queue_exists = await table_queue.exists()

		if (queue_exists === false) {
			// Если таблицы queue нет, создаем 
			DataBase.create('queue', {
				'db': 'string',
				'resource': 'string',
				'resource_id': 'integer',
				'request': 'string',
				'request_body': 'string'
			}, this.settings)
		}

		// Если файла структуры базы данных нет, скачиваем его с github или локального хранилища
		if (!fs.existsSync(JSON_DB_CORE_FILE)) {

			let structure_data

			// Если файл структуры базы данных обозначен пользователем
			if (fs.existsSync(STRUCTURE) === true) {
				structure_data = await fs.readFileSync(STRUCTURE, 'utf8')
				// Сохраняем в файл
				if (structure_data) {
					await fs.writeFileSync(JSON_DB_CORE_FILE, structure_data, 'utf8')
				}
			}
			// Если пользователь не указал ссылку на файл, нет скачиваем из репозитория
			else {

				curl.request({ url: STRUCTURE_REP }, async (err, data) => {
					if (!err && data) {
						//let parse_data = JSON.parse(data)
						await fs.writeFileSync(JSON_DB_CORE_FILE, data, 'utf8')
					} else {
						const err = `Error downloading file from repository: ${STRUCTURE_REP}`
						if (settings.console_error) {
							settings.consoleLog(err, __filename)
							return false
						} else throw new DbJsonError(err)
					}
				})
			}
		}

		let timeout = 1000
		if (!fs.existsSync(JSON_DB_CORE_FILE)) timeout = 10000
  
		setTimeout(async () => {

			if (settings.auto_create === true) {

				//settings.consoleLog('START auto_create, timeout:', timeout)

				// Проверяем наличие файла повторно
				// Автоматически создает таблицы указанные в файле db.json если их нет
				if (JSON_DB_CORE_FILE && fs.existsSync(JSON_DB_CORE_FILE)) {
					// Получаем файл установки таблиц
					const tasks_data = await fs.readFileSync(JSON_DB_CORE_FILE, 'utf8')
					const tasks = await JSON.parse(tasks_data)

					if (tasks.length >= 1) {

						//settings.consoleLog('tasks.length', tasks.length)
						
						for(let unit of tasks) {

							// Если существует поле table
							if (unit['table']) {
	 
								// Проверяем существуют ли необходимые таблицы. Если нет создаем.
								const table_exists = await Validate.table(unit['table'], settings).exists()

								if (table_exists === true) {

									//settings.consoleLog('table_exists', table_exists, unit['action'], unit['table'])

									if (unit['action'] == 'update' || unit['action'] == 'create') {
										// Обновляем параметры таблиц
										// Если таблицы есть создаем зависимости
										if (unit['relations']) {
											let unitCount = await unit['relations'].length
											if (unitCount >= 1) {
												for(let rel_key in unit['relations']) {
												
													let rel_value = await unit['relations'][rel_key]
													//let has = rel_value['type']
												
													let table = await TableRelation.table(unit['table'], settings)
													await table.has(rel_key)
													await table.localKey(rel_value['keys']['local'])
													await table.foreignKey(rel_value['keys']['foreign'])
													await table.setRelation()
												}
											}
										}
									}
									else if (unit['action'] == 're-create') {
										// Удаляем таблицы и создаем заново
	 
										await DataBase.remove(unit['table'], settings)
									
										// Создаем таблицы
										let unit_schema_count = await unit['schema'].length
										if (unit_schema_count >= 1) {
											let row = []
	
											for(let key in unit["schema"]) {
												let value = await unit["schema"][key]
												if (key && value) {
													row[key] = await value
												}
											}
	 
											await DataBase.create(unit['table'], row, settings)
	
										}
									}
									else if (unit['action'] == 'delete') {
										// Удаляем таблицы
										await DataBase.remove(unit['table'], settings)
									}
								} else {

									if (unit['action'] == 'create') {

										//settings.consoleLog('!!!', unit['table'], unit['action'])

										// Создаем таблицы
										if (unit['schema']) {
											let row = {}
											for(let key in unit['schema']) {
												let value = await unit['schema'][key]
												if (key && value) {
													row[key] = await value
												}
											}
											await DataBase.create(unit['table'], row, settings)
										}
									}
								}
							}
						}
					}
				}
			}
		}, timeout)

		return DataBase
	}

	/** Set temp status
	* @param true|false $temp
	* @return this
	*/
	setTemp(temp = false) {
		this.settings.temp = Boolean(temp)
		return this
	}

	/** Set size
	* @param integer $size
	* @return this
	*/
	setSize(size) {
		if (isFinite(size)) size = Number(size)
		if (!Number.isInteger(size)) size = parseFloat(size)
		this.settings.size = size
		return this
	}

	/** Set max size
	* @param integer $max_size
	* @return this
	*/
	setMaxSize(max_size) {
		if (isFinite(max_size)) max_size = Number(max_size)
		if (!Number.isInteger(max_size)) max_size = parseFloat(max_size)
		this.settings.max_size = max_size
		return this
	}

	/** Set core dir
	* @param string $dir
	* @return this
	*/
	setDirCore(dir) {
		this.settings.dir.JSON_DB_CORE_DIR = dir
		return this
	}

	/** Set dir log
	* @param string $dir
	* @return this
	*/
	setDirLog(dir) {
		this.settings.dir.JSON_DB_LOG_DIR = dir
		return this
	}
 
	/** Set key
	* @param string $key
	* @return this
	*/
	setKey(key) {
		this.settings.key = key
		return this
	}
 
	/** Set table auto create satatus
	* @param boolean $auto_create
	* @return this
	*/
	setAutoCreate(auto_create = false) {
		this.settings.auto_create = Boolean(auto_create)
		return this
	}
 
	/** Set crypt satatus
	* @param boolean $crypt
	* @return this
	*/
	setCrypt(crypt) {
		if (isFinite(crypt)) crypt = Number(crypt)
		if (!Number.isInteger(crypt)) crypt = parseFloat(crypt)
		this.settings.crypt = crypt
		return this
	}
 
	/** Set url for structure
	* @param string $url
	* @return this
	*/
	setStructure(url) {
		this.settings.structure = url
		return this
	}
 
	/** Set public_key
	* @param string $public_key
	* @return this
	*/
	setPublicKey(public_key) {
		this.settings.public_key = public_key
		return this
	}

	/** Set cached status
	* @param boolean
	* @return this
	*/
	setCached(state) {
		this.settings.cached = state
		return this
	}

	/** Set cache Lifetime status
	* @param boolean
	* @return this
	*/
	setCacheLifetime(state) {
		this.settings.cached_life_time = state
		return this
	}

	/** Cleaner method
	* @param string $value
	* @return string
	*/
	clean(value = '') {
		value = value.trim() // Remove spaces at the beginning and at the end
		value = value.replace('/\0/g', '0').replace('/\(.)/g', '$1') // Remove slashes, if necessary // Remove character escaping
		value = value.replace(/<\/?[^>]+>/gi, '') // Removes HTML tags from a string
		return value
	}

}
  
module.exports = JsonDataBase