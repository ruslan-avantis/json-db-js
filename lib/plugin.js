const dir_app = process.env.JSON_DB_APP_DIR ? process.env.JSON_DB_APP_DIR : __dirname
const dir_adapter =  dir_app+'/adapter'
const fs = require(dir_adapter+'/fs.js')
//const sanitizeHtml = require(dir_adapter+'/sanitize-html.js')
const path = require(dir_adapter+'/path.js')
const uuid = require(dir_adapter+'/uuid.js')
const crypto = require(dir_adapter+'/crypto.js')
const dateFormat = require(dir_adapter+'/dateformat.js')

/** Plugins **/
module.exports = () => {

	this.ucfirst = str => {
		return str.charAt(0).toUpperCase() + str.slice(1)
	}
	
	this.arrayFlip = data => {
		let obj = {}
		for(let key in data) {
			if (data.hasOwnProperty(key)) obj[data[key]] = key
		}
		return obj
	}

	this.isNull = v => {
		return (v === null && typeof v == 'undefined')
	}

	this.isInt = n => {
		return Number.isInteger(n)
	}

	/** Checking that field type is numeric
	 * @param string $value
	 * @return boolean
	 */
	this.isNumeric = value => {
		return (value.indexOf('integer') != -1 || value.indexOf('double') != -1)
	}

	this.isString = value => {
		return typeof value === 'string' || value instanceof String
	}

	/** Checking that field type is float
	 * @param string $type
	 * @return boolean
	 */
	this.isFloat = n => {
	  return Number(n) === n && n % 1 !== 0
	}
	
	this.notNull = v => {
		return (!this.isNull(v))
	}

	this.inArray = (needle, haystack) => {
		for(let i = 0; i < haystack.length; i++) {
			if (haystack[i] == needle) {
				return true
			}
		}
		return false
	}

	this.arrayDiffAssoc = (arr1) => {
		//   example 1: arrayDiffAssoc({0: 'Kevin', 1: 'van', 2: 'Zonneveld'}, {0: 'Kevin', 4: 'van', 5: 'Zonneveld'})
		//   returns 1: {1: 'van', 2: 'Zonneveld'}
		const retArr = {}
		const argl = arguments.length
		let k1 = ''
		let i = 1
		let k = ''
		let arr = {}
		arr1keys: for (k1 in arr1) { // eslint-disable-line no-labels
		  for (i = 1; i < argl; i++) {
			arr = arguments[i]
			for (k in arr) {
			  if (arr[k] === arr1[k1] && k === k1) {
				// If it reaches here, it was found in at least one array, so try next value
				continue arr1keys // eslint-disable-line no-labels
			  }
			}
			retArr[k1] = arr1[k1]
		  }
		}
		return retArr
	}

	this.pregQuote = (str, delimiter) => {
		//   example 1: pregQuote("$40")
		//   returns 1: '\\$40'
		//   example 2: pregQuote("*RRRING* Hello?")
		//   returns 2: '\\*RRRING\\* Hello\\?'
		//   example 3: pregQuote("\\.+*?[^]$(){}=!<>|:")
		//   returns 3: '\\\\\\.\\+\\*\\?\\[\\^\\]\\$\\(\\)\\{\\}\\=\\!\\<\\>\\|\\:'
		const regexp = new RegExp('[.\\\\+*?\\[\\^\\]$(){}=!<>|:\\' + (delimiter || '') + '-]', 'g')
		return (str+'').replace(regexp, '\\$&')
	}

	this.arrayDiff = (a,b) => {
		
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

	this.arrayDiffKey = arr1 => {
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
	
	this.arrayValues = (input) => {
		// example 1: array_values( {firstname: 'Kevin', surname: 'van Zonneveld'} )
		// returns 1: [ 'Kevin', 'van Zonneveld' ]
		let tmpArr = [], key = ''
		for (key in input) {
			tmpArr[tmpArr.length] = input[key]
		}
		return tmpArr
	}

	this.arrayKeyExists = (key, search) => {
		// example 1: array_key_exists('kevin', {'kevin': 'van Zonneveld'})
		// returns 1: true
		if (!search || (search.constructor !== Array && search.constructor !== Object)) {
			return false
		}
		return key in search
	}

	this.arrayKeys = input => {
		let output = new Array()
		let i = 0
		for (let key in input) {
			output[i++] = key
		} 
		return output
	}

	this.arrayIntersectKey = obj1 => {
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
	this.objectSize = obj => {
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
	this.memoryUsage = () => {
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
	 * 
	*/
	this.memoryUsageInterval = delay => {
		let set_timeout_key = setInterval(() => {this.memoryUsage()}, Number(delay)*60*1000) // каждых delay минут
	}

	/** An integer from $min to $max
	 * @param integer $min
	 * @param integer $max
	 * @return integer
	 */
	this.randomInteger = async (min, max) => {
		// get a random number from (min-0.5) to (max + 0.5)
		let rand = await min - 0.5 + Math.random() * (max - min + 1)
		return Math.round(rand)
	}

	/** escape RegExp
	 * @param string $value
	 * @return string
	 */
	this.escapeRegExp = value => {
		return value.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1")
	}

	/** Cleaner string
	 * @param string $value
	 * @return string
	 */
	this.clean = value => {
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
	this.cleanStr = value => {
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
	this.token = () => {
		return uuid.v4()
	}

	// encrypt string
	this.encrypt = string => {
		let res = false
		try {
			let absolutePath = path.resolve(global.config.dir.key+'/public.pem')
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
	this.decrypt = (toDecrypt) => {
		let res = false
		try {
			let absolutePath = path.resolve(global.config.dir.key+'/private.pem')
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

	return this

}
 
