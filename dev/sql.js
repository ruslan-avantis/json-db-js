const { Parser } = require('node-sql-parser')
const parser = new Parser()

// SELECT
let sql_1 = `
    SELECT title, description, id
    FROM table_name
    WHERE id >= 100 AND id <= 1000 AND description LIKE '%world%'
    ORDER BY title ASC, id DESC
    LIMIT 5 OFFSET 0
`

// INSERT
let sql_2 = `
    INSERT INTO Product (type, model, maker, sss) 
    VALUES ('PC', 1157, 'B', '{"a": 1}')
`

// UPDATE
let sql_3 = `
    UPDATE Customers
    SET ContactName = 'Alfred Schmidt', City= 'Frankfurt'
    WHERE id = 1
`

// DELETE
let sql_4 = `
    DELETE FROM Customers WHERE CustomerName='Alfreds Futterkiste'
`

// WITH
let sql_5 = `
    WITH TestCTE (UserID, Post, ManagerID)
    AS ( SELECT UserID, Post, ManagerID FROM TestTable )
    SELECT * FROM TestCTE
`

// INNER JOIN
let sql_6 = `
    SELECT Orders.OrderID, Customers.CustomerName, Orders.OrderDate
    FROM Orders
    INNER JOIN Customers ON Orders.CustomerID = Customers.CustomerID
`

// LEFT JOIN
let sql_7 = `
    SELECT Orders.OrderID, Customers.CustomerName, Orders.OrderDate
    FROM Orders
    LEFT JOIN Customers ON Orders.CustomerID = Customers.CustomerID
`

// RIGHT JOIN
let sql_8 = `
    SELECT Orders.OrderID, Customers.CustomerName, Orders.OrderDate
    FROM Orders
    RIGHT JOIN Customers ON Orders.CustomerID = Customers.CustomerID
`

// LEFT JOIN
let sql_9 = `
    SELECT c.name AS customer_name, c.id AS customer_id, o.id AS order_id, p.id AS product_id
    FROM Customers AS c
    LEFT JOIN Orders AS o ON c.id = o.customer_id
    LEFT JOIN Products AS p ON p.id = o.product_id
    ORDER BY c.id
`

const ast = parser.astify(sql_9)
console.log(JSON.stringify(ast, null, 2))

/** INSERT --> table[0].table --> sql_2 */
let res_2 = {
    "type": "insert",
    "table": [
      {
        "db": null,
        "table": "Product",
        "as": null
      }
    ],
    "columns": [
      "type",
      "model",
      "maker",
      "sss"
    ],
    "values": [
      {
        "type": "expr_list",
        "value": [
          {
            "type": "string",
            "value": "PC"
          },
          {
            "type": "number",
            "value": 1157
          },
          {
            "type": "string",
            "value": "B"
          },
          {
            "type": "string",
            "value": "{\"a\": 1}"
          }
        ]
      }
    ],
    "partition": null,
    "on_duplicate_update": null
}

/** UPDATE --> table[0].table --> sql_3 */
let res_3 = {
    "type": "update",
    "table": [
      {
        "db": null,
        "table": "Customers",
        "as": null
      }
    ],
    "set": [
      {
        "column": "ContactName",
        "value": {
          "type": "string",
          "value": "Alfred Schmidt"
        },
        "table": null
      },
      {
        "column": "City",
        "value": {
          "type": "string",
          "value": "Frankfurt"
        },
        "table": null
      }
    ],
    "where": {
      "type": "binary_expr",
      "operator": "=",
      "left": {
        "type": "column_ref",
        "table": null,
        "column": "id"
      },
      "right": {
        "type": "number",
        "value": 1
      }
    },
    "orderby": null,
    "limit": null
}

/** DELETE --> table[0].table --> from[0].table --> sql_4 */
let res_4 = {
    "type": "delete",
    "table": [
      {
        "db": null,
        "table": "Customers",
        "as": null,
        "addition": true
      }
    ],
    "from": [
      {
        "db": null,
        "table": "Customers",
        "as": null
      }
    ],
    "where": {
      "type": "binary_expr",
      "operator": "=",
      "left": {
        "type": "column_ref",
        "table": null,
        "column": "CustomerName"
      },
      "right": {
        "type": "string",
        "value": "Alfreds Futterkiste"
      }
    },
    "orderby": null,
    "limit": null
}

