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
let db = JSON.parse(fs.readFileSync('./server/db.json', 'utf8'));
let doc;


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
    if(req.query.doc) {
        doc = utils.findDoc(db, req.query.doc);
        if(doc !== false) {
            console.log(doc);
            res.render(
                'pages/index', {
                    table: utils.makeTable(doc.weeks)
                });
        }
        else {
            res.status(404).render('pages/404');;
        }
    }
    else {
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


//// API ////

// get the table
app.get('/api/table/get', function(req, res) {
    doc = utils.findDoc(db, req.query.doc);
    if(doc) {
        res.status(200).send(utils.makeTable(doc.weeks));
    }
    else {
        res.status(404).json({});;
    }
})

// update content
app.post('/api/content/update', function(req, res) {
    doc = utils.findDoc(db, req.query.doc);
    if(doc) {
        let data = req.body;
        let content = validator.escape(data.value);
        let parts = validator.escape(data.id).split('_');
        switch (parts[1]) {
            case 'wna':
                if (validator.isNumeric(parts[2])) {
                    if (doc.weeks[parts[2]]) {
                        doc.weeks[parts[2]].wna = content;
                    }
                }
                break;
            case 'str':
                if (validator.isNumeric(parts[2]) && validator.isNumeric(parts[3])) {
                    if (doc.weeks[parts[2]] && doc.weeks[parts[2]].str[parts[3]]) {
                        doc.weeks[parts[2]].str[parts[3]].name = content;
                    }
                }
                break;
            case 'com':
                if (validator.isNumeric(parts[2]) && validator.isNumeric(parts[3])) {
                    if (doc.weeks[parts[2]] && doc.weeks[parts[2]].str[parts[3]]) {
                        doc.weeks[parts[2]].str[parts[3]].com = content.split('\n');
                    }
                }
                break;
        }
    }
    else {
        res.status(404).json({});;
    }
})


//// WEEKS ////

// create a new week
app.post('/api/week/new', function(req, res) {
    doc = utils.findDoc(db, req.query.doc);
    if(doc) {
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
        doc.weeks.push(blankweek);
        res.sendStatus(200);
    }
    else {
        res.status(404).json({});;
    }
})

// get week
app.get('/api/week/get', function(req, res) {
    doc = utils.findDoc(db, req.query.doc);
    if(doc) {
        let id = parseInt(req.query.id);
        if (doc.weeks[id]) {
            res.json(doc.weeks[id]);
            res.status(200);
        } else {
            res.status(404).json({});;
        }
    }
    else {
        res.status(404).json({});;
    }
})

// move week up
app.post('/api/week/up', function(req, res) {
    doc = utils.findDoc(db, req.query.doc);
    if(doc) {
        let data = req.body;
        let i = parseInt(data.id);
        if (i > 0) {
            utils.swap(doc.weeks, i, i - 1);
            utils.swapwpe(doc.weeks, i, i - 1);
            res.sendStatus(200);
        } else {
            res.sendStatus(405)
        }
    }
    else {
        res.status(404).json({});;
    }
})

// move week down
app.post('/api/week/down', function(req, res) {
    doc = utils.findDoc(db, req.query.doc);
    if(doc) {
        let data = req.body;
        let i = parseInt(data.id);
        if (i < doc.weeks.length - 1) {
            utils.swap(doc.weeks, i, i + 1);
            utils.swapwpe(doc.weeks, i, i + 1);
            res.sendStatus(200);
        } else {
            res.sendStatus(405)
        }
    }
    else {
        res.status(404).json({});;
    }
})

// delete week
app.post('/api/week/delete', function(req, res) {
    doc = utils.findDoc(db, req.query.doc);
    if(doc) {
        let data = req.body;
        let i = parseInt(data.id);
        doc.weeks.splice(i, 1);
    }
    else {
        res.status(404).json({});;
    }
})


//// PERIOD ////

// update period
app.post('/api/period/update', function(req, res) {
    doc = utils.findDoc(db, req.query.doc);
    if(doc) {
        let data = req.body;
        let id = parseInt(data.id.split('_')[2]);

        doc.weeks[id].wpe = utils.getWeekPeriod(data.value);

        res.sendStatus(200);
    }
    else {
        res.status(404).json({});;
    }
})


//// STRUCTURES ////

//update structures
app.post('/api/str/update', function(req, res) {
    doc = utils.findDoc(db, req.query.doc);
    if(doc) {
        let data = req.body;
        let id = parseInt(data.id);
        let week = doc.weeks[id];
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

        doc.weeks[id].str = newWeek.slice();
        res.sendStatus(200);
    }
    else {
        res.status(404).json({});;
    }
})


//// RESOURCES ////

// update the resources
app.post('/api/res/update', function(req, res) {
    doc = utils.findDoc(db, req.query.doc);
    if(doc) {
        let data = req.body;
        let parts = data.id.split('_');
        if (data.res) {
            doc.weeks[parts[2]].str[parts[3]].res = data.res.slice();
        } else {
            doc.weeks[parts[2]].str[parts[3]].res = [].slice();
        }
        res.sendStatus(200);
    }
    else {
        res.status(404).json({});;
    }
})






// listen
server.listen(sv.port, function() {
    console.log(sv.message);
});