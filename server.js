'use strict';
// server variable -- might get deleted in the future --
const sv = {};
sv.port = 8080;

const express = require('express');
const app = express();

const mysql = require('mysql');
const util = require('./utility');


let db = {
    "planner":
    [
        {
            "wno":1,
            "wpe":"10.11 - 17.11",
            "wna":"AJAX",
            "str":
            [
                {
                    "name": "Lecture: intro to AJAX",
                    "com":
                    [
                        "need to say about ajax stuff",
                        "need to teach ajax"
                    ],
                    "res":
                    [
                        {
                            "name": "Presenatation", 
                            "url": "goo.gl/as2dE"
                        },
                        {
                            "name": "Documentation",
                            "url": "goo.gl/aw23tg"
                        }
                    ]

                },
                {
                    "name": "Practical: Working on AJAX",
                    "com":
                    [
                        "need to show people in practicals how to use ajax"
                    ],
                    "res":
                    [
                        {
                            "name": "GitHub", 
                            "url": "github.com/portsoc/ws_ajax"
                        }
                    ]
                }
            ],
        },
        {
            "wno":2,
            "wpe":"18.11 - 25.11",
            "wna":"Sockets",
            "str":
            [
                {
                    "name": "Practical",
                    "com":
                    [
                        "show people how to use sockets in practicals"
                    ],
                    "res":
                    [
                        {
                            "name": "GitHub",
                            "url": "github.com/portsoc/ws_sockets"
                        }
                    ]
                }
            ]
        }
    ]
};

let table = util.makeTable(db);

console.log(db);
console.log(table);

// set view engine to ejs
app.set('view engine', 'ejs');

// serve static files
app.use('/public', express.static('static'));

// index page
app.get('/', function(req, res) {
    res.render(
    	'pages/index', {
    	table: table
    });
});

// login page
app.get('/login', function(req, res) {
    res.render('pages/index');
});

// listen on port 8080
app.listen(sv.port);
console.log(`server started on port ${sv.port}`);