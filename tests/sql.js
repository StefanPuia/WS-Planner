'use strict';

var mysql = require('mysql');
var connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'planner'
});

let data = null;

async function getinfo(callback) {
	connection.connect();

	await connection.query(`SELECT * FROM document`, function(error, results) {
        if (error) {
        	throw error;
        }
        return callback(results);
    });

	connection.end();
}

function run() {
	getinfo(async function(results) {
		let data = results[0];
		console.log(data.id);
	})
}

run();
