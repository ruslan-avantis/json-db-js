'use strict'

const dir_app = process.env.JSON_DB_APP_DIR ? process.env.JSON_DB_APP_DIR : __dirname
const {DbJsonError, FatalError, ParseError, BaseError } = require(dir_app+'/db_exception.js')
const Plugin = require(dir_app+'/plugin.js')
const fs = Plugin.fs()

/** File managing class
 *
 */
class File {

	constructor(settings = {}) {

		/** File name
		* @var string
		*/
		this.table_name

		/** File type (data|config)
		* @var string
		*/
		this.type

		/** File path
		* @var string
		*/
		this.file_path

		/** Settings class
		* @var object
		*/
		this.settings = settings ? settings : {}
	}

	/** Set table name
	 * @param string $table_name
	 * @param object $settings
	 * @return this
	 */
	static table(table_name, settings = {}) {
		const res = new File(settings)
		res.table_name = table_name
		return res
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

		let err
		if (!this.file_path) {
			this.file_path = this.settings.dir.JSON_DB_DIR ? this.settings.dir.JSON_DB_DIR : __dirname+'/../_json_db_'
		}

		if (this.file_path && this.table_name && this.type) {
			return this.file_path+'/'+this.table_name+'.'+this.type+'.json'
		} else if (!this.file_path) {
			err = 'Please define constant JSON_DB_DIR (check README.md)'
		} else  {
			err = 'Please specify the type of file in method: getPath()'
		}

		if (err) {
			if (this.settings.console_error) {
				this.settings.consoleLog(err, __filename)
				return false
			} else throw new DbJsonError(err)
		}
	}

	/** Get table file
	 * @uses fs.readFileSync()
	 * @uses Plugin.decrypt()
	 * @return array of objects [{...}, {...}, {...}]
	 */
	get() {
		const file_path = this.getPath()
		
		let data = fs.readFileSync(file_path, 'utf8')
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

		// We encrypt if encryption is set
		if (this.settings.JSON_DB_CRYPT === true) {
			//global.json_db.consoleLog('JSON_DB_CRYPT', this.settings.JSON_DB_CRYPT)
			encrypt_data = Plugin.encrypt(JSON.stringify(data))
		} else {
			encrypt_data = JSON.stringify(data)
		}

		if (encrypt_data !== false && encrypt_data !== '') {
			const file_path = this.getPath()
			return fs.writeFileSync(file_path, encrypt_data, 'utf8')

		} else return false
	}
	
	/** Checking if a table file exists
	 * @uses fs.existsSync()
	 * @return boolean true/false
	 */
	exists() {
		return fs.existsSync(this.getPath())
	}

	/** Delete table
	 * @uses fs.unlink()
	 * @uses Plugin.ucfirst()
	 * @return boolean true / this.Error()
	 */
	remove() {
		let err
		const type = Plugin.ucfirst(this.type)
		if (this.exists()) {
			if (fs.unlink(this.getPath())) return true
			else err = type+': Deleting failed'
		}
		else err = type+': File does not exists'

		if (err) {
			if (this.settings.console_error) {
				this.settings.consoleLog(err, __filename)
				return false
			} else throw new DbJsonError(err)
		}
	}

}
  
module.exports = File