/** SELECT --> from[0].table --> sql_1 */
let res_1 = {
    "with": null,
    "type": "select",
    "options": null,
    "distinct": null,
    "columns": [
      {
        "expr": {
          "type": "column_ref",
          "table": null,
          "column": "title"
        },
        "as": null
      },
      {
        "expr": {
          "type": "column_ref",
          "table": null,
          "column": "description"
        },
        "as": null
      },
      {
        "expr": {
          "type": "column_ref",
          "table": null,
          "column": "id"
        },
        "as": null
      }
    ],
    "from": [
      {
        "db": null,
        "table": "table_name",
        "as": null
      }
    ],
    "where": {
      "type": "binary_expr",
      "operator": "AND",
      "left": {
        "type": "binary_expr",
        "operator": "AND",
        "left": {
          "type": "binary_expr",
          "operator": ">=",
          "left": {
            "type": "column_ref",
            "table": null,
            "column": "id"
          },
          "right": {
            "type": "number",
            "value": 100
          }
        },
        "right": {
          "type": "binary_expr",
          "operator": "<=",
          "left": {
            "type": "column_ref",
            "table": null,
            "column": "id"
          },
          "right": {
            "type": "number",
            "value": 1000
          }
        }
      },
      "right": {
        "type": "binary_expr",
        "operator": "LIKE",
        "left": {
          "type": "column_ref",
          "table": null,
          "column": "description"
        },
        "right": {
          "type": "string",
          "value": "%world%"
        }
      }
    },
    "groupby": null,
    "having": null,
    "orderby": [
      {
        "expr": {
          "type": "column_ref",
          "table": null,
          "column": "title"
        },
        "type": "ASC"
      },
      {
        "expr": {
          "type": "column_ref",
          "table": null,
          "column": "id"
        },
        "type": "DESC"
      }
    ],
    "limit": {
      "seperator": "offset",
      "value": [
        {
          "type": "number",
          "value": 5
        },
        {
          "type": "number",
          "value": 0
        }
      ]
    },
    "for_update": null
}

/** SELECT WITH --> from[0].table --> sql_5 */
let res_5 = {
    "with": [
      {
        "name": "TestCTE",
        "stmt": {
          "tableList": [
            "select::null::TestTable",
            "select::null::TestCTE"
          ],
          "columnList": [
            "select::null::UserID",
            "select::null::Post",
            "select::null::ManagerID",
            "select::null::(.*)"
          ],
          "ast": {
            "with": null,
            "type": "select",
            "options": null,
            "distinct": null,
            "columns": [
              {
                "expr": {
                  "type": "column_ref",
                  "table": null,
                  "column": "UserID"
                },
                "as": null
              },
              {
                "expr": {
                  "type": "column_ref",
                  "table": null,
                  "column": "Post"
                },
                "as": null
              },
              {
                "expr": {
                  "type": "column_ref",
                  "table": null,
                  "column": "ManagerID"
                },
                "as": null
              }
            ],
            "from": [
              {
                "db": null,
                "table": "TestTable",
                "as": null
              }
            ],
            "where": null,
            "groupby": null,
            "having": null,
            "orderby": null,
            "limit": null,
            "for_update": null
          }
        },
        "columns": [
          "UserID",
          "Post",
          "ManagerID"
        ]
      }
    ],
    "type": "select",
    "options": null,
    "distinct": null,
    "columns": "*",
    "from": [
      {
        "db": null,
        "table": "TestCTE",
        "as": null
      }
    ],
    "where": null,
    "groupby": null,
    "having": null,
    "orderby": null,
    "limit": null,
    "for_update": null
}

