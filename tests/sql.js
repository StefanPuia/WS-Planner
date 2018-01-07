'use strict';

var mysql      = require('mysql');
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : 'root',
  database : 'planner'
});
 



let weeks = findInDb('document', '1', 'user');

async function findInDb(table, id, ref='') {
	let data = null;

	connection.connect();
 
	connection.query(`SELECT * FROM ${table} where ${ref}id='${id}'`, function (error, results) {
		if (error) throw error;
		console.log(results);
	    data = results;
	});
	connection.end();
	connection.connect();

	connection.query(`SELECT * FROM week where documentid=${data.id}`, function(error, results) {
    	if(error) throw error;
    	data = results;
    	console.log(data);
    })
	 
	
	connection.end();
	return data;
}

console.log(weeks);