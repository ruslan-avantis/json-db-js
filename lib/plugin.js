'use strict'

const dir_app = process.env.JSON_DB_APP_DIR ? process.env.JSON_DB_APP_DIR : __dirname
const dir_adapter =  dir_app+'/adapter'

const {DbJsonError, FatalError, ParseError, BaseError } = require(dir_app+'/db_exception.js')

const fs = require(dir_adapter+'/fs.js')
//const sanitizeHtml = require(dir_adapter+'/sanitize-html.js')
const path = require(dir_adapter+'/path.js')
const uuid = require(dir_adapter+'/uuid.js')
const crypto = require(dir_adapter+'/crypto.js')
const dateFormat = require(dir_adapter+'/dateformat.js')
const curl = require(dir_adapter+'/curlrequest.js')
const { Parser } = require(dir_adapter+'/node-sql-parser.js')

/** Plugin Class
 *
 */
class Plugin {

	static Error() {
		return DbJsonError
	}

	/** Config table with the before and after prefix
	 * @param string $before
	 * @param string $after
	 * @param object $obj
	 * @return object table config
	 */
	static tableConfig(obj ={}, before = '', after = '') {
		let res = {}
    	for (let field in obj) {
        	res[`${before}${field}${after}`] = obj[field]
    	}
		return res
	}

	/** Table name with the before and after prefix
	 * @param string $name
	 * @param string $before
	 * @param string $after
	 * @return string table_name
	 */
	static tableName(name, before = '', after = '') {
		return `${before}${name}${after}`
	}

	static Parser() {
		return Parser
	}

	static DbJsonError(...param) {
		return DbJsonError(...param)
	}

	static FatalError(...param) {
		return FatalError(...param)
	}

	static ParseError(...param) {
		return ParseError(...param)
	}

	static BaseError(...param) {
		return BaseError(...param)
	}

	static dirApp() {
		return dir_app
	}

	static curl() {
		return curl
	}

	static dirAdapter() {
		return dir_adapter
	}

	static dateFormat(...param) {
		return dateFormat(...param)
	}

	static uuid() {
		return uuid
	}

	static crypto() {
		return crypto
	}

	static fs() {
		return fs
	}

	static path() {
		return path
	}

	static randomWord(words = [], n = 0) {
		let res = '', i = 0
		if (this.isArray(words) && words.length >= 1) {
			while(i <= n) {
				res += words[Math.floor(Math.random()*words.length)]
				if (i < n) res += ' '
				i++
			}
		}
		return res
	}

	static randomString(i = 36, n = 7) {
		return Math.random().toString(i).substring(n)
	}

	/** An integer from $min to $max
	 * @param integer $min
	 * @param integer $max
	 * @return integer
	 */
	static randomInteger(min, max) {
		// get a random number from (min-0.5) to (max + 0.5)
		//let rand = min - 0.5 + Math.random() * (max - min + 1)
		//return Math.round(rand)
		return Math.floor(Math.random() * (max - min) + min)
	}

	static randomBoolean() {
		let i = this.randomInteger(0, 2)
		if (i == 0) return false
		return true
	}

	static randomFloat(min, max, fix = 2) {
		let res = 0
		let int = this.randomInteger(min, max)
		let fra = Number(Number((Math.random()).toFixed(fix)))
		if (fra === 0) res = int + 0.01
		else res = int + fra
		return Number(res)
	}

	static randomArray(arr = [], n = 5, type = 'integer') {
		let res = [], i = 0
		while(i < n) {
			if (arr.length >= 1) res.push(this.randomWord(arr))
			else if (type == 'string') res.push(this.randomString())
			else res.push(this.randomInteger(1, 1000))
			i++
		}
		return res
	}

	static randomObject(arr_key = [], arr_value = [], n = 5, type_key = 'string', type_value = 'integer') {
		let res = {}, i = 0
		while(i < n) {

			let key = '0', value = 0

			if (arr_key) key = this.randomWord(arr_key)
			else if (type_key == 'integer') key = this.randomInteger(1, 1000)
			else key = this.randomString()
				
			if (arr_value) value = this.randomWord(arr_value)
			else if (type_value == 'integer') value = this.randomInteger(1, 100000)
			else value = this.randomString()

			res[key] = value
			i++
		}
		return res
	}

	/** The first character of the string is uppercase
	 * @param string $str
	 * @return string
	 */
	static ucfirst(str) {
		return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
	}
	
