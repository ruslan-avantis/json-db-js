if (!global.json_db) global.json_db = {}
global.json_db.consoleLog = (...arg) => {
	console.log(...arg)
}
// Статусы вывода логов
global.json_db.console_error = true 
global.json_db.console_plugin = false

const dir_app = process.env.DIR_APP ? process.env.DIR_APP : (global.json_db.dir_app ? global.json_db.dir_app : __dirname)
const dir_adapter =  dir_app+'/adapter'
const fs = require(dir_adapter+'/fs.js')
const curl = require(dir_adapter+'/curlrequest.js')

const dbException = require(dir_app+'/db_exception.js')
const ObjClass = require(dir_app+'/obj_class.js')
const Plugin = (require(dir_app+'/plugin.js'))()
const File = require(dir_app+'/data_base_file.js')
const TableData = require(dir_app+'/table_data.js')
const TableConfig = require(dir_app+'/table_config.js')
const TableRelation = require(dir_app+'/table_relation.js')
const ValidateData = require(dir_app+'/validate_data.js')
const Core = require(dir_app+'/data_base_core.js')
const DataBase = require(dir_app+'/data_base.js')

class JsonDataBase {

	constructor(settings = {}) {
		/** global db settings
		*/
		this.settings = {}
		this.settings.key // Передаем ключ шифрования файлов
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

		if (settings) Object.assign(this.settings, settings)

	}

	/** Configuration and formation of a global variable
	 * @return true
	 */
	async setConfig(user_settings = {}) {

		let settings = {'dir': {}, 'key': {}}
		settings.dir.JSON_DB_DIR = process.env.JSON_DB_DIR ? process.env.JSON_DB_DIR : __dirname+'/../_json_db_'
		settings.dir.JSON_DB_CORE_DIR = settings.dir.JSON_DB_DIR+'/core'
		settings.dir.JSON_DB_LOG_DIR = settings.dir.JSON_DB_DIR+'/log'
		settings.dir.STRUCTURE_REP = 'https://raw.githubusercontent.com/ruslan-avantis/structure-db/master/db.json'
		// Проверяем папки DB, если нет создаем
		if (!fs.existsSync(settings.dir.JSON_DB_DIR)){fs.mkdirSync(settings.dir.JSON_DB_DIR)}
		// Проверяем существуют ли необходимые каталоги, если нет создаем
		if (!fs.existsSync(settings.dir.JSON_DB_CORE_DIR)) {await fs.mkdirSync(settings.dir.JSON_DB_CORE_DIR) }
		if (!fs.existsSync(settings.dir.JSON_DB_LOG_DIR)) {await fs.mkdirSync(settings.dir.JSON_DB_LOG_DIR) }
		// Создаем ключ доступа
		if (!fs.existsSync(settings.dir.JSON_DB_CORE_DIR+'/key_db.txt')) {
			//let ajax_key = Key.createNewRandomKey()
			//let key_db = ajax_key.saveToAsciiSafeString()
			settings.key.db = '1234567890'
			fs.writeFileSync(settings.dir.JSON_DB_CORE_DIR+'/key_db.txt', settings.key.db, 'utf8')
		}
		settings.console_error = process.env.JSON_DB_CONSOLE_ERR ? process.env.JSON_DB_CONSOLE_ERR : false
		settings.consoleLog = (...arg) => { console.log(...arg) }
		settings.JSON_DB_CRYPT = process.env.JSON_DB_CRYPT ? process.env.JSON_DB_CRYPT : false
		settings.HTTP_CODES = "https://github.com/ruslan-avantis/APIS-2018/tree/master/http-codes/"

		Object.assign(this.settings, settings, user_settings)

		return this.settings
	}

	async getConfig() {
		return this.settings
	}

