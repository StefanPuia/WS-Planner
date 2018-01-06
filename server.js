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

const mysql = require('mysql');
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
let planner = JSON.parse(fs.readFileSync('./server/db.json', 'utf8'));
let db = planner.planner;


//// WEB SOCKET HANDLING ////


// establish connection
wss.on('connection', function connection(ws, req) {
    // add client to the array
    ws.sessionid = utils.randomStr(16);
    sv.clients.push(ws);

    // error handling WIP
    ws.on('error', () => {});

    // listen for messages
    ws.on('message', function incoming(message) {
        let data = JSON.parse(message);
        console.log(data);

        let sessionid = data.sessionid;
        delete data.sessionid;

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
        //ws.send(JSON.stringify(data));

        console.log(data);

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
    res.render(
        'pages/index', {
            table: utils.makeTable(db)
        });
});

// login
app.get('/login', function(req, res) {
    res.render('pages/index');
});


//// API ////

// get the table
app.get('/api/table/get', function(req, res) {
    res.send(utils.makeTable(db));
    res.status(200);
})

// update content
app.post('/api/content/update', function(req, res) {
    let data = req.body;
    let content = validator.escape(data.value);
    let parts = validator.escape(data.id).split('_');
    switch (parts[1]) {
        case 'wna':
            if (validator.isNumeric(parts[2])) {
                if (db[parts[2]]) {
                    db[parts[2]].wna = content;
                }
            }
            break;
        case 'str':
            if (validator.isNumeric(parts[2]) && validator.isNumeric(parts[3])) {
                if (db[parts[2]] && db[parts[2]].str[parts[3]]) {
                    db[parts[2]].str[parts[3]].name = content;
                }
            }
            break;
        case 'com':
            if (validator.isNumeric(parts[2]) && validator.isNumeric(parts[3])) {
                if (db[parts[2]] && db[parts[2]].str[parts[3]]) {
                    db[parts[2]].str[parts[3]].com = content.split('\n');
                }
            }
            break;
    }
})


//// WEEKS ////

// create a new week
app.post('/api/week/new', function(req, res) {
    let blankweek = {
        "wpe": "",
        "wna": "",
        "str": [{
            "name": "",
            "com": [""],
            "res": [{
                "name": "",
                "url": ""
            }]
        }]
    }
    db.push(blankweek);
    res.redirect('/');
})

// get week
app.get('/api/week/get', function(req, res) {
    let id = parseInt(req.query.id);
    if (db[id]) {
        res.json(db[id]);
        res.status(200);
    } else {
        res.sendStatus(404);
    }
})

// move week up
app.post('/api/week/up', function(req, res) {
    let data = req.body;
    let i = parseInt(data.id);
    if (i > 0) {
        utils.swap(db, i, i - 1);
        utils.swapwpe(db, i, i - 1);
        res.sendStatus(200);
    } else {
        res.sendStatus(405)
    }
})

// move week down
app.post('/api/week/down', function(req, res) {
    let data = req.body;
    let i = parseInt(data.id);
    if (i < db.length - 1) {
        utils.swap(db, i, i + 1);
        utils.swapwpe(db, i, i + 1);
        res.sendStatus(200);
    } else {
        res.sendStatus(405)
    }
})

// delete week
app.post('/api/week/delete', function(req, res) {
    let data = req.body;
    let i = parseInt(data.id);
    db.splice(i, 1);
})


//// PERIOD ////

// update period
app.post('/api/period/update', function(req, res) {
    let data = req.body;
    let id = parseInt(data.id.split('_')[2]);

    db[id].wpe = utils.getWeekPeriod(data.value);

    res.sendStatus(200);
})


//// STRUCTURES ////

//update structures
app.post('/api/str/update', function(req, res) {
    let data = req.body;
    let id = parseInt(data.id);
    let week = db[id];
    let str = data.str;
    let lastid = 0;
    let newWeek = [];
    for (let i = 0; i < str.length; i++) {
        let strid = parseInt(str[i].id.split('_')[1]);
        str[i].id = strid;
    }

    for (let i = 0; i < week.str.length; i++) {
        for (let j = 0; j < str.length; j++) {
            if (str[j].id == i) {
                week.str[i].name = str[j].name;
                newWeek.push(week.str[i]);
                str.splice(j, 1);
            }
        }
    }

    for (let j = 0; j < str.length; j++) {
        let item = {};
        item.name = str[j].name;
        item.com = [];
        item.res = [];
        newWeek.push(item);
    }

    db[id].str = newWeek.slice();
    res.sendStatus(200);
})


//// RESOURCES ////

// update the resources
app.post('/api/res/update', function(req, res) {
    let data = req.body;
    let parts = data.id.split('_');
    if (data.res) {
        db[parts[2]].str[parts[3]].res = data.res.slice();
    } else {
        db[parts[2]].str[parts[3]].res = [].slice();
    }
    res.sendStatus(200);
})






// listen
server.listen(sv.port, function() {
    console.log(sv.message);
});