	/** Array Flip
	 * @param object $data
	 * @return object
	 */
	static arrayFlip(data) {
		let obj = {}
		for(let key in data) {
			if (data.hasOwnProperty(key)) obj[data[key]] = key
		}
		return obj
	}

	/** Checking value is null
	 * @param mixed $value
	 * @return boolean
	 */
	static isNull(value) {
		return (value === null && typeof value == 'undefined')
	}

	/** Checking value is not null
	 * @param mixed $value
	 * @return boolean
	 */
	static notNull(value) {
		return (!this.isNull(value))
	}

	/** Checking that field type is numeric
	 * @param integer $value
	 * @return boolean
	 */
	static isInt(value) {
		return (Number.isInteger(value) || !isNaN(value))
	}

	static isNumber(value) {
		return !isNaN(value) // typeof value === 'number' && isFinite(value)
	}

	static isInteger(value) {
		return Number.isInteger(value)
	}

	static isArray(value) {
		try {
			return Array.isArray(value) || Array.isArray(JSON.parse(value))
		} catch {
			return false
		}
	}

	static isObject(value) {
		try {
			return (typeof value === 'object' && value !== null) || typeof JSON.parse(value) === 'object'
		} catch {
			return false
		}
	}

	/** Checking value is string
	 * @param string $value
	 * @return boolean
	 */
	static isString(value) {
		return typeof value === 'string' || value instanceof String
	}

	/** Checking that field type is boolean
	 * @param string $value
	 * @return boolean
	 */
	static isBoolean(value) {
		return (typeof value == 'boolean')
	}

	/** Checking that field type is float
	 * @param string $value
	 * @return boolean
	 */
	static isFloat(value) {
		return Number(value) === value && Number(value) % 1 !== 0
	}

	/** Checking that field type is numeric
	 * @param string $value
	 * @return boolean
	 */
	static isNumeric(value) {
		return (value.indexOf('integer') != -1 || value.indexOf('double') != -1)
	}

	static valueType(value) {
		const types = {
			'boolean': this.isBoolean(value),
			'integer': this.isInt(value),
			'double': this.isFloat(value),
			'string': this.isString(value),
			'array': this.isArray(value),
			'object': this.isObject(value),
		}
		return types
	}

	static valueToType(type, value) {
		try {
			if (type == 'integer') {
				return Number(value)
			} else if (type == 'double') {
				return Number((Number(value)).toFixed(2))
			} else if (type == 'string') {
				return String(value)
			} else if (type == 'boolean') {
				return Boolean(value)
			} else if (type == 'array' || type == 'object') {
				if (typeof value == 'object') value = JSON.stringify(value)
				return value
			} else {
				const err = `Convert value: ${value} to type: ${type} Error`
				throw new DbJsonError(err)
			}
		} catch (err) {
			throw new DbJsonError(err)
		}
	}

	/** Checking that field type is float
	 * @param string $needle
	 * @param array $haystack
	 * @return boolean
	 */
	static inArray(needle, haystack) {
		if (Array.isArray(haystack)) {
			for(let i = 0; i < haystack.length; i++) {
				if (haystack[i] == needle) {
					return true
					break
				}
			}
		}
		return false
	}

	/** Array diff Assoc
	 * @param array $haystack
	 * @return object
	 */
	static arrayDiffAssoc(array) {
		//   example 1: arrayDiffAssoc({0: 'Kevin', 1: 'van', 2: 'Zonneveld'}, {0: 'Kevin', 4: 'van', 5: 'Zonneveld'})
		//   returns 1: {1: 'van', 2: 'Zonneveld'}
		const retArr = {}
		const argl = arguments.length
		let k1 = ''
		let i = 1
		let k = ''
		let arr = {}
		arr_keys: for (k1 in array) { // eslint-disable-line no-labels
		  for (i = 1; i < argl; i++) {
			arr = arguments[i]
			for (k in arr) {
			  if (arr[k] === array[k1] && k === k1) {
				// If it reaches here, it was found in at least one array, so try next value
				continue arr_keys // eslint-disable-line no-labels
			  }
			}
			retArr[k1] = array[k1]
		  }
		}
		return retArr
	}

