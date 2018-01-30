'use strict';
// server variable
const sv = {};
sv.port = 8080;
sv.message = "Server started on port " + sv.port;
sv.clients = [];


// define and initialise required packages 
const express = require('express');
const app = express();
// set view engine to ejs   
app.set('view engine', 'ejs');
// serve static files
app.use('/public', express.static('static'));

// database connection
const mysql = require('mysql');
const mysql_conn = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : 'root',
  database : 'planner'
});
    
const fs = require('fs');
const validator = require('validator');
const http = require('http');

// web socket server
const WebSocket = require('ws');
const server = http.createServer();
const wss = new WebSocket.Server({
    server: server,
});
server.on('request', app);

// json parser for http requests
const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

// define required local packages
const utils = require('./utility');

// database -- PROVISIONAL -- 
let db = JSON.parse(fs.readFileSync('./server/backup.json', 'utf8'));
// let db = utils.runQuery(mysql_conn, 'SELECT * FROM document');
let doc;


//// WEB SOCKET HANDLING ////


// establish connection
wss.on('connection', function connection(ws, req) {
    // add client to the array
    ws.sessionid = utils.randomStr();
    sv.clients.push(ws);

    // error handling WIP
    ws.on('error', () => {});

    // listen for messages
    ws.on('message', function incoming(message) {
        let data = JSON.parse(message);

        let sessionid = data.sessionid;
        delete data.sessionid;
        doc = utils.findDoc(db, data.documentid);
        delete data.documentid;

        switch (data.type) {
            case 'wna':
            case 'str':
            case 'com':
                if (data.value) {
                    data.value = validator.escape(data.value);
                }
                break;

            case 'wpe':
                data.value = utils.getWeekPeriod(data.value);
                break;

            case 'res':
                data.value = utils.listify(data.res);
                data.res = undefined;
                break;

            case 'conn':
                ws.send(JSON.stringify({
                    "type": "sessionid",
                    "value": ws.sessionid
                }));
                break;
        }

        // self send
        // ws.send(JSON.stringify(data));

        // broadcast to all connected hosts, including sender
        if (data.value != "") {
            sv.clients.forEach(function(client) {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify(data));
                }
            });
        }
    });
});


//// SERVE PAGES ////

// index
app.get('/', function(req, res) {
    if (req.query.doc) {
        doc = utils.findDoc(db, req.query.doc);
        if (doc !== false) {
            res.render(
                'pages/index', {
                    table: utils.makeTable(doc.weeks),
                    doc: doc
                });
        } else {
            res.status(404).render('pages/404');;
        }
    } else {
        res.status(200).render('pages/userdocs', {
            documents: utils.makeDocs(db)
        });
    }
});

// login
app.get('/login', function(req, res) {
    res.render('pages/login');
});

app.post('/user/login', function(req, res) {
    res.json(req.body);
})



const api = require('./app/api.js')(app);





// listen
server.listen(sv.port, function() {
    console.log(sv.message);
});