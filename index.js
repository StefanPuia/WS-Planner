'use strict';

let defaultPort = 8080;



// database connection
// const mysql = require('mysql');
// const mysql_conn = mysql.createConnection({
//   host     : 'localhost',
//   user     : 'root',
//   password : 'root',
//   database : 'planner'
// });
    

const utils = require('./app/utility');

const express = require('./app/express');
express.start();
const app = express.getApp();

const api = require('./app/api.js')(app);

const wsocket = require('./app/wsocket.js');
wsocket.broadcast(app);
const server = wsocket.getServer();




// listen
server.listen(defaultPort, function() {
    console.log(`Listening on ${defaultPort}.`);
});