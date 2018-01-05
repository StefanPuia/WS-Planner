'use strict';
// server variable -- PROVISIONAL --
const sv = {};
sv.port = 8080;
sv.message = "Server started on port " + sv.port;



// define and initialise required packages 
const http = require('http');

const express = require('express');
const app = express();
// set view engine to ejs
app.set('view engine', 'ejs');
// serve static files
app.use('/public', express.static('static'));

const mysql = require('mysql');
const fs = require('fs');
const validator = require('validator');

// web socket server
const WebSocket = require('ws');
const server = http.createServer();
const wss = new WebSocket.Server({
    server: server,
});

server.on('request', app);
wss.on('connection', function connection(ws) {
    // error handling WIP
    ws.on('error', () => console.log('errored'));
    // broadcast
    ws.on('message', function incoming(message) {
        message = JSON.parse(message);
        console.log(message);
        if(message.action == "update") {
            if(message.payload.value) {
                let data = JSON.stringify({
                    payload: message.payload
                });
                //ws.send(data);
                wss.clients.forEach(function each(client) {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(data);
                    }
                });
            }
        }
    });
});

// body parser for json
const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

// define required local packages
const utils = require('./utility');

// database -- PROVISIONAL -- 
let db = JSON.parse(fs.readFileSync('./server/db.json', 'utf8'));









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
    db.planner.push(blankweek);
    res.redirect('/');
})

// update the resources
app.post('/api/res/update', function(req, res) {
    let data = req.body;
    let parts = data.id.split('_');
    if (data.res) {
        db.planner[parts[2]].str[parts[3]].res = data.res.slice();
    } else {
        db.planner[parts[2]].str[parts[3]].res = [].slice();
    }
    res.sendStatus(200);
})

// move week up
app.post('/api/week/up', function(req, res) {
    let data = req.body;
    let i = parseInt(data.id);
    if (i > 0) {
        utils.swap(db.planner, i, i - 1);
        utils.swapwpe(db.planner, i, i - 1);
        res.sendStatus(200);
    } else {
        res.sendStatus(405)
    }
})

// move week down
app.post('/api/week/down', function(req, res) {
    let data = req.body;
    let i = parseInt(data.id);
    if (i < db.planner.length - 1) {
        utils.swap(db.planner, i, i + 1);
        utils.swapwpe(db.planner, i, i + 1);
        res.sendStatus(200);
    } else {
        res.sendStatus(405)
    }
})

// delete week
app.post('/api/week/delete', function(req, res) {
    let data = req.body;
    let i = parseInt(data.id);
    db.planner.splice(i, 1);
})

// get week
app.get('/api/week/get', function(req, res) {
    let id = parseInt(req.query.id);
    if (db.planner[id]) {
        res.json(db.planner[id]);
        res.status(200);
    } else {
        res.sendStatus(404);
    }

})

//update structures
app.post('/api/str/update', function(req, res) {
    let data = req.body;
    let id = parseInt(data.id);
    let week = db.planner[id];
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

    db.planner[id].str = newWeek.slice();
    res.sendStatus(200);
})

// update content
app.post('/api/content/update', function(req, res) {
    let data = req.body;
    let content = validator.escape(data.value);
    let parts = validator.escape(data.id).split('_');
    switch (parts[1]) {
        case 'wna':
            if (validator.isNumeric(parts[2])) {
                if (db.planner[parts[2]]) {
                    db.planner[parts[2]].wna = content;
                }
            }
            break;
        case 'str':
            if (validator.isNumeric(parts[2]) && validator.isNumeric(parts[3])) {
                if (db.planner[parts[2]] && db.planner[parts[2]].str[parts[3]]) {
                    db.planner[parts[2]].str[parts[3]].name = content;
                }
            }
            break;
        case 'com':
            if (validator.isNumeric(parts[2]) && validator.isNumeric(parts[3])) {
                if (db.planner[parts[2]] && db.planner[parts[2]].str[parts[3]]) {
                    db.planner[parts[2]].str[parts[3]].com = content.split('\n');
                }
            }
            break;
    }
})


// update period
app.post('/api/period/update', function(req, res) {
    let data = req.body;
    let id = parseInt(data.id);
    let startDate = new Date(data.date);
    let endDate = new Date(data.date);
    endDate.setDate(endDate.getDate() + 6)
    let f = {
        "sd": startDate.getDate(),
        "sm": startDate.getMonth() + 1,
        "sy": startDate.getFullYear(),
        "ed": endDate.getDate(),
        "em": endDate.getMonth() + 1,
        "ey": endDate.getFullYear()
    }
    let content = `${f.sd}/${f.sm} - ${f.ed}/${f.em}`;
    db.planner[id].wpe = content;

    res.sendStatus(200);
})




// listen on port 8080
server.listen(sv.port, function () { console.log(sv.message); });