	static pregQuote(str, delimiter = '') {
		//   example 1: pregQuote("$40")
		//   returns 1: '\\$40'
		//   example 2: pregQuote("*RRRING* Hello?")
		//   returns 2: '\\*RRRING\\* Hello\\?'
		//   example 3: pregQuote("\\.+*?[^]$(){}=!<>|:")
		//   returns 3: '\\\\\\.\\+\\*\\?\\[\\^\\]\\$\\(\\)\\{\\}\\=\\!\\<\\>\\|\\:'
		const regexp = new RegExp('[.\\\\+*?\\[\\^\\]$(){}=!<>|:\\'+delimiter+'-]', 'g')
		return (str+'').replace(regexp, '\\$&')
	}

	static arrayDiff(a,b) {
		
		let ret = [], merged = a.concat(b)

		for (var i = 0; i < merged.length; i++) {
			// When the element is contained ONLY
			// one time then the search from
			// left returns the same value as
			// the search from the right.
			if (merged[i] && merged.indexOf(merged[i]) == merged.lastIndexOf(merged[i])) {
				// ... in that case the element
				// is pushed to the result array.
				ret.push(merged[i])
			}
		}
		return ret
	}

	static arrayDiffKey(arr1) {
		// example 1: array_diff_key({red: 1, green: 2, blue: 3, white: 4}, {red: 5})
		// returns 1: {"green":2, "blue":3, "white":4}
		// example 2: array_diff_key({red: 1, green: 2, blue: 3, white: 4}, {red: 5}, {red: 5})
		// returns 2: {"green":2, "blue":3, "white":4}
		const argl = arguments.length
		const retArr = {}
		let k1 = ''
		let i = 1
		let k = ''
		let arr = {}
		arr1keys: for (k1 in arr1) {
			for (i = 1; i < argl; i++) {
				arr = arguments[i]
				for (k in arr) {
					if (k === k1) {
						// If it reaches here, it was found in at least one array, so try next value
						continue arr1keys // eslint-disable-line no-labels
					}
				}
				retArr[k1] = arr1[k1]
			}
		}
		return retArr
	}
	
	static arrayValues(arr) {
		// example 1: array_values( {firstname: 'Kevin', surname: 'van Zonneveld'} )
		// returns 1: [ 'Kevin', 'van Zonneveld' ]
		let res = []
		for (let key in arr) {
			res.push(arr[key])
		}
		return res
	}

	static arrayKeyExists(key, search) {
		// example 1: array_key_exists('kevin', {'kevin': 'van Zonneveld'})
		// returns 1: true
		if (!search || (search.constructor !== Array && search.constructor !== Object)) {
			return false
		}
		return key in search
	}

	static arrayKeys(input) {
		let output = new Array()
		let i = 0
		for (let key in input) {
			output[i++] = key
		} 
		return output
	}

	static arrayIntersectKey(obj1) {
		// note 1: These only output associative arrays (would need to be
		// note 1: all numeric and counting from zero to be numeric)
		// example 1: var obj1 = {a: 'green', b: 'brown', c: 'blue', 0: 'red'}
		// example 1: var obj2 = {a: 'green', 0: 'yellow', 1: 'red'}
		// example 1: plugin.arrayIntersectKey(obj1, obj2)
		// returns 1: {0: 'red', a: 'green'}
		const retObj = {}
		const argl = arguments.length
		const arglm1 = argl - 1
		let k1 = ''
		let obj = {}
		let i = 0
		let k = ''
		arr1keys: for (k1 in obj1) {
			if (!obj1.hasOwnProperty(k1)) {
				continue
			}
			arrs: for (i = 1; i < argl; i++) {
				obj = arguments[i]
				for (k in obj) {
					if (!obj.hasOwnProperty(k)) {
						continue
					}
					if (k === k1) {
						if (i === arglm1) {
							retObj[k1] = obj1[k1]
						}
						// If the innermost loop always leads at least once to an equal value,
						// continue the loop until done
						continue arrs
					}
				}
				// If it reaches here, it wasn't found in at least one array, so try next value
				continue arr1keys
			}
		}
		return retObj
	}

	/** Get the size of an object
	 * 
	*/
	static objectSize(obj) {
		var size = 0
		try {
			for (var key in obj) {
				if (obj.hasOwnProperty(key)) size++
			}
		}
		catch (err) {
			if (err) console.log(err)
		}
		return size
	}