/** SELECT INNER JOIN --> from[0].table --> sql_6 */
let res_6 = {
    "with": null,
    "type": "select",
    "options": null,
    "distinct": null,
    "columns": [
      {
        "expr": {
          "type": "column_ref",
          "table": "Orders",
          "column": "OrderID"
        },
        "as": null
      },
      {
        "expr": {
          "type": "column_ref",
          "table": "Customers",
          "column": "CustomerName"
        },
        "as": null
      },
      {
        "expr": {
          "type": "column_ref",
          "table": "Orders",
          "column": "OrderDate"
        },
        "as": null
      }
    ],
    "from": [
      {
        "db": null,
        "table": "Orders",
        "as": null
      },
      {
        "db": null,
        "table": "Customers",
        "as": null,
        "join": "INNER JOIN",
        "on": {
          "type": "binary_expr",
          "operator": "=",
          "left": {
            "type": "column_ref",
            "table": "Orders",
            "column": "CustomerID"
          },
          "right": {
            "type": "column_ref",
            "table": "Customers",
            "column": "CustomerID"
          }
        }
      }
    ],
    "where": null,
    "groupby": null,
    "having": null,
    "orderby": null,
    "limit": null,
    "for_update": null
}

/** SELECT RIGHT JOIN --> from[0].table --> sql_8 */
let res_8 = {
    "with": null,
    "type": "select",
    "options": null,
    "distinct": null,
    "columns": [
      {
        "expr": {
          "type": "column_ref",   
          "table": "Orders",      
          "column": "OrderID"     
        },
        "as": null
      },
      {
        "expr": {
          "type": "column_ref",   
          "table": "Customers",   
          "column": "CustomerName"
        },
        "as": null
      },
      {
        "expr": {
          "type": "column_ref",   
          "table": "Orders",      
          "column": "OrderDate"   
        },
        "as": null
      }
    ],
    "from": [
      {
        "db": null,
        "table": "Orders",        
        "as": null
      },
      {
        "db": null,
        "table": "Customers",     
        "as": null,
        "join": "RIGHT JOIN",     
        "on": {
          "type": "binary_expr",  
          "operator": "=",        
          "left": {
            "type": "column_ref", 
            "table": "Orders",    
            "column": "CustomerID"
          },
          "right": {
            "type": "column_ref",
            "table": "Customers",
            "column": "CustomerID"
          }
        }
      }
    ],
    "where": null,
    "groupby": null,
    "having": null,
    "orderby": null,
    "limit": null,
    "for_update": null
}

/** SELECT LEFT JOIN --> from[0].table --> sql_9 */
let res_9 = {
    "with": null,
    "type": "select",
    "options": null,
    "distinct": null,
    "columns": [
      {
        "expr": {
          "type": "column_ref",
          "table": "c",
          "column": "name"
        },
        "as": "customer_name"
      },
      {
        "expr": {
          "type": "column_ref",
          "table": "c",
          "column": "id"
        },
        "as": "customer_id"
      },
      {
        "expr": {
          "type": "column_ref",
          "table": "o",
          "column": "id"
        },
        "as": "order_id"
      },
      {
        "expr": {
          "type": "column_ref",
          "table": "p",
          "column": "id"
        },
        "as": "product_id"
      }
    ],
    "from": [
      {
        "db": null,
        "table": "Customers",
        "as": "c"
      },
      {
        "db": null,
        "table": "Orders",
        "as": "o",
        "join": "LEFT JOIN",
        "on": {
          "type": "binary_expr",
          "operator": "=",
          "left": {
            "type": "column_ref",
            "table": "c",
            "column": "id"
          },
          "right": {
            "type": "column_ref",
            "table": "o",
            "column": "customer_id"
          }
        }
      },
      {
        "db": null,
        "table": "Products",
        "as": "p",
        "join": "LEFT JOIN",
        "on": {
          "type": "binary_expr",
          "operator": "=",
          "left": {
            "type": "column_ref",
            "table": "p",
            "column": "id"
          },
          "right": {
            "type": "column_ref",
            "table": "o",
            "column": "product_id"
          }
        }
      }
    ],
    "where": null,
    "groupby": null,
    "having": null,
    "orderby": [
        {
            "expr": {
                "type": "column_ref",
                "table": "c",
                "column": "id"
            },
            "type": "ASC"
        }
    ],
    "limit": null,
    "for_update": null
}
