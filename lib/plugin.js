const dir_app = process.env.JSON_DB_APP_DIR ? process.env.JSON_DB_APP_DIR : __dirname
const dir_adapter =  dir_app+'/adapter'
const fs = require(dir_adapter+'/fs.js')
const sanitizeHtml = require(dir_adapter+'/sanitize-html.js')
const path = require(dir_adapter+'/path.js')
const uuid = require(dir_adapter+'/uuid.js')
const uuidv4 = uuid.v4
const url = require(dir_adapter+'/url.js')
const crypto = require(dir_adapter+'/crypto.js')
const request = require(dir_adapter+'/request.js')
const Twig = require(dir_adapter+'/twig.js'), twig = Twig.twig // Подключаем шаблонизатор - Twig
const dateFormat = require(dir_adapter+'/dateformat.js')
const Entities = require(dir_adapter+'/html-entities.js').AllHtmlEntities
const XLSX = require(dir_adapter+'/xlsx.js')

/**
	plugin.token_id()
	plugin.token()
	plugin.encrypt(token)
	plugin.decrypt(toDecrypt)
	if (fs.existsSync(dir+'/'+template+'.twig')) {
		file = await dir+'/'+template+'.twig'
	}
	await fs.writeFileSync(file, data, 'utf8')
	let absolutePath = await path.resolve(global.config.dir.key+'/private.pem')
	let data = await fs.readFileSync(absolutePath, 'utf8')
	language = this.jsonParse(fs.readFileSync(file_language, 'utf8'), error_user_id)
	
	JSON.parse()
	JSON.stringify()
	
 */