	/** Memory control function
	 * 
	*/
	static memoryUsage() {
		let used = 0
		try {
			used = process.memoryUsage()
			let current_time = Date.now()
			let current_date_time = dateFormat(current_time, "isoDateTime")
			let pro = current_date_time+' - '
			for (let key in used) {
				let data = Math.round(used[key] / 1024 / 1024 * 100) / 100
				pro += ' / '+key+': '+data+' MB'
			}
			
			console.log(`${key} ${Math.round(used[key] / 1024 / 1024 * 100) / 100} MB`)
			console.log('Memory usage:', pro)
		}
		catch (err) {
			if (err) console.log(err)
		}
		return used
	}

	/** Memory Usage Interval
	 * @param integer $delay sec
	*/
	static memoryUsageInterval(delay) {
		let set_timeout_key = setInterval(() => {
			this.memoryUsage()
		}, Number(delay)*60*1000)
	}

	/** escape RegExp
	 * @param string $value
	 * @return string
	 */
	static escapeRegExp(value) {
		return value.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1")
	}

	/** Cleaner string
	 * @param string $value
	 * @return string
	 */
	static clean(value) {
		let res = false
		value = String(value)
		// value = value.replace("'",'&#8221;')
		//value = this.replaceAll(value, "'", '&#39;')
		// &#39; или &#x27; bkb &#8217; или &#x2019; 
		value = value.trim()
		// value = value.replace(/[.,\/#!?$%\^&\*<>;:{}=\-_`~()]/g,"")
		// value = value.replace(/\s{2,}/g," ")
		// if (value.indexOf("'") != -1) value = value.replace("'",'')
		// if (value.indexOf('"') != -1) value = value.replace('"','')
		// if (value.indexOf('`') != -1) value = value.replace('`','')
		// value = value.replace(/[\/#$%\^&\*<>{}`\'\"~()]/g,'')
		// value = value.replace(/\s{2,}/g," ")
		// value = sanitizeHtml(value)
		// value = value.replace(/[\/#$%\^&\*<>{}\`\'\"~()]/g,'')
		// value = value.replace(/\s{2,}/g," ")
		// value = value.toLowerCase()
		// value = value[0].toUpperCase()+value.slice(1)
		res = value
		return res
	}

	/** Cleaner string
	 * @param string $value
	 * @return string
	 */
	static cleanStr(value) {
		let res = false
		// value = value.toLowerCase()
		//value = this.replaceAll(value, "'", '&#39;')
		value = value.replace(/[.,\/#!?$%\^&\*<>;:{}=\-_`~()]/g,"")
		value = value.replace(/\s{2,}/g," ")
		//value = sanitizeHtml(value)
		res = value.trim()
		return res
	}

	/** Token generation, token_id, alias_id **/
	static token() {
		return uuid.v4()
	}

	// encrypt string
	static encrypt(string, dir_key) {
		let res = false
		try {
			let absolutePath = path.resolve(dir_key+'/public.pem')
			let publicKey = fs.readFileSync(absolutePath, 'utf8')
			let buffer = Buffer.from(string, 'utf8')
			let encrypted = crypto.publicEncrypt(publicKey, buffer)
			res = encrypted.toString('base64')
		}
		catch (err) {
			if (err) console.log(err)
		}
		return res
	}

	// decrypt string
	static decrypt(toDecrypt, dir_key) {
		let res = false
		try {
			let absolutePath = path.resolve(dir_key+'/private.pem')
			let privateKey = fs.readFileSync(absolutePath, 'utf8')
			let buffer = Buffer.from(toDecrypt, 'base64')
			let decrypted = crypto.privateDecrypt({key: privateKey.toString(), passphrase: '',}, buffer,)
			res = decrypted.toString('utf8')
		}
		catch (err) {
			if (err) console.log(err)
		}
		return res
	}

	/** Функция контроля памяти **/
	static memoryUsage() {
		let used = 0
		try {
			used = process.memoryUsage()
			let pro = this.dateFormat(Date.now(), "dd-mm-yyyy HH:MM:ss")+''
			for (let key in used) {
				let data = Math.round(used[key] / 1024 / 1024 * 100) / 100
				pro += ' --> '+key+': '+data+' MB'
				//console.log(`${key} ${Math.round(used[key] / 1024 / 1024 * 100) / 100} MB`)
			}
			//console.log('Memory usage:', pro)
		} catch (err) { if (err) { console.log(err) } }
		return used
	}
	
}
  
module.exports = Plugin
