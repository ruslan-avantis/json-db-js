const dir_app = process.env.JSON_DB_APP_DIR ? process.env.JSON_DB_APP_DIR : __dirname
const Plugin = (require(dir_app+'/plugin.js'))()
const dbException = require(dir_app+'/db_exception.js')
const dir_adapter = dir_app+'/adapter'
const fs = require(dir_adapter+'/fs.js')

/**
 * File managing class
 *
 * @category Helpers
 */
class File {

	constructor(settings = {}) {

		//super()

		/**
		* File name
		* @var string
		*/
		this.name

		/**
		* File type (data|config)
		* @var string
		*/
		this.type

		this.settings = {}
		if (settings) Object.assign(this.settings, settings)

	}

	static table(table_name, settings = {}) {
		const file = new File(settings)
		file.table_name = table_name
		return file
	}

	setType(type) {
		this.type = type
		return true
	}

	getPath() {

		let JSON_DB_DIR = this.settings.dir.JSON_DB_DIR ? this.settings.dir.JSON_DB_DIR : __dirname+'/../_json_db_'
		if (!fs.existsSync(JSON_DB_DIR) ){ fs.mkdirSync(JSON_DB_DIR) }

		if (!JSON_DB_DIR) {
			let err = 'Please define constant JSON_DB_DIR (check README.md)'
			if (global.json_db.console_error) {
				global.json_db.consoleLog(err, __filename)
				return false
			} else throw new dbException(err)
		} else if (this.name && this.type) {
			return JSON_DB_DIR+'/'+this.name+'.'+this.type+'.json'
		} else {
			let err = 'Please specify the type of file in method: getPath()'
			if (global.json_db.console_error) {
				global.json_db.consoleLog(err, __filename)
				return false
			} else throw new dbException(err)
		}
	}

	get() {

		let get_path = this.getPath()
		let data = fs.readFileSync(get_path, 'utf8')
		let decrypt_data = ''
		
		// Если установлено шифрование, расшифровываем
		if (this.settings.JSON_DB_CRYPT === true) {
			try {
				decrypt_data = Plugin.decrypt(data)
			} catch (err) {
				if (err) {
					// Если файл еще не закодирован он должен быть строкой json
					decrypt_data = data
				}
			}
			return JSON.parse(decrypt_data)
		} else {
			// Если шифрование не установлено
			try {
				return JSON.parse(data)
			}
			// Если поймали ошиюку пробуем расшифровать
			catch (err) {
				if (err) {
					decrypt_data = Plugin.decrypt(data)
					return JSON.parse(decrypt_data)
				}
			}
		}
	}

	put(data) {
		
		let encrypt_data = ''
		let settings = this.settings

		// Шифруем если установлено шифрование
		if (settings.JSON_DB_CRYPT === true) {
			global.json_db.consoleLog('JSON_DB_CRYPT', settings.JSON_DB_CRYPT)
			encrypt_data = Plugin.encrypt(JSON.stringify(data))
		} else {
			encrypt_data = JSON.stringify(data)
		}

		if (encrypt_data != null && encrypt_data != '') {
			let get_path = this.getPath()
			return fs.writeFileSync(get_path, encrypt_data, 'utf8')

		} else return false
	}

	exists() {
		//const get_path = this.getPath()
		//const file_exists = fs.existsSync(get_path)
		//global.json_db.consoleLog('File.exists()', 'get_path', get_path, 'file_exists', file_exists)
		return fs.existsSync(this.getPath())
	}

	remove() {
		const type = Plugin.ucfirst(this.type)
		if (this.exists()) {
			const get_path = this.getPath()
			if (fs.unlink(get_path)) return true
			else throw new dbException(type+': Deleting failed')
		}
		else throw new dbException(type+': File does not exists')
	}

}
 
File.Error = class extends Error {
	constructor(message, code) {
	  super(message)
	  this.code = code
	}
  }
  
  module.exports = File