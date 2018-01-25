'use strict';

var mysql      = require('mysql');
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : 'root',
  database : 'planner'
});
 

let data = null;

function findInDb(data, callback) {
	connection.connect();
 
	connection.query(`SELECT * FROM document`, function (error, results) {
		if (error) throw error;
		callback(results);
	});
	connection.end();
	 
	
	connection.end();
	return data;
}

findInDb('', function(results) {
	data = results;
})