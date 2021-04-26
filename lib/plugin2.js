class Test2 {

    constructor() {

    }

    test(i = null) {
        return i
    }

    arrayValues(input) {
		// example 1: array_values( {firstname: 'Kevin', surname: 'van Zonneveld'} )
		// returns 1: [ 'Kevin', 'van Zonneveld' ]
		let tmpArr = [], key = ''
		for (key in input) {
			tmpArr[tmpArr.length] = input[key]
		}
		return tmpArr
	}
}

module.exports = Test2