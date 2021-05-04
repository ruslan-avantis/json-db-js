
// SQL String
const sql_string2 = `SELECT a.name
FROM (
	SELECT *, (price*quantity) AS new
	FROM Products
	ORDER BY new DESC, name ASC
	LIMIT 1
	OFFSET 0
) AS a`

const sql_string = `
    SELECT k.*,
        IF (
            k.LAST_PUBLISH_TOTAL_COUNT > 0,
            ROUND((k.RISE_PUBLISH_TOTAL_COUNT / k.LAST_PUBLISH_TOTAL_COUNT) * 100, 2),
            0
        ) RELATIVE_PUBLISH_RATIO,
        IF (
            k.LAST_PROJECT_COUNT > 0,
            ROUND((k.RISE_PROJECT_COUNT / k.LAST_PROJECT_COUNT) * 100, 2),
            0
        ) RELATIVE_PROJECT_RATIO,
        IF (
          k.LAST_COMMON_COUNT > 0,
          ROUND((k.RISE_COMMON_COUNT / k.LAST_COMMON_COUNT) * 100, 2),
          0
      ) RELATIVE_COMMON_RATIO
      FROM (
            SELECT
                m.ORG_NAME,
                IFNULL(n.LAST_PUBLISH_TOTAL_COUNT, 0) LAST_PUBLISH_TOTAL_COUNT,
                IFNULL(n.LAST_PROJECT_COUNT, 0) LAST_PROJECT_COUNT,
                IFNULL(n.LAST_COMMON_COUNT, 0) LAST_COMMON_COUNT,
                m.PUBLISH_TOTAL_COUNT,
                m.PROJECT_COUNT,
                m.COMMON_COUNT,
                IFNULL(m.PUBLISH_TOTAL_COUNT - n.LAST_PUBLISH_TOTAL_COUNT, 0) RISE_PUBLISH_TOTAL_COUNT,
                IFNULL(m.PROJECT_COUNT - n.LAST_PROJECT_COUNT, 0) RISE_PROJECT_COUNT,
                IFNULL(m.COMMON_COUNT - n.LAST_COMMON_COUNT, 0) RISE_COMMON_COUNT
            FROM
                (
                    SELECT
                        'c' AS ORG_NAME,
                        SUM(PUBLISH_TOTAL_COUNT) AS PUBLISH_TOTAL_COUNT,
                        SUM(PROJECT_COUNT) AS PROJECT_COUNT,
                        SUM(COMMON_COUNT) AS COMMON_COUNT
                    FROM
                        SE_STAT_ORG
                    WHERE
                        DATE_FORMAT(RECORD_DATE, '%Y-%m') = '2012-07'
                ) m
            LEFT JOIN (
                SELECT
                    'c' AS ORG_NAME,
                    SUM(PUBLISH_TOTAL_COUNT) AS LAST_PUBLISH_TOTAL_COUNT,
                    SUM(PROJECT_COUNT) AS LAST_PROJECT_COUNT,
                    SUM(COMMON_COUNT) AS LAST_COMMON_COUNT
                FROM
                    SE_STAT_ORG
                WHERE
                    DATE_FORMAT(RECORD_DATE, '%Y-%m') = '2012-06'
            ) n ON m.ORG_NAME = n.ORG_NAME
        ) k
`

const sqlParser = require('js-sql-parser')
const ast = sqlParser.parse(sql_string)
console.log('js-sql-parser: ', JSON.stringify(ast, null, 2))
//ast.value.selectItems.value[0].value = 'foo'
//ast.value.from.value[0].value.value.value = 'bar'
//console.log(sqlParser.stringify(ast))
// SELECT foo FROM bar

// import Parser for all databases
const { Parser } = require('node-sql-parser')
const parser = new Parser()
const ast2 = parser.astify(sql_string) // mysql sql grammer parsed by default
console.log('node-sql-parser: ', JSON.stringify(ast2, null, 2))