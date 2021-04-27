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

		/**
		* File name
		* @var string
		*/
		this.table_name

		/**
		* File type (data|config)
		* @var string
		*/
		this.type

		this.settings = {}
		if (settings) Object.assign(this.settings, settings)

	}

	/** Set table name
	 * @param string $table_name
	 * @param object $settings
	 * @return this
	 */
	static table(table_name, settings = {}) {
		const file = new File(settings)
		file.table_name = table_name
		return file
	}

	/** Set file type
	 * @param string $type
	 * @return boolean true
	 */
	setType(type) {
		this.type = type
		return true
	}

	/** Get file path
	 * @return string path
	 */
	getPath() {

		let JSON_DB_DIR = this.settings.dir.JSON_DB_DIR ? this.settings.dir.JSON_DB_DIR : __dirname+'/../_json_db_'
		if (!fs.existsSync(JSON_DB_DIR) ){ fs.mkdirSync(JSON_DB_DIR) }

		if (!JSON_DB_DIR) {
			let err = 'Please define constant JSON_DB_DIR (check README.md)'
			if (this.settings.console_error) {
				this.settings.consoleLog(err, __filename)
				return false
			} else throw new dbException(err)
		} else if (this.table_name && this.type) {
			return JSON_DB_DIR+'/'+this.table_name+'.'+this.type+'.json'
		} else {
			let err = 'Please specify the type of file in method: getPath()'
			if (this.settings.console_error) {
				this.settings.consoleLog(err, __filename)
				return false
			} else throw new dbException(err)
		}
	}

	/** Get table file
	 * @uses fs.readFileSync()
	 * @uses Plugin.decrypt()
	 * @return array of objects [{...}, {...}, {...}]
	 */
	get() {

		let get_path = this.getPath()
		let data = fs.readFileSync(get_path, 'utf8')
		let decrypt_data = ''
		
		// If encryption is set, decrypt
		if (this.settings.JSON_DB_CRYPT === true) {
			try {
				decrypt_data = Plugin.decrypt(data)
			} catch (err) {
				if (err) {
					// If the file is not already encoded it should be a json string
					decrypt_data = data
				}
			}
			return JSON.parse(decrypt_data)
		} else {
			// If encryption is not set
			try {
				return JSON.parse(data)
			}
			// If we caught an oshiyuku, we try to decipher
			catch (err) {
				if (err) {
					decrypt_data = Plugin.decrypt(data)
					return JSON.parse(decrypt_data)
				}
			}
		}
	}

	/** Get table file
	 * @uses fs.writeFileSync()
	 * @uses Plugin.encrypt()
	 * @return array of objects [{...}, {...}, {...}]
	 */
	put(data) {
		
		let encrypt_data = ''
		let settings = this.settings

		// We encrypt if encryption is set
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
	
	/** Checking if a table file exists
	 * @uses fs.existsSync()
	 * @return boolean true/false
	 */
	exists() {
		//const get_path = this.getPath()
		//const file_exists = fs.existsSync(get_path)
		//global.json_db.consoleLog('File.exists()', 'get_path', get_path, 'file_exists', file_exists)
		return fs.existsSync(this.getPath())
	}

	/** Delete table
	 * @uses fs.unlink()
	 * @uses Plugin.ucfirst()
	 * @return boolean true / dbException()
	 */
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