	/** Start function
	 * @return DataBase() interface
	 */
	async run(settings = {}) {

		settings = await this.setConfig(settings)

		const table_queue = await ValidateData.table('queue', settings)
		const queue_exists = await table_queue.exists()

		if (queue_exists === false) {
			// Если таблицы queue нет, создаем 
			DataBase.create('queue', {
				'db': 'string',
				'resource': 'string',
				'resource_id': 'integer',
				'request': 'string',
				'request_body': 'string'
			}, settings)
		}

		const file_db = await settings.dir.JSON_DB_CORE_DIR+'/db.json'

		// Если файла структуры базы данных нет, скачиваем его с github или локального хранилища
		if (!fs.existsSync(file_db)) {

			let structure_data

			// Если файл структуры базы данных обозначен пользователем
			if (fs.existsSync(this.settings.structure) === true) {
				structure_data = await fs.readFileSync(this.settings.structure, 'utf8')
				// Сохраняем в файл
				if (structure_data) {
					await fs.writeFileSync(settings.dir.JSON_DB_CORE_DIR+'/db.json', structure_data, 'utf8')
				}
			}
			// Если пользователь не указал ссылку на файл, нет скачиваем из репозитория
			else {

				curl.request({ url: settings.dir.STRUCTURE_REP }, async (err, data) => {
					if (!err && data) {
						//let parse_data = JSON.parse(data)
						await fs.writeFileSync(settings.dir.JSON_DB_CORE_DIR+'/db.json', data, 'utf8')
					} else {
						const err = `Error downloading file from repository: ${settings.dir.STRUCTURE_REP}`
						if (settings.console_error) {
							settings.consoleLog(err, __filename)
							return false
						} else throw new dbException(err)
					}
				})
			}
		}

		let timeout = 10000
		if (fs.existsSync(settings.dir.JSON_DB_CORE_DIR+'/db.json')) timeout = 1000
  
		setTimeout(async () => {
			if (this.settings.auto_create === true) {

				//settings.consoleLog('START auto_create, timeout:', timeout)

				// Проверяем наличие файла повторно
				// Автоматически создает таблицы указанные в файле db.json если их нет
				if (fs.existsSync(settings.dir.JSON_DB_CORE_DIR+'/db.json')) {
				
					// Получаем файл установки таблиц
					const tasks_data = await fs.readFileSync(settings.dir.JSON_DB_CORE_DIR+'/db.json')
					const tasks = await JSON.parse(tasks_data)

					if (tasks.length >= 1) {

						//settings.consoleLog('tasks.length', tasks.length)
						
						for(let unit of tasks) {

							// Если существует поле table
							if (unit['table']) {
	 
								// Проверяем существуют ли необходимые таблицы. Если нет создаем.
								const table_exists = await ValidateData.table(unit['table'], settings).exists()

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

	/**
	* @param true|false $temp
	*/
	setTemp(temp = false) {
		this.settings.temp = Boolean(temp)
		return this
	}

	/**
	* @param true|false $api
	*/
	setApi(api = false) {
		this.settings.api = Boolean(api)
		return this
	}
 
	/**
	* @param false|uri $export
	*/
	setExport(exp) {
		this.settings.export = exp
		return this
	}

	/**
	* @param integer $size
	*/
	setSize(size) {
		if (isFinite(size)) size = Number(size)
		if (!Number.isInteger(size)) size = parseFloat(size)
		this.settings.size = size
		return this
	}

	/**
	* @param integer $max_size
	*/
	setMaxSize(max_size) {
		if (isFinite(max_size)) max_size = Number(max_size)
		if (!Number.isInteger(max_size)) max_size = parseFloat(max_size)
		this.settings.max_size = max_size
		return this
	}

	/**
	* @param 'db.core' or uri
	*/
	setDirCore(dir) {
		this.settings.dir.JSON_DB_CORE_DIR = dir
		return this
	}

	/**
	* @param 'db.log' or uri
	*/
	setDirLog(dir) {
		this.settings.dir.JSON_DB_LOG_DIR = dir
		return this
	}
 
	/**
	* @param 'db.request' or uri
	*/
	setDirRequest(dir_request) {
		this.settings.dir_request = dir_request
		return this
	}

	/**
	* @param key
	*/
	setKey(key) {
		this.settings.key = key
		return this
	}
 
	/**
	* @param key
	*/
	setAutoCreate(auto_create = false) {
		this.settings.auto_create = Boolean(auto_create)
		return this
	}
 
	/**
	* @param crypt
	*/
	setCrypt(crypt) {
		if (isFinite(crypt)) crypt = Number(crypt)
		if (!Number.isInteger(crypt)) crypt = parseFloat(crypt)
		this.settings.crypt = crypt
		return this
	}
 
	/**
	* @param structure
	*/
	setStructure(structure) {
		this.settings.structure = structure
		return this
	}
 
	/**
	* @param structure
	*/
	setPublicKey(public_key) {
		this.settings.public_key = public_key
		return this
	}

	/**
	* @param structure
	*/
	setCached(state) {
		this.settings.cached = state
		return this
	}
	/**
	* @param structure
	*/
	setCacheLifetime(state) {
		this.settings.cached_life_time = state
		return this
	}

	// Генерация uid
	// По умолчанию длина 32 символа, если количество символов не передано в параметре $length
	randomUid(length = 16) {
		return v4()
	}

	// Функция клинер
	clean(value = '') {
		value = value.trim() // Убираем пробелы вначале и в конце
		value = value.replace('/\0/g', '0').replace('/\(.)/g', '$1') // Убираем слеши, если надо // Удаляет экранирование символов
		value = value.replace(/<\/?[^>]+>/gi, '') // Удаляет HTML и PHP-теги из строки
		value = Plugin.escapeHtml(value) // Заменяем служебные символы HTML на эквиваленты // Преобразует специальные символы в HTML-сущности
		return value
	}

}

JsonDataBase.Error = class extends Error {
	constructor(message, code) {
	  super(message)
	  this.code = code
	}
}
  
module.exports = JsonDataBase
 