/** Плагины **/
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

	/**
	 * Checking that field type is numeric
	 * @param string $value
	 * @return boolean
	 */
	this.isNumeric = value => {
		return (value.indexOf('integer') != -1 || value.indexOf('double') != -1)
	}

	this.isString = value => {
		return typeof value === 'string' || value instanceof String
	}

	/**
	 * Checking that field type is float
	 * @param string $type
	 * @return boolean
	 */
	this.isFloat = value => {
		return (Number(value) === value && value % 1 !== 0)
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

	this.extract = (data, where) => {
		let g = where || (typeof global !== 'undefined' ? global : this)
		for (var key in data) {
			if (data.hasOwnProperty(key)) {
				g[key] = data[key]
			}
		}
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
		// discuss at: https://locutus.io/php/array_values/
		// original by: Kevin van Zonneveld (https://kvz.io)
		// improved by: Brett Zamir (https://brett-zamir.me)
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
	
	this.isFloat = n => {
	  return Number(n) === n && n % 1 !== 0
	}
	
	this.chunkString = async (str, length) => {
		return await str.match(new RegExp('.{1,' + length + '}', 'g'))
	}

	this.hex2bin = hex => {
		let bytes = [], str
		for (var i=0; i< hex.length-1; i+=2) {
			bytes.push(parseInt(hex.substr(i, 2), 16))
		}
		return String.fromCharCode.apply(String, bytes) 
	}

	//Useful Functions
	this.checkBin = n => {return/^[01]{1,64}$/.test(n)}
	this.checkDec = n => {return/^[0-9]{1,64}$/.test(n)}
	this.checkHex = n => {return/^[0-9A-Fa-f]{1,64}$/.test(n)}
	this.pad = (s,z) => {s=""+s;return s.length<z?pad("0"+s,z):s}
	this.unpad = s => {s=""+s;return s.replace(/^0+/,'')}
	//Decimal operations
	this.Dec2Bin = n => {if(!this.checkDec(n)||n<0)return 0;return n.toString(2)}
	this.Dec2Hex = n => {if(!this.checkDec(n)||n<0)return 0;return n.toString(16)}
	//Binary Operations
	this.Bin2Dec = n => {if(!this.checkBin(n))return 0;return parseInt(n,2).toString(10)}
	this.Bin2Hex = n => {if(!this.checkBin(n))return 0;return parseInt(n,2).toString(16)}
	//Hexadecimal Operations
	this.Hex2Bin = n => {if(!this.checkHex(n))return 0;return parseInt(n,16).toString(2)}
	this.Hex2Dec = n => {if(!this.checkHex(n))return 0;return parseInt(n,16).toString(10)}

	this.escapeHtml = str => {
		let map = {
			'&': '&amp;',
			'<': '&lt;',
			'>': '&gt;',
			'"': '&quot;',
			"'": '&#039;'
		}
		return str.replace(/[&<>"']/g, function(m) {return map[m]})
	}

	this.decodeHtml = str => {
		let map = {
			'&amp;': '&',
			'&lt;': '<',
			'&gt;': '>',
			'&quot;': '"',
			'&#039;': "'"
		}
		return str.replace(/&amp;|&lt;|&gt;|&quot;|&#039;/g, function(m) {return map[m]})
	}

	this.arrayChangeKeyCase = data => {
		// Retuns an array with all string keys lowercased [or uppercased]
		// *	 example 1: arrayChangeKeyCase(42);
		// *	 returns 1: false
		// *	 example 2: arrayChangeKeyCase([ 3, 5 ]);
		// *	 returns 2: {0: 3, 1: 5}
		// *	 example 3: arrayChangeKeyCase({ FuBaR: 42 });
		// *	 returns 3: {"fubar": 42}
		// *	 example 4: arrayChangeKeyCase({ FuBaR: 42 }, 'CASE_LOWER');
		// *	 returns 4: {"fubar": 42}
		// *	 example 5: arrayChangeKeyCase({ FuBaR: 42 }, 'CASE_UPPER');
		// *	 returns 5: {"FUBAR": 42}  
		// *	 example 6: arrayChangeKeyCase({ FuBaR: 42 }, 2);
		// *	 returns 6: {"FUBAR": 42}
		let case_fn, tmp_ar = {}, argc = arguments.length, argv = arguments, key

		if (data instanceof Array) {
			return array
		}
		if (data instanceof Object) {
			if ( argc == 1 || argv[1] == 'CASE_LOWER' || argv[1] == 0 ) {
				case_fn = "toLowerCase"
			}
			else {
				case_fn = "toUpperCase"
			}
			for (key in data) {
				tmp_ar[key[case_fn]()] = data[key]
			}
			return tmp_ar
		}
		return false
	}

	/** Разбираем URL для роутинга API **/
	this.url_api_parse = async (req, exclude) => {
		let resp_url = {}, original_url, url_arr = []
		try {
			if (req.originalUrl) original_url = await url.parse(req.originalUrl)
			if (original_url && original_url.pathname) {
				//console.log('pathname 1 ', original_url.pathname)
				if (exclude) {
					if (original_url.pathname.indexOf('/'+exclude+'/') != -1) {
						original_url.pathname = await original_url.pathname.replace(exclude+'/','')
					}
					else if (original_url.pathname.indexOf('/'+exclude) != -1) {
						original_url.pathname = await original_url.pathname.replace(exclude,'')
					}
				}
				url_arr = await original_url.pathname.split('/')
			}
			// --------------------------------------------------------------
			// Предусматриваем восемь уровней URL
			// // https://example.com/api/user_api/resource/section/alias/action/action_id/alias_plus
			// --------------------------------------------------------------
			//console.log('pathname 2 ', original_url.pathname)
			resp_url = {}
			resp_url.api = 'index' // По умолчанию главная
			if (url_arr[1] || url_arr[1] == '') resp_url.api = await url_arr[1]
			if (resp_url.api == '') resp_url.api = 'index'
			if (url_arr[2]) resp_url.user_api = await url_arr[2]
			if (url_arr[3]) resp_url.resource = await url_arr[3]
			if (url_arr[4]) resp_url.section = await url_arr[4]
			if (url_arr[5]) resp_url.alias = await url_arr[5]
			if (url_arr[6]) resp_url.action = await url_arr[6]
			if (url_arr[7]) resp_url.action_id = await url_arr[7]
			if (url_arr[8]) resp_url.alias_plus = await url_arr[8]
			//console.log('resp_url ', JSON.stringify(resp_url))
		}
		catch (err) {
			if (err) {
				global._console('error', 'url_api_parse', __filename, err, false, error_user_id)
				if (global.json_db.console_error === true) { console.log(err) }
			}
		}
		return resp_url
	}

	this.byField = field => {
		return (a, b) => a[field] > b[field] ? 1 : -1;
	}

	this.cleanHtml = async (data, error_user_id) => {
		data = await data.replace(/<\/?[^>]+(>|$)/g, "")
		//data = await data.text()
	}

	this.jsonTest = async (data, error_user_id) => {
		let resp = false, i = 0, arr = await ['{', '}', '[', ']']
		try {
			if (data && data != '') {
				for (var key in arr) {
					if (data.indexOf(arr[key]) != -1) {
						await i++
					}
				}
				if (i >= 2) resp = await true
			}
		}
		catch (err) {
			if (err) {
				global._console('error', 'jsonTest', __filename, err, String(data), error_user_id)
				if (global.json_db.console_error === true) { console.log(err) }
			}
		}
		return resp
	}

	/** Парсим JSON
		Если возникнет ошибка вернет пустой обьект
	**/
	this.jsonParse = async (str, error_user_id) => {
		let resp = {}
		try {
			// Чистим все символы которые могут вызвать ошибку при преобразовании в строки в json
			str = await this.replaceBreak(str, error_user_id)
			resp = await JSON.parse(str)
		}
		catch (err) {
			if (err) {
				global._console('error', 'jsonParse', __filename, err, String('\n'+str), error_user_id)
				if (global.json_db.console_error === true) { console.log(err) }
			}
		}
		return resp
	}

	this.DataParse = async (data, error_user_id) => {
		let resp = false
		try {
			// Парсим строку в json
			resp = await JSON.parse(data)
		}
		catch (err) {
			if (err) {
				global._console('error', 'DataParse', __filename, err, data, error_user_id)
				if (global.json_db.console_error === true) { console.log(err) }
			}
		}
		return resp
	}

	this.dataParse = async (data, error_user_id) => {
		return await this.DataParse(data, error_user_id)
	}

	this.arrayIntersectKey = (obj1) => {
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

	this.replaceBreak = async (data, error_user_id) => {
		resp = await data
		try {
			if (data && data.indexOf("\n") != -1) {
				resp = await data.replace(/\n/g, '_line_break_')
			}
		}
		catch (err) {
			if (err) {
				global._console('error', 'replaceBreak', __filename, err, String('\n data '+data), error_user_id)
				if (global.json_db.console_error === true) { console.log(err) }
			}
		}
		return resp
	}

	this.replaceStr = async (data, error_user_id) => {
		return await data
			.replace(/\n/g, 'line_break')
			.replace(/\n/g, '_line_break_')
			.replace(/\\"/g, '&quot;')
			.replace(/\"/g, '&quot;')
			.replace(/\\'/g, '&#39;')
			.replace(/\'/g, '&#39;')
			// .replace(/\d\\"\d/g, '\"') 
			// .replace(/"([^"]+)"/g, ''&lsquo;&lsquo;$1&rsquo;&rsquo;'')
	}

	this.replaceStr2 = async (data, error_user_id) => {
		if (data.indexOf("\n") != -1) data = await data.replace(new RegExp("\n", 'g'), 'line_break')
		if (data.indexOf("\'") != -1) data = await data.replace(new RegExp("\'", 'g'), "'")
		if (data.indexOf("'") != -1) data = await data.replace(new RegExp("'", 'g'), "\\'")
		if (data.indexOf('\"') != -1) data = await data.replace(new RegExp('\"', 'g'), '"')
		if (data.indexOf('"') != -1) data = await data.replace(new RegExp('"', 'g'), '\\"')
		// .replace(/"([^"]+)"/g, ''&lsquo;&lsquo;$1&rsquo;&rsquo;'')
		return data
	}

	this.controlBotMessage = async (data, bot_type, error_user_id) => {
		try {
			if (data.indexOf("_line_break_") != -1) {
				data = await data.replace(new RegExp("_line_break_", 'g'), '\n')
			}
			if (data.indexOf("line_break") != -1) {
				data = await data.replace(new RegExp("line_break", 'g'), '\n')
			}
			if (data.indexOf("<br>") != -1) {
				data = await data.replace(new RegExp("<br>", 'g'), '\n')
			}
			if (data.indexOf("<\\br>") != -1) {
				data = await data.replace(new RegExp("<\\br>", 'g'), '\n')
			}
			if (data.indexOf("&#39;") != -1) {
				data = await data.replace(new RegExp("&#39;", 'g'), "\'")
			}
			if (data.indexOf("&quot") != -1) {
				data = await data.replace(new RegExp("&quot", 'g'), '\"')
			}
			// data = await data.replace(/<\/?[^>]+(>|$)/g, "")
		}
		catch (err) {
			if (err) {
				global._console('error', 'controlBotMessage', __filename, err, String('\n data '+data), error_user_id)
				if (global.json_db.console_error === true) { console.log(err) }
			}
		}
		return data
	}

	this.dataClean = async (data, arr, replace, error_user_id) => {
		try {
			if (!replace || replace == false) {
				replace = ''
			}
			if (arr && typeof arr == 'object') {
				for (var key in arr) {
					let search = await arr[key]
					data = await data.split(search).join(replace)
				}
			}
		}
		catch (err) {
			if (err) {
				global._console('error', 'dataClean', __filename, err, false, error_user_id)
				if (global.json_db.console_error === true) { console.log(err) }
			}
		}
		return data
	}

	/** Get the size of an object **/
	this.objectSize = async (obj, error_user_id) => {
		var size = 0
		try {
			for (var key in obj) {
				if (obj.hasOwnProperty(key)) size++
			}
		}
		catch (err) {
			if (err) {
				global._console('error', 'objectSize', __filename, err, false, error_user_id)
				if (global.json_db.console_error === true) { console.log(err) }
			}
		}
		return size
	}

	/** Убивает келбеки и превращает обьект в json **/
	this.cleanObjToJson = async (obj, error_user_id) => {
		let resp = false
		try {
			resp = await this.jsonParse(JSON.stringify(obj), error_user_id)
		}
		catch (err) {
			if (err) {
				global._console('error', 'cleanObjToJson', __filename, err, false, error_user_id)
				if (global.json_db.console_error === true) { console.log(err) }
			}
		}
		return resp
	}

	/** Проверка и создание обьекта **/
	this.objCreate = async (obj, arr) => {
		resp = 'ObjCreate'
		try {
			// obj = global.logic.mode.role
			//let arr = await arr.split('.')
			//let length = this.ObjectSize(arr)

			let newObj = obj, test = {}

			for (var key in arr) {
				if (!newObj[arr[key]]) {
					test[arr[key]] = {}
					newObj = test
				}

				console.log('ObjCreate', JSON.stringify(newObj))
			}
			// obj = newObj

			/**
			if (arr[0] && !obj[arr[0]]) {
				obj[arr[0]] = await {}
			}
			if (arr[1] && !obj[arr[0]][arr[1]]) {
				objobj[arr[0]][arr[1]] = await {}
			}
			if (arr[2] && !obj[arr[0]][arr[1]][arr[2]]) {
				objobj[arr[0]][arr[1]][arr[2]] = await {}
			}
			if (arr[3] && !obj[arr[0]][arr[1]][arr[2]][arr[3]]) {
				objobj[arr[0]][arr[1]][arr[2]][arr[3]] = await {}
			}
			if (arr[4] && !obj[arr[0]][arr[1]][arr[2]][arr[3]][arr[4]]) {
				objobj[arr[0]][arr[1]][arr[2]][arr[3]][arr[4]] = await {}
			}
			**/

			//let role_obj = await global.logic.mode.role
			/**
			let arr = await [
				{'obj': 'role'},
				{'obj': role},
				{'obj': 'mode'},
				{'obj': mode},
				{'obj': 'parent_mode'},
				{'arr': parent_mode}
			]
			**/
			//role_obj = await ModelApisGlobal.ObjCreate(role_obj, 'role.'+role+'.mode.'+mode+'.parent_mode.'+parent_mode)
			//global.logic.mode = await role_obj

		}
		catch (err) {
			if (err) {
				global._console('error', 'objCreate', __filename, err)
				if (global.json_db.console_error === true) { console.log(err) }
			}
		}
		return resp
	}

	/** Преобразование строки в обьект **/
	this.stringToObj = async data => {
		try {

		}
		catch (err) {
			if (err) {
				global._console('error', 'stringToObj', __filename, err)
				if (global.json_db.console_error === true) { console.log(err) }
			}
		}
	}

	/** Ищем совпадения - возращаем колличество найденых совпадений**/
	this.dataTest = async (data, arr, error_user_id) => {
		let resp = 0
		try {
			for (var key in arr) {
				if (data.indexOf(arr[key]) != -1) {
					resp++
				}
			}
		}
		catch (err) {
			if (err) {
				global._console('error', 'dataTest', __filename, err, false, error_user_id)
				if (global.json_db.console_error === true) { console.log(err) }
			}
		}
		return resp
	}

	this.objClean = async (data, error_user_id) => {
		try {
			// Удаляем пустые значения
			for (var key in data) {
				if (data[key].length == 0) delete data[key]
				if (!data[key]) delete data[key]
			}
		}
		catch (err) {
			if (err) {
				global._console('error', 'objClean', __filename, err, false, error_user_id)
				if (global.json_db.console_error === true) { console.log(err) }
			}
		}
		return data
	}

	/** Функция контроля памяти **/
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
			
			if (global.json_db.console_plugin === true) {
				console.log(`${key} ${Math.round(used[key] / 1024 / 1024 * 100) / 100} MB`)
			}
			global._console('memory', 'memoryUsage', __filename, '', String(pro))
			if (global.json_db.console_plugin === true) {
				console.log('Memory usage:', pro)
			}
		}
		catch (err) {
			if (err) {
				global._console('error', 'memoryUsage', __filename, err, false)
				if (global.json_db.console_error === true) { console.log(err) }
			}
		}
		return used
	}

	/** Функция контроля памяти **/
	this.memoryUsageInterval = (delay) => {
		let set_timeout_key = setInterval(() => {this.memoryUsage()}, Number(delay)*60*1000) // каждых delay минут
	}

	/** Очень хорошая функция для всяких сравнений текущей даты и пользовательской
		Парсим дату в милисекундах и получаем большой обьект для сравнения
	**/
	this.parseMilliseconds = async (milliseconds, offset_time, date_now, error_user_id) => {

		let resp = {}
		try {
			resp.offset_time = 0
			if (offset_time) resp.offset_time = await offset_time

			if (!date_now && offset_time) {
				resp.date_now = await Date.now() + Number(offset_time)
				resp.offset_time = await Number(offset_time)
			}
			else if (!date_now) resp.date_now = await Date.now()
			else resp.date_now = await date_now

			// возращаем пользовательское значение милисекунд
			resp.milliseconds = Number(milliseconds)
			// Разница текущей даты и пользовательской
			resp.difference = Number(resp.date_now) - Number(milliseconds)
			resp.difference_hours = Math.floor(resp.difference / (1000*60*60))

			// Обьект текущей даты
			resp.date = {}
			resp.date.date = await new Date(resp.date_now)
			resp.date.year = await resp.date.date.getFullYear()
			resp.date.month = await Number(resp.date.date.getMonth()) + 1
			resp.date.monthDisplay = await resp.date.month > 9 ? resp.date.month : '0'+resp.date.month
			resp.date.day = await resp.date.date.getDate()
			resp.date.dayDisplay = await resp.date.day > 9 ? resp.date.day : '0'+resp.date.day
			resp.date.hours = await resp.date.date.getHours()
			resp.date.hoursDisplay = await resp.date.hours > 9 ? resp.date.hours : '0'+resp.date.hours
			resp.date.minutes = await resp.date.date.getMinutes()
			resp.date.minutesDisplay = await resp.date.minutes > 9 ? resp.date.minutes : '0'+resp.date.minutes

			// Обьект пользовательской даты
			resp.user = {}
			resp.user.date = await new Date(resp.milliseconds)
			resp.user.year = await resp.user.date.getFullYear()
			resp.user.month = await Number(resp.user.date.getMonth()) + 1
			resp.user.monthDisplay = await resp.user.month > 9 ? resp.user.month : '0'+resp.user.month
			resp.user.day = await resp.user.date.getDate()
			resp.user.dayDisplay = await resp.user.day > 9 ? resp.user.day : '0'+resp.user.day
			resp.user.hours = await resp.user.date.getHours()
			resp.user.hoursDisplay = await resp.user.hours > 9 ? resp.user.hours : '0'+resp.user.hours
			resp.user.minutes = await resp.user.date.getMinutes()
			resp.user.minutesDisplay = await resp.user.minutes > 9 ? resp.user.minutes : '0'+resp.user.minutes

			// Get years from milliseconds
			resp.years = await (resp.difference / (1000*60*60*24*365)).toFixed(10)
			resp.absoluteYears = await Math.floor(resp.years)
			resp.yearsDisplay = await resp.absoluteYears

			// Get remainder from years and convert to days
			resp.days = await ((resp.years - resp.absoluteYears) * 365).toFixed(8)
			//resp.days = await (resp.difference / (1000*60*60*24)).toFixed(8)
			resp.absoluteDays = await Math.floor(resp.days)
			resp.daysDisplay = await resp.absoluteDays

			// Get remainder from days and convert to hours
			resp.hours = await ((resp.days - resp.absoluteDays) * 24).toFixed(6)
			//resp.hours = await milliseconds / (1000*60*60)
			resp.absoluteHours = await Math.floor(resp.hours)
			resp.hoursDisplay = await resp.absoluteHours > 9 ? resp.absoluteHours : '0'+resp.absoluteHours

			// Get remainder from hours and convert to minutes
			resp.minutes = await ((resp.hours - resp.absoluteHours) * 60).toFixed(4)
			resp.absoluteMinutes = await Math.floor(resp.minutes)
			resp.minutesDisplay = await resp.absoluteMinutes > 9 ? resp.absoluteMinutes : '0'+resp.absoluteMinutes

			// Get remainder from minutes and convert to seconds
			resp.seconds = await ((resp.minutes - resp.absoluteMinutes) * 60).toFixed(2)
			resp.absoluteSeconds = await Math.floor(resp.seconds)
			resp.secondsDisplay = await resp.absoluteSeconds > 9 ? resp.absoluteSeconds : '0'+resp.absoluteSeconds

			let types_years = await global.config.types_ua.years
			if (types_numbers_1.has(Number(resp.absoluteYears))) resp.yearsText = await resp.absoluteYears+" "+types_years[0]
			else if (types_numbers_2.has(Number(resp.absoluteYears))) resp.yearsText = await resp.absoluteYears+" "+types_years[1]
			else resp.yearsText = await resp.absoluteYears+" "+types_years[2]

			let types_days = await global.config.types_ua.days
			if (types_numbers_1.has(Number(resp.absoluteDays))) resp.daysText = await resp.absoluteDays+" "+types_days[0]
			else if (types_numbers_2.has(Number(resp.absoluteDays))) resp.daysText = await resp.absoluteDays+" "+types_days[1]
			else resp.daysText = await resp.absoluteDays+" "+types_days[2]

			let types_hours = await global.config.types_ua.hours
			if (types_numbers_1.has(Number(resp.absoluteHours))) resp.hoursText = await resp.absoluteHours+" "+types_hours[0]
			else if (types_numbers_2.has(Number(resp.absoluteHours))) resp.hoursText = await resp.absoluteHours+" "+types_hours[1]
			else resp.hoursText = await resp.absoluteHours+" "+types_hours[2]

			let types_minutes = await global.config.types_ua.minutes
			if (types_numbers_1.has(Number(resp.absoluteMinutes))) resp.minutesText = await resp.absoluteMinutes+" "+types_minutes[0]
			else if (types_numbers_2.has(Number(resp.absoluteMinutes))) resp.minutesText = await resp.absoluteMinutes+" "+types_minutes[1]
			else resp.minutesText = await resp.absoluteMinutes+" "+types_minutes[2]

			let types_seconds = await global.config.types_ua.seconds
			if (types_numbers_1.has(Number(resp.absoluteSeconds))) resp.secondsText = await resp.absoluteSeconds+" "+types_seconds[0]
			else if (types_numbers_2.has(Number(resp.absoluteSeconds))) resp.secondsText = await resp.absoluteSeconds+" "+types_seconds[1]
			else resp.secondsText = await resp.absoluteSeconds+" "+types_seconds[2]

			resp.data_time = await resp.hoursDisplay+':'+resp.minutesDisplay+':'+resp.secondsDisplay
			resp.data_days_time = await resp.daysDisplay+':'+resp.hoursDisplay+':'+resp.minutesDisplay+':'+resp.secondsDisplay

			if (Number(resp.absoluteYears) >= 1) resp.data = await resp.yearsText+' '+resp.daysText+' '+resp.hoursText
			else if (Number(resp.absoluteDays) >= 1) resp.data = await resp.daysText+' '+resp.hoursText
			else resp.data = await resp.hoursText

			//resp.alternative_1 = await this.timeParsed(resp.difference)
			//resp.alternative_2 = await this.timeParse(resp.difference)
			resp.times = await this.timeConversion(resp.difference)

		}
		catch (err) {
			if (err) {
				global._console('error', 'parseMilliseconds', __filename, err, false, error_user_id)
				if (global.json_db.console_error === true) { console.log(err) }
			}
		}

		return resp
	}

	/** Очистка и валидация номера телефона **/
	this.validatePhone = async (phone, param, error_user_id) => {
		let res = false
		try {

			phone = await String(phone)
			phone = await phone.replace(new RegExp(/([-+(),\s])/, 'g'), '')
			
			if (global.json_db.console_plugin === true) {
				console.log('validatePhone phone', phone, 'phone.length', phone.length)
			}
			if (phone.length == 12 && phone.substr(0, 3) == '380') res = await Number(phone)
			else if (phone.length == 10 && phone.substr(0, 1) == '0') res = await Number('38'+phone)

		}
		catch (err) {
			if (err) {
				global._console('error', 'validatePhone', __filename, err, false, error_user_id)
				if (global.json_db.console_error === true) { console.log(err) }
			}
		}
		global._console('console', 'validatePhone', __filename, '', String(phone+'\n'+res), error_user_id)
		return res
	}

	this.timeConversion = async (milliseconds, error_user_id) => {
		let resp = {}
		try {
			resp.seconds = await (milliseconds / 1000).toFixed(1)
			resp.minutes = await (milliseconds / (1000 * 60)).toFixed(1)
			resp.hours = await (milliseconds / (1000 * 60 * 60)).toFixed(1)
			resp.days = await (milliseconds / (1000 * 60 * 60 * 24)).toFixed(1)

			if (resp.seconds < 60) {
				resp.type = 'seconds'
				resp.data = await resp.seconds + " Sec"
			} else if (resp.minutes < 60) {
				resp.type = 'minutes'
				resp.data = await resp.minutes + " Min"
			} else if (resp.hours < 24) {
				resp.type = 'hours'
				resp.data = await resp.hours + " Hrs"
			} else {
				resp.type = 'days'
				resp.data = await resp.days + " Days"
			}
		}
		catch (err) {
			if (err) {
				global._console('error', 'timeConversion', __filename, err, false, error_user_id)
				if (global.json_db.console_error === true) { console.log(err) }
			}
		}
		return resp
	}

	this.timeParsed = async (milliseconds, error_user_id) => {
		let resp = {}
		try {
			resp.seconds = await (milliseconds / 1000).toFixed(0)
			resp.minutes = await Math.floor(resp.seconds / 60)
			resp.hours = ''

			if (resp.minutes > 59) {
				resp.hours = await Math.floor(resp.minutes / 60)
				resp.hoursDisplay = await (resp.hours >= 10) ? resp.hours : "0" + resp.hours
				resp.minutes = await resp.minutes - (resp.hours * 60)
				resp.minutesDisplay = await (resp.minutes >= 10) ? resp.minutes : "0" + resp.minutes
			}

			resp.seconds = await Math.floor(resp.seconds % 60)
			resp.secondsDisplay = await (resp.seconds >= 10) ? resp.seconds : "0" + resp.seconds

			if (resp.hours != '') resp.data = await resp.hoursDisplay + ":" + resp.minutesDisplay + ":" + resp.secondsDisplay
			else resp.data = await resp.minutesDisplay + ":" + resp.secondsDisplay
		}
		catch (err) {
			if (err) {
				global._console('error', 'timeParsed', __filename, err, false, error_user_id)
				if (global.json_db.console_error === true) { console.log(err) }
			}
		}
		return resp
	}

	this.timeParse = async (milliseconds, error_user_id) => {
		let resp = {}
		try {
			resp.milliseconds = await parseInt((milliseconds % 1000) / 100)
			resp.seconds = await parseInt((milliseconds / 1000) % 60)
			resp.minutes = await parseInt((milliseconds / (1000 * 60)) % 60)
			resp.hours = await parseInt((milliseconds / (1000 * 60 * 60)) % 24)

			resp.hoursDisplay = await (resp.hours < 10) ? "0" + resp.hours : resp.hours
			resp.minutesDisplay = await (resp.minutes < 10) ? "0" + resp.minutes : resp.minutes
			resp.secondsDisplay = await (resp.seconds < 10) ? "0" + resp.seconds : resp.seconds

			resp.data = await resp.hoursDisplay + ":" + resp.minutesDisplay + ":" + resp.secondsDisplay + "." + resp.milliseconds
		}
		catch (err) {
			if (err) {
				global._console('error', 'timeParse', __filename, err, false, error_user_id)
				if (global.json_db.console_error === true) { console.log(err) }
			}
		}
		return resp
	}

	/** Проверка наличие переменной в глубине обьекта
	* Checks to see if a value is set.
	* 
	* @param {Function} accessor Function that returns our value
	*/
	this.isset = async (accessor, error_user_id) => {
		try {
			// Note we're seeing if the returned value of our function is not
			// undefined
			return typeof accessor() !== 'undefined'
		}
		catch (err) {
			if (err) {
				//global._console('console', 'isset', __filename, err, String(accessor), error_user_id)
				// if (global.json_db.console_error === true) { console.log(err) }
			}
			// And we're able to catch the Error it would normally throw for
			// referencing a property of undefined
			return false
		}
	}

	/** data2excel **/
	this.data2excel = async (data, bookType, filename, filedir, header_param, error_user_id) => {
		let file = false
		try {
			/* generate workbook */
			let wb = await XLSX.utils.book_new()

			let header = []
			if (header_param) header = await header_param
			else {
				for (var key in data[0]) {
					header.push(key)
				}
			}

			if (!filename) filename = await uuidv4()

			let json_data = await this.jsonParse(JSON.stringify(data), error_user_id)
			if (global.json_db.console_plugin === true) {
				console.log('data2excel header', header, json_data)
			}
			let ws = await XLSX.utils.json_to_sheet(json_data, { header, dateNF: 'FMT 48' })
			let book_type = await bookType || "xlsx"
			await XLSX.utils.book_append_sheet(wb, ws, 'Data')
			/* generate buffer */
			let buf = XLSX.write(wb, {type: 'buffer', bookType: book_type})

			file = await filedir+'/'+filename+'.'+book_type

			//await XLSX.writeFile(wb, file)

			await fs.writeFileSync(file, buf, 'binary')

			// fs.writeFileSync(filename, buf, 'binary') // Записываем
			//request(url, options).pipe(fs.createWriteStream(filedir+'/'+filename+'.'+book_type)).on('close', callback)
			//if (typeof callback == 'function') callback(res.headers)

		}
		catch (err) {
			if (err) {
				global._console('error', 'data2excel', __filename, err, false, error_user_id)
				if (global.json_db.console_error === true) { console.log(err) }
			}
		}
		return file
	}

	/** Разбираем URL для роутинга **/
	this.url_parse = async (req, exclude, error_user_id) => {
		let resp_url = {}, original_url, url_arr = []
		try {
			if (req.originalUrl) original_url = await url.parse(req.originalUrl)
			if (original_url && original_url.pathname) {
				//console.log('pathname 1 ', original_url.pathname)
				if (exclude) {
					if (original_url.pathname.indexOf('/'+exclude+'/') != -1) {
						original_url.pathname = await original_url.pathname.replace(exclude+'/','')
					}
					else if (original_url.pathname.indexOf('/'+exclude) != -1) {
						original_url.pathname = await original_url.pathname.replace(exclude,'')
					}
				}
				url_arr = await original_url.pathname.split('/')
			}
			// --------------------------------------------------------------
			// Предусматриваем пятиуровневый URL
			// https://site.com/{resource}/{section}/{alias}/{action}/{action_id}
			// --------------------------------------------------------------
			//console.log('pathname 2 ', original_url.pathname)
			resp_url = {}
			resp_url.resource = 'index' // По умолчанию главная
			if (url_arr[1] || url_arr[1] == '') resp_url.resource = await url_arr[1]
			if (resp_url.resource == '') resp_url.resource = 'index'
			if (url_arr[2]) resp_url.section = await url_arr[2]
			if (url_arr[3]) resp_url.alias = await url_arr[3]
			if (url_arr[4]) resp_url.action = await url_arr[4]
			if (url_arr[5]) resp_url.action_id = await url_arr[5]
			if (url_arr[6]) resp_url.action_plus = await url_arr[6]
			//console.log('resp_url ', JSON.stringify(resp_url))
		}
		catch (err) {
			if (err) {
				global._console('error', 'url_parse', __filename, err, false, error_user_id)
				if (global.json_db.console_error === true) { console.log(err) }
			}
		}
		return resp_url
	}

	/** Рендер html ответов для POST запросов **/
	this.render = async (dir, template, obi, error_user_id) =>  {
		let resp = false, t, file
		try {
			if (fs.existsSync(dir+'/'+template+'.twig')) {
				file = await dir+'/'+template+'.twig'
			}
			else if (fs.existsSync(global.config.dir.template+'/'+dir+'/'+template+'.twig')) {
				file = await global.config.dir.template+'/'+dir+'/'+template+'.twig'
			}
			//console.log('render obi', obi)
			if (file) t = await twig({data: fs.readFileSync(file, 'utf8')})
			if (t) resp = await t.render(obi)
		}
		catch (err) {
			if (err) {
				global._console('error', 'render', __filename, err, false, error_user_id)
				if (global.json_db.console_error === true) { console.log(err) }
			}
		}
		return resp
	}

	/** Загрузка файлов **/
	this._downloadFile = async (url, options, filename, error_user_id) => {
		try {

			let date_start = await dateFormat(Date.now(), "dd-mm-yyyy hh:MM:ss")
			await global.sendAdmin('Начинаю скачивать файл '+url+'\n'+date_start, [1])

			let resp = false
			let callback = async (_close) => {
				if (_close == true) {
					resp = await _close
					return true
				}
			}

			request.head(url, options, async function(err, res, body) {
				if (err) {
					console.log('err:', err)
				}
				else {
					// console.log('headers:', res.headers)
					request(url, options)
						.pipe(fs.createWriteStream(filename))
						.on('close', callback)

					if (typeof callback == 'function') {
						await callback(true)

					}
				}
			})

			let date_end = await dateFormat(Date.now(), "dd-mm-yyyy hh:MM:ss")
			await global.sendAdmin('Файл '+url+' скачан \n '+date_end+' \n resp'+resp, [1])

			return resp
		}
		catch (err) {
			if (err) {
				global._console('Error', 'eldoApi.downloadFile', __filename, err, 'eldoApi - Ошибка при скачивании файла', error_user_id)
				if (global.json_db.console_error === true) { console.log(err) }
			}
		}
	}

	/** Загрузка файлов **/
	this.downloadFile = async (url, filename, error_user_id) => {
		try {
			let callback = function () {}
			let options = {
				headers: {
					'Content-type': 'applcation/json'
				},
				encodig: null
			}
			request.head(url, options, async function(err, res, body) {
				if (!err) {
					//console.log('downloadFile headers:', res.headers)
					//console.log('downloadFile body:', body)
					// console.log('content-type:', res.headers['content-type'])
					// console.log('content-length:', res.headers['content-length'])
					// fs.writeFileSync(filename, body, 'binary') // Записываем
					request(url, options).pipe(fs.createWriteStream(filename)).on('close', callback)
					if (typeof callback == 'function') callback(res.headers)
				}
				else if (err) {
					global._console('error', 'downloadFile', __filename, err, false, error_user_id)
					console.log('err:', err)
				}
			})

			return true
		}
		catch (err) {
			if (err) {
				global._console('error', 'downloadFile', __filename, err, false, error_user_id)
				if (global.json_db.console_error === true) { console.log(err) }
			}
		}
	}

	/** Загрузка файлов **/
	this.download = async (uri, dir, filename, callback) => {
		request.head(uri, async function(err, res, body) {
			// console.log('content-type:', res.headers['content-type'])
			// console.log('content-length:', res.headers['content-length'])
			request(uri).pipe(fs.createWriteStream(dir+'/'+filename)).on('close', callback)
			if (typeof callback == 'function') callback(res.headers)
		})
	}

	this.download_ = (uri, filename, callback) => {
		request.head(uri, function(err, res, body){
			//console.log('download_ '+uri+'\n')
			//console.log('content-type:', res.headers['content-type'])
			//console.log('content-length:', res.headers['content-length'])
			request(uri).pipe(fs.createWriteStream(filename)).on('close', callback)
		})
	}

	this.replaceAll = (str, search, replace, split_join, error_user_id) => {
		let res = str
		try {
			if (typeof search == 'object') {
				for (var key in search) {
					str = this.replaceAll(str, search[key], replace)
				}
			}
			else {
				if (split_join) res = str.split(search).join(replace)
				else res = str.replace(new RegExp(search, 'g'), replace)
			}
		}
		catch (err) {
			if (err) {
				global._console('error', 'replaceAll', __filename, err, false, error_user_id)
				if (global.json_db.console_error === true) { console.log(err) }
			}
		}
		return res
	}

	this.replaceSplitJoin = (str, search, replace, error_user_id) => {
		let res = false
		try {
			res = str.split(search).join(replace)
		}
		catch (err) {
			if (err) {
				global._console('error', 'replaceSplitJoin', __filename, err, false, error_user_id)
				if (global.json_db.console_error === true) { console.log(err) }
			}
		}
		return res
	}

	/** Функция клинер для save_data**/
	this.cleanSaveData = async (value, error_user_id) => {
		let res = false
		try {
			//console.log('\n--- clean(value) ---')
			//console.log(value)
			if (value && value != undefined && value != '') {

				if (global.json_db.console_plugin === true) {
					console.log('--- this.user.param[data_name][data_alias].title ---', value)
				}
				//this.user.param[data_name][data_alias].title = await this.user.param[data_name][data_alias].title.replace(new RegExp("?:\\r\\n|\\r|\\n", "g"), " ")
				value = await value.replace(/\r\n|\r|\n/g, " ")
				value = await String(value.replace(/\n/g, " "))
				if (value.indexOf('"') != -1) {
					value = await value.replace(/"/g, '\"')
				}
				if (global.json_db.console_plugin === true) {
					console.log('--- this.user.param[data_name][data_alias].title2 ---', value)
				}
				value = await this.replaceAll(value, "'", '&#39;')
				value = await value.trim()
				res = await value
			}
		}
		catch (err) {
			if (err) {
				global._console('error', 'cleanSaveData', __filename, err, false, error_user_id)
				if (global.json_db.console_error === true) { console.log(err) }
			}
		}
		return res
	}

	this.randomInteger2 = async (min, max) => {
		// случайное число от min до (max+1)
		let rand = await min + Math.random() * (max + 1 - min)
		return Math.floor(rand)
	}

	this.randomInteger = async (min, max) => {
		// получить случайное число от (min-0.5) до (max+0.5)
		let rand = await min - 0.5 + Math.random() * (max - min + 1)
		return Math.round(rand)
	}

	/** Локализация на нужном языке **/
	this.getLanguage = async (lg, type, error_user_id) => {
		let language = {}
		try {
			let _lg = 'ua'
			if (global.config.langSet.has(lg)) {
				_lg = await lg
			}

			language['0'] = await "Error"
			language['_404'] = await {
				"h1": "404 Error",
				"oops": "Oops! This page Could Not Be Found!",
				"sorry": "Sorry bit the page you are looking for does not exist, have been removed or name changed.",
				"homepage": "Go to homepage"
			}

			if (global.json_db.console_plugin === true) {
				console.log('global.config.lang', global.config.langSet)
			}
			// let file_language = await global.config.dir.language+'/'+_lg+'_.json'

			let _get = {}
			_get.state = 1
			if (type) _get.type = await type
			/** Подключаем таблицу **/
			let _lang = await global.db._table('language')
			let count = await _lang.count(_get)
			/** Получем список **/
			let langs = await _lang.get(_get, count, 0, 'id', 'ASC', ['id', _lg])
			if (langs && langs[0] && langs[0].id) {
				for (var key in langs) {
					// language[langs[key].lg_id] = await this.clean(langs[key][_lg])
					language[langs[key].id] = await this.replaceAll(langs[key][_lg], '&#39;', "\'")
				}
			}
		}
		catch (err) {
			if (err) {
				global._console('error', 'getLanguage', __filename, err, false, error_user_id)
				if (global.json_db.console_error === true) { console.log(err) }
			}
		}
		return language
	}

	/** Локализация на нужном языке из файлов локализации **/
	this.getLanguageFile = async (lg, error_user_id) => {
		let language = {}
		try {
			let param = {}
			let user_lg = 'en'
			// console.log('global.config.lang', global.config.lang)
			if (global.config.langSet.has(lg)) user_lg = await lg
			let file_language = await global.config.dir.language+'/'+user_lg+'.json'

			//console.log('getLanguage', user_lg)

			// Читаем из локального хранилища
			language = this.jsonParse(fs.readFileSync(file_language, 'utf8'), error_user_id)
		}
		catch (err) {
			if (err) {
				global._console('error', 'getLanguage2', __filename, err, false, error_user_id)
				if (global.json_db.console_error === true) { console.log(err) }
			}
		}
		return language
	}

	/** По дате рождения в формате 01.01.1990 получаем возраст **/
	this.validateAge = async (data, param, error_user_id) => {
		let resp = false, date = false
		try {
			if (typeof data == 'object' && data.date_time && Number(data.date_time) > 1000000000) {
				date = await Number(data.date_time)
			}
			else if (Number(data) > 1000000000) {
				date = await Number(data)
			}

			if (date && typeof date == 'number') {
				// Форматируем дату и вычисляем 
				let getFullYear = new Date().getFullYear()
				//let user_date = await Date.parse(data)
				let userFullYear = await new Date(date).getFullYear()
				let age = await Number(getFullYear) - Number(userFullYear)

				if (age && param) {
					if (param.min || param.max) {
						if (param.min && param.max) {
							if (age >= Number(param.min) && age <= Number(param.max)) resp = await age
						}
						else if (param.min) {
							if (age >= Number(param.min)) resp = await age
						}
						else if (param.max) {
							if (age <= Number(param.max)) resp = await age
						}
					}
					else if (param.get_age) resp = await age
				}
				else if (age) resp = await age
			}
		}
		catch (err) {
			if (err) {
				global._console('error', 'validateAge', __filename, err, String('\n data: '+data+'\n param: '+JSON.stringify(param)), error_user_id)
				if (global.json_db.console_error === true) { console.log(err) }
			}
		}
		if (global.json_db.console_plugin === true) {
			console.log('userAge '+resp)
		}
		return resp
	}

	/** Переворачивает дату
		Понимает дату в форматах:
			2020-10-25
			2020.10.25
			2020:10:25
			2020/10/25
			25.10.2020
			25-10-2020
			25/10/2020
			25:10:2020
		Вернет дату в перевернутом виде из указанным separator
		Если separator не указан вернет с тем же как и в исходнике
	**/
	this.flipDate = async (date, separator, error_user_id) => {
		let res = false
		try {
			if (date && typeof date == 'string' && date.length == 10) {

				let r = '.'
				if (date.indexOf(':') != -1) r = ':'
				else if (date.indexOf('-') != -1) r = '-'
				else if (date.indexOf('.') != -1) r = '.'
				else if (date.indexOf('/') != -1) r = '/'

				let sp = await date.split(r)

				if (!separator) separator = r

				res = await sp[2]+separator+sp[1]+separator+sp[0]

			}
		}
		catch (err) {
			if (err) {
				global._console('error', 'flipDate', __filename, err, false, error_user_id)
				if (global.json_db.console_error === true) { console.log(err) }
			}
		}
		return res
	}

	/** Преобразование даты 
		Понимает дату в форматах:
			2020-10-25
			2020.10.25
			2020:10:25
			2020/10/25
			25.10.2020
			25-10-2020
			25/10/2020
			25:10:2020
		Вернет дату в формате UNIX: 1234567890000 (13 символов)
	**/
	this.getDate = async (data, param, error_user_id) => {
		let resp = false, date = false
		try {
			if (typeof data == 'object' && data.date && data.date.length == 10) {
				date = await data.date
			}
			else if (typeof data == 'string' && data.length == 10) {
				date = await data
			}
			if (date != false) {
				let validate_date = await this.validateDate(date, param, error_user_id) // Вернет дату в формате: 2020-10-25
				// Если это дата и ее получилось привести в нужный формат
				if (validate_date != false) {
					resp = await Date.parse(String(validate_date)+'T00:00:00') // Примет дату 2020-04-17 или 2011-10-10T14:48:00
				}
			}
			else if (date != false && typeof data == 'string' && data.length >= 15 && data.length <= 25) {
				// Передаем на обработку
				let full_date = await this.validateFullDate(data, param, error_user_id)
				if (full_date != false) {
					//resp = await Date.parse(full_date)
				}
			}
		}
		catch (err) {
			if (err) {
				global._console('error', 'getDate', __filename, err, String('\n data: '+data+'\n param: '+JSON.stringify(param)), error_user_id)
				if (global.json_db.console_error === true) { console.log(err) }
			}
		}
		return resp
	}

	/** Валидация даты
		Понимает дату в форматах:
			2020-10-25
			2020.10.25
			2020:10:25
			2020/10/25
			25.10.2020
			25-10-2020
			25/10/2020
			25:10:2020
		Вернет дату в формате: 2020-10-25
	**/
	this.validateDate = async (data, param, error_user_id) => {
		let resp = false, date = false, test = false
		try {

			if (typeof data == 'string' && data.length == 10) {
				// Меняем сепаратор
				if (data.indexOf(':') != -1) date = await data.split(':').join('-')
				else if (data.indexOf('.') != -1) date = await data.split('.').join('-')
				else if (data.indexOf('/') != -1) date = await data.split('/').join('-')
				else if (data.indexOf('-') != -1) date = await data.split('-').join('-')
			}

			//global.sendAdmin('validateDate data '+data+' date '+date, [1])

			if (date && date.length == 10) {
				// Приводим в нужный формат
				let ooo = /^[0-3][0-9]-[0|1][0-9]-(19|20)[0-9]{2}/
				test = await ooo.test(date)
				if (test === true) {
					resp = await this.flipDate(date, '-', error_user_id)
				}
				else {
					ooo = /^(19|20)[0-9]{2}-[0|1][0-9]-[0-3][0-9]/
					test = await ooo.test(date)
					if (test === true) {
						resp = await date
					}
				}
			}
			//global.sendAdmin('validateDate data '+data+' date '+date+' resp '+resp, [1])
		}
		catch (err) {
			if (err) {
				global._console('error', 'validateDate', __filename, err, String('\n data: '+data+'\n param: '+JSON.stringify(param)), error_user_id)
				if (global.json_db.console_error === true) { console.log(err) }
			}
		}
		return resp
	}

	/** Валидация полной даты
		Понимает дату в форматах:
			2020-10-25T00:00:00
			2020.10.25T00:00:00
			2020:10:25T00:00:00
			2020/10/25T00:00:00
			25.10.2020T00:00:00
			25-10-2020T00:00:00
			25/10/2020T00:00:00
			25:10:2020T00:00:00
		Вернет дату в формате: 2020-10-25T00:00:00
	**/
	this.validateFullDate = async (full_date, param, error_user_id) => {
		let resp = false
		try {
			// В разработке )))
			resp = false
		}
		catch (err) {
			if (err) {
				global._console('error', 'validateFullDate', __filename, err, false, error_user_id)
				if (global.json_db.console_error === true) { console.log(err) }
			}
		}
		return resp
	}

	/** Валидация времени **/
	this.validateTime = async (data, param, error_user_id) => {
		if (global.json_db.console_plugin === true) {
			console.log('validateTime')
		}
		let res = false
		try {
			let re = /^(?:(?:([01]?\d|2[0-3]):)?([0-5]?\d):)?([0-5]?\d)$/
			res = await re.test(data)
		}
		catch (err) {
			if (err) {
				global._console('error', 'validateTime', __filename, err, String('\n data: '+data+'\n param: '+JSON.stringify(param)), error_user_id)
				if (global.json_db.console_error === true) { console.log(err) }
			}
		}
		if (global.json_db.console_plugin === true) {
			console.log(res)
		}
		return res
	}

	/** Валидация Email **/
	this.validateEmail = async (email, param, error_user_id) => {
		let res = false
		try {
			var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
			let test = await re.test(email)
			if (test && test == true) res = await email
			if (global.json_db.console_plugin === true) {
				console.log('validateEmail', test, res)
			}
		}
		catch (err) {
			if (err) {
				global._console('error', 'validateEmail', __filename, err, String('\n email: '+email+'\n param: '+JSON.stringify(param)), error_user_id)
				if (global.json_db.console_error === true) { console.log(err) }
			}
		}
		return res
	}

	/** Валидация Inn **/
	this.validateInn = async (inn, param, error_user_id) => {
		let res = false
		try {
			inn = await this.clean(inn)
			if (inn.length == 10) res = await inn
		}
		catch (err) {
			if (err) {
				global._console('error', 'validateInn', __filename, err, String('\n inn: '+inn+'\n param: '+JSON.stringify(param)), error_user_id)
				if (global.json_db.console_error === true) { console.log(err) }
			}
		}
		return res
	}

	/** Convert a CSV String to JSON */
	this.csvtojson = (csvString, error_user_id) => {
		var res = false
		try {
			var json = []
			var csvArray = csvString.split("\n")
			// Remove the column names from csvArray into csvColumns.
			// Also replace single quote with double quote (JSON needs double).
			var csvColumns = this.jsonParse("[" + csvArray.shift().replace(/'/g, '"') + "]", error_user_id)
			csvArray.forEach(function(csvRowString) {
				var csvRow = csvRowString.split(",")
				// Here we work on a single row.
				// Create an object with all of the csvColumns as keys.
				jsonRow = new Object()
				for ( var colNum = 0; colNum < csvRow.length; colNum++) {
					// Remove beginning and ending quotes since stringify will add them.
					var colData = csvRow[colNum].replace(/^['"]|['"]$/g, "")
					jsonRow[csvColumns[colNum]] = colData
				}
				json.push(jsonRow)
			})
			res = JSON.stringify(json)
		}
		catch (err) {
			if (err) {
				global._console('error', 'csvtojson', __filename, err, false, error_user_id)
				if (global.json_db.console_error === true) { console.log(err) }
			}
		}
		return res
	}

	/** Полезная штука escape RegExp **/
	this.escapeRegExp = async (value, error_user_id) => {
		let res = false
		try {
			res = await value.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1")
		}
		catch (err) {
			if (err) {
				global._console('error', 'escapeRegExp', __filename, err, String('\n value: '+value), error_user_id)
				if (global.json_db.console_error === true) { console.log(err) }
			}
		}
		return res
	}

	/** Функции очистки **/
	this.clean = async (value, error_user_id) => {
		let res = false
		try {
			if (global.json_db.console_plugin === true) {
				console.log('\n--- clean(value) ---')
				console.log(value)
			}
			if (value && value != undefined && value != '') {
				value = await String(value)
				// value = await value.replace("'",'&#8221;')
				value = await this.replaceAll(value, "'", '&#39;')
				// &#39; или &#x27; bkb &#8217; или &#x2019; 
				value = await value.trim()
				// value = await value.replace(/[.,\/#!?$%\^&\*<>;:{}=\-_`~()]/g,"")
				// value = await value.replace(/\s{2,}/g," ")
				// if (value.indexOf("'") != -1) value = await value.replace("'",'')
				// if (value.indexOf('"') != -1) value = await value.replace('"','')
				// if (value.indexOf('`') != -1) value = await value.replace('`','')
				// value = await value.replace(/[\/#$%\^&\*<>{}`\'\"~()]/g,'')
				// value = await value.replace(/\s{2,}/g," ")
				// value = await sanitizeHtml(value)
				// value = await value.replace(/[\/#$%\^&\*<>{}\`\'\"~()]/g,'')
				// value = await value.replace(/\s{2,}/g," ")
				// value = await value.toLowerCase()
				// value = await value[0].toUpperCase()+value.slice(1)
				res = await value
			}
		}
		catch (err) {
			if (err) {
				global._console('error', 'clean', __filename, err, String('\n value: '+value), error_user_id)
				if (global.json_db.console_error === true) { console.log(err) }
			}
		}
		return res
	}

	/** Функция клинер **/
	this.cleanObj = async (value, error_user_id) => {
		let res = false
		try {
			if (global.json_db.console_plugin === true) {
				console.log('\n--- clean(value) ---')
				console.log(value)
			}
			if (value && value != undefined && value != '') {
				value = await this.replaceAll(value, "'", '&#39;')
				value = await value.trim()
				value = await String(value)
				res = await value
			}
		}
		catch (err) {
			if (err) {
				global._console('error', 'cleanObj', __filename, err, String('\n value: '+value), error_user_id)
				if (global.json_db.console_error === true) { console.log(err) }
			}
		}
		return res
	}

	/** Функция клинер **/
	this.cleanLife = async (value, error_user_id) => {
		let res = false
		try {
			if (global.json_db.console_plugin === true) {
				console.log('\n--- clean(value) ---')
				console.log(value)
			}
			if (value && value != undefined && value != '') {
				value = await String(value)
				value = await this.replaceAll(value, "'", '&#39;')
				value = await value.trim()
				res = await value
			}
		}
		catch (err) {
			if (err) {
				global._console('error', 'cleanLife', __filename, err, String('\n value: '+value), error_user_id)
				if (global.json_db.console_error === true) { console.log(err) }
			}
		}
		return res
	}

	/** clean json **/
	this.cleanJson = async (r, error_user_id) => {
		let res = false
		try {
			res = await JSON.stringify(r).replace(/["']/g, "")
		}
		catch (err) {
			if (err) {
				global._console('error', 'cleanJson', __filename, err, false, error_user_id)
				if (global.json_db.console_error === true) { console.log(err) }
			}
		}
		return res
	}

	// Функция клинер для ввода слов пользователем
	this.cleanStr = async (value, error_user_id) => {
		let res = false
		try {
			// value = await value.toLowerCase()
			value = await this.replaceAll(value, "'", '&#39;')
			value = await value.replace(/[.,\/#!?$%\^&\*<>;:{}=\-_`~()]/g,"")
			value = await value.replace(/\s{2,}/g," ")
			value = await sanitizeHtml(value)
			res = await value.trim()
		}
		catch (err) {
			if (err) {
				global._console('error', 'cleanStr', __filename, err, String('\n value: '+value), error_user_id)
				if (global.json_db.console_error === true) { console.log(err) }
			}
		}
		return res
	}

	this.decodeHtml = async (content, error_user_id) => {
		let res = false
		try {
			/**
				content = await content.replace(/\u2013|\u2014/g, "-")
				content = await global.plugin.decodeHtml(content, "&nbsp;", " ")
				content = await global.plugin.replaceAll(content, "&ndash;", " – ")
				content = await global.plugin.replaceAll(content, "&mdash;", " — ")
				content = await global.plugin.replaceAll(content, "&ldquo;", "“")
				content = await global.plugin.replaceAll(content, "&rdquo;", "”")
				content = await global.plugin.replaceAll(content, "&amp;", "&")
				content = await global.plugin.replaceAll(content, "&lt;", "<")
				content = await global.plugin.replaceAll(content, "&gt;", ">")
				content = await global.plugin.replaceAll(content, "&laquo;", "«")
				content = await global.plugin.replaceAll(content, "&raquo;", "»")
			*/
			let entities = new Entities()
			res = await entities.decode(content)
		}
		catch (err) {
			if (err) {
				global._console('error', 'decodeHtml', __filename, err, String('\n content: '+content), error_user_id)
				if (global.json_db.console_error === true) { console.log(err) }
			}
		}
		return res
	}

	this.encodeHtml = async (content, error_user_id) => {
		let res = false
		try {
			let entities = new Entities()
			res = await entities.encode(content)
		}
		catch (err) {
			if (err) {
				global._console('error', 'encodeHtml', __filename, err, String('\n content: '+content), error_user_id)
				if (global.json_db.console_error === true) { console.log(err) }
			}
		}
		return res
	}

	/** Генерация token, token_id, alias_id **/
	this.token = async () => {
		let res = false
		try {
			res = await uuid.v4() // crypto.randomBytes(32).toString('hex')
		}
		catch (err) {
			if (err) {
				global._console('error', 'token', __filename, err, false)
				if (global.json_db.console_error === true) { console.log(err) }
			}
		}
		return res
	}
	
	this.alias_id = async () => {
		return this.token()
	}

	this.token_id = async () => {
		return this.token()
	}

	// Генерируем и шифруем token
	this.encrypt = async (token, error_user_id) => {
		let res = false
		try {
			let absolutePath = await path.resolve(global.config.dir.key+'/public.pem')
			let publicKey = await fs.readFileSync(absolutePath, 'utf8')
			let buffer = await Buffer.from(token, 'utf8')
			let encrypted = await crypto.publicEncrypt(publicKey, buffer)
			res = await encrypted.toString('base64')
		}
		catch (err) {
			if (err) {
				global._console('error', 'encrypt', __filename, err, String('\n token: '+token), error_user_id)
				if (global.json_db.console_error === true) { console.log(err) }
			}
		}
		return res
	}

	// Дешифруем token
	this.decrypt = async (toDecrypt, error_user_id) => {
		let res = false
		try {
			let absolutePath = await path.resolve(global.config.dir.key+'/private.pem')
			let privateKey = await fs.readFileSync(absolutePath, 'utf8')
			let buffer = await Buffer.from(toDecrypt, 'base64')
			let decrypted = await crypto.privateDecrypt({key: privateKey.toString(), passphrase: '',}, buffer,)
			res = await decrypted.toString('utf8')
		}
		catch (err) {
			if (err) {
				global._console('error', 'decrypt', __filename, err, String('\n toDecrypt: '+toDecrypt), error_user_id)
				if (global.json_db.console_error === true) { console.log(err) }
			}
		}
		return res
	}

	// Маневры с ключевыми словами :) нужно оптимизировать
	this.AutoText = (str, error_user_id) => {
		try {
			let replacer = {}
			let run_replace = 0
			let new_str1 = ''
			let new_str2 = ''
			let new_str3 = ''
			let new_str4 = ''
			let new_str5 = ''
			// Соответствие на клавиатуре кириллицы латинским символам
			let replacerEnRu = {
				"q":"й", "w":"ц"  , "e":"у" , "r":"к" , "t":"е", "y":"н", "u":"г",
				"i":"ш", "o":"щ", "p":"з" , "[":"х" , "]":"ъ", "a":"ф", "s":"ы",
				"d":"в" , "f":"а"  , "g":"п" , "h":"р" , "j":"о", "k":"л", "l":"д",
				";":"ж" , "'":"э"  , "z":"я", "x":"ч", "c":"с", "v":"м", "b":"и",
				"n":"т" , "m":"ь"  , ",":"б" , ".":"ю" , "/":"."
			}
			// Соответствие на клавиатуре латинских символов кириллице
			let replacerRuEn = {
				"й":"q", "ц":"w"  , "у":"e" , "к":"r" , "е":"t", "н":"y", "г":"u",
				"ш":"i", "щ":"o", "з":"p" , "х":"[" , "ъ":"]", "ф":"a", "ы":"s",
				"в":"d" , "а":"f"  , "п":"g" , "р":"h" , "о":"j", "л":"k", "д":"l",
				"ж":";" , "э":"'"  , "я":"z", "ч":"x", "с":"c", "м":"v", "и":"b",
				"т":"n" , "ь":"m"  , "б":"," , "ю":"." , ".":"/"
			}
			// Определить кириллицу
			let isRu = function(str) {return /[а-яёА-ЯЁ]+$/i.test(str)}
			// Определить латиницу
			let isEn = function(str) {return /[a-zA-Z]+$/i.test(str)}
		
			if (isEn(str) == true) {replacer = replacerEnRu; run_replace = 1;}
			else if (isRu(str) == true) {replacer = replacerRuEn; run_replace = 1;}
			else {
				var example = str.split(' ')
				if (example[0]) new_str1 = AutoText(example[0])
				if (example[1]) new_str2 = ' '+AutoText(example[1])
				if (example[2]) new_str3 = ' '+AutoText(example[2])
				if (example[3]) new_str4 = ' '+AutoText(example[3])
				if (example[4]) new_str5 = ' '+AutoText(example[4])
			}
		
			if (run_replace == 1) {
				for(i=0; i < str.length; i++) {
					if( replacer[ str[i].toLowerCase() ] != undefined) {
						if(str[i] == str[i].toLowerCase()) replace = replacer[ str[i].toLowerCase() ]
						else if(str[i] == str[i].toUpperCase()) replace = replacer[ str[i].toLowerCase() ].toUpperCase()
						str = str.replace(str[i], replace)
					}
				}
			}
			else str = new_str1+new_str2+new_str3+new_str4+new_str5
		}
		catch (err) {
			if (err) {
				global._console('error', 'AutoText', __filename, err, String('\n str: '+str), error_user_id)
				if (global.json_db.console_error === true) { console.log(err) }
			}
		}
		return str
	}

	this.phone_format = async (phone, error_user_id) => {
		let res = false
		try {
			if (phone && typeof phone != 'string') phone = await String(phone)
			if (phone && phone.length == 12) {
				res = await '+'+phone.substr(0, 2)+' ('+phone.substr(2, 3)+') '+phone.substr(5, 3)+'-'+phone.substr(8, 2)+'-'+phone.substr(10, 2)
			}
		}
		catch (err) {
			if (err) {
				global._console('error', 'phone_format', __filename, err, phone, error_user_id)
				if (global.json_db.console_error === true) { console.log(err) }
			}
		}
		return res
	}

	this.phone_mask = async (phone, error_user_id) => {
		let res = false
		try {
			if (phone && typeof phone != 'string') phone = await String(phone)
			if (phone && phone.length == 12) {
				res = await '+'+phone.substr(0, 2)+' ('+phone.substr(2, 3)+') ***-**-'+phone.substr(10, 2)
			}
		}
		catch (err) {
			if (err) {
				global._console('error', 'phone_mask', __filename, err, phone, error_user_id)
				if (global.json_db.console_error === true) { console.log(err) }
			}
		}
		return res
	}

	// Функция клинер для ввода слов пользователем
	this.cleanAdress = async (value, error_user_id) => {
		let res = false
		try {
			value = await value.replace(/[\/#!?$%\^&\<>;:{}=\_`~()]/g,"")
			value = await value.replace(/\s{2,}/g," ")
			res = await value.trim()
		}
		catch (err) {
			if (err) {
				global._console('error', 'cleanAdress', __filename, err, false, error_user_id)
				if (global.json_db.console_error === true) { console.log(err) }
			}
		}
		return res
	}

	this.cleanName = async (value, error_user_id) => {
		let res = false
		try {
			value = await value.replace(/[.,\/#!?$%\^&\*<>;:{}=\-_`~()]/g,'')
			value = await value.replace(/\s{2,}/g," ")
			value = await sanitizeHtml(value)
			value = await value.trim()
			value = await value.toLowerCase()
			res = await value[0].toUpperCase()+value.slice(1)
		}
		catch (err) {
			if (err) {
				global._console('error', 'cleanName', __filename, err, false, error_user_id)
				if (global.json_db.console_error === true) { console.log(err) }
			}
		}
		return res
	}

	let types_numbers_1 = new Set([
		1,21,31,41,51,61,71,81,91,
		101,121,131,141,151,161,171,
		181,191,201,221,231,241,251,
		261,271,281,291,301,321,
		331,341,351,361
	])
	
	let types_numbers_2 = new Set([
		2,3,4,22,23,24,32,33,34,
		42,43,44,52,53,54,62,63,
		64,72,73,74,82,83,84,92,
		93,94,102,103,104,122,123,
		124,132,133,134,142,143,144,
		152,153,154,162,163,164,172,
		173,174,182,183,184,192,193,
		194,202,203,204,222,223,224,
		232,233,234,242,243,244,252,
		253,254,262,263,264,272,273,
		274,282,283,284,292,293,294,
		302,303,304,322,323,324,332,
		333,334,342,343,344,352,353,
		354,362,363,364
	])
	
	// Проверка на ботов
	this.is_bot = (userAgent, error_user_id) => {
		let bot = true
		try {
			let botPattern = "(googlebot\/|bot|Googlebot-Mobile|Googlebot-Image|ZoominfoBot|YandexMetrika|Google favicon|Mediapartners-Google|bingbot|slurp|java|wget|curl|Commons-HttpClient|Python-urllib|libwww|httpunit|nutch|phpcrawl|msnbot|jyxobot|FAST-WebCrawler|FAST Enterprise Crawler|biglotron|teoma|convera|seekbot|gigablast|exabot|ngbot|ia_archiver|GingerCrawler|webmon |httrack|webcrawler|grub.org|UsineNouvelleCrawler|antibot|netresearchserver|speedy|fluffy|bibnum.bnf|findlink|msrbot|panscient|yacybot|AISearchBot|IOI|ips-agent|SurveyBot|tagoobot|Netcraft|MJ12bot|dotbot|woriobot|yanga|buzzbot|mlbot|yandexbot|purebot|Linguee Bot|Voyager|CyberPatrol|voilabot|baiduspider|citeseerxbot|spbot|twengabot|postrank|turnitinbot|scribdbot|page2rss|sitebot|linkdex|Adidxbot|blekkobot|ezooms|DuckDuckGo|Mail.RU_Bot|discobot|heritrix|findthatfile|europarchive.org|NerdByNature.Bot|sistrix crawler|ahrefsbot|Aboundex|domaincrawler|wbsearchbot|summify|ccbot|edisterbot|seznambot|ec2linkfinder|gslfbot|aihitbot|intelium_bot|facebookexternalhit|yeti|RetrevoPageAnalyzer|lb-spider|sogou|lssbot|careerbot|wotbox|wocbot|ichiro|DuckDuckBot|lssrocketcrawler|drupact|webcompanycrawler|acoonbot|openindexspider|gnam gnam spider|web-archive-net.com.bot|backlinkcrawler|coccoc|integromedb|content crawler spider|toplistbot|seokicks-robot|it2media-domain-crawler|ip-web-crawler.com|siteexplorer.info|elisabot|proximic|changedetection|blexbot|arabot|WeSEE:Search|niki-bot|CrystalSemanticsBot|rogerbot|360Spider|psbot|InterfaxScanBot|Lipperhey SEO Service|CC Metadata Scaper|g00g1e.net|GrapeshotCrawler|urlappendbot|brainobot|fr-crawler|binlar|SimpleCrawler|Livelapbot|Twitterbot|cXensebot|smtbot|bnf.fr_bot|A6-Indexer|ADmantX|Facebot|Twitterbot|OrangeBot|memorybot|AdvBot|MegaIndex|SemanticScholarBot|ltx71|nerdybot|xovibot|BUbiNG|Qwantify|archive.org_bot|Applebot|TweetmemeBot|crawler4j|findxbot|SemrushBot|yoozBot|lipperhey|y!j-asr|Domain Re-Animator Bot|AddThis)"
			let re = new RegExp(botPattern, 'i')
			// console.log(userAgent)
			// let userAgent = 'Googlebot/2.1 (+http://www.googlebot.com/bot.html)'
			if (!re.test(userAgent)) bot = false
			// console.log('bot '+ bot)
		}
		catch (err) {
			if (err) {
				global._console('error', 'is_bot', __filename, err, false, error_user_id)
				if (global.json_db.console_error === true) { console.log(err) }
			}
		}
		return bot
	}

	/** RegExp **/
	this.word_expression = new RegExp(/^[а-яА-Яa-zA-ZÀ-ÿ0-9а-щА-ЩЬьЮюЯяЇїІіЄєҐґ\/\n/:;.!'"?%&*-+=_,№#$€@\ \-]{1,500}$/)
	this.check_expression_new = new RegExp(/^[а-яА-Яa-zA-ZÀ-ÿ0-9а-щА-ЩЬьЮюЯяЇїІіЄєҐґ\/\n/:;.!'"?%&*-+=_,№#$€@\ \-]{1,500}$/)
	this.check_expression = new RegExp(/^[а-яА-Яa-zA-ZÀ-ÿ0-9а-щА-ЩЬьЮюЯяЇїІіЄєҐґ\/\n/:;.!'"?%&*-+=_,№#$€@\ \-]{1,500}$/)
	this.email_expression = new RegExp(/^[-0-9a-z_\.]+@[-0-9a-z_\.]+\.[a-z]{2,6}$/i)
	this.phone_expression = new RegExp(/^[\(\)\[\]\s\\\/\-0-9\+]{5,50}/i)
	this.phone_pattern = new RegExp(/^((8|0|\+\d{1,2})[\- ]?)?(\(?\d{3}\)?[\- ]?)?[\d\- ]{7,10}$/i)
	this.password_expression = new RegExp(/^[^\s]{8,25}$/)
	this.code_expression = new RegExp(/[0-9]{2}-[0-9]{2}-[0-9]{2}$/)
	this.url_expression = new RegExp(/[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?/gi)

	/** RegExp **/
	this.expression = {
		'en': new RegExp(/^[a-zA-Z]{1,100}$/),
		'ru': new RegExp(/^[а-яА-Яа-щА-ЩЬьЮюЯяЇїІіЄєҐґ]{1,100}$/),
		'password': new RegExp(/^[^\s]{8,25}$/),
		'word': new RegExp(/^[а-яА-Яa-zA-ZÀ-ÿ0-9а-щА-ЩЬьЮюЯяЇїІіЄєҐґ\/\n/:;.!'"?%&*-+=_,№#$€@\ \-]{1,500}$/),
		'check_new': new RegExp(/^[а-яА-Яa-zA-ZÀ-ÿ0-9а-щА-ЩЬьЮюЯяЇїІіЄєҐґ\/\n/:;.!'"?%&*-+=_,№#$€@\ \-]{1,500}$/),
		'check': new RegExp(/^[а-яА-Яa-zA-ZÀ-ÿ0-9а-щА-ЩЬьЮюЯяЇїІіЄєҐґ\/\n/:;.!'"?%&*-+=_,№#$€@\ \-]{1,500}$/),
		'email': new RegExp(/^[-0-9a-z_\.]+@[-0-9a-z_\.]+\.[a-z]{2,6}$/i),
		'phone': new RegExp(/^[\(\)\[\]\s\\\/\-0-9\+]{5,50}/i),
		'phone_pattern': new RegExp(/^((8|0|\+\d{1,2})[\- ]?)?(\(?\d{3}\)?[\- ]?)?[\d\- ]{7,10}$/i),
		'code': new RegExp(/[0-9]{2}-[0-9]{2}-[0-9]{2}$/),
		'url': new RegExp(/[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?/gi),
		'cadnum': new RegExp(/([0-9]{10}):([0-9]{2}):([0-9]{3}):([0-9]{4})/g),
		'url_reg': new RegExp(/(?:(?:https?|ftp|file):\/\/|www\.|ftp\.)(?:\([-A-Z0-9+&@#\/%=~_|$?!:,.]*\)|[-A-Z0-9+&@#\/%=~_|$?!:,.])*(?:\([-A-Z0-9+&@#\/%=~_|$?!:,.]*\)|[A-Z0-9+&@#\/%=~_|$])$/),
		'code_inn': new RegExp(/[0-9]{10}$/),
		'date': new RegExp(/([12]\d{3}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01]))/g),
		'vin_code': new RegExp(/[a-zA-Z0-9]{17}/i)
	}
	
	return this

}
 