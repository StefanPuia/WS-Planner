'use strict';

const utils = require('./utility'); 

module.exports = function(app) {

    //// API ////

    //// DOCUMENTS ////

    // create document
    app.get('/api/document/new', function(req, res) {
        let id = utils.randomStr();
        console.log(id);
        let newdoc = {
            "name": "New Document",
            "id": id,
            "deleted": false,
            "weeks": [{
                "wpe": "",
                "wna": "",
                "str": [{
                    "name": "",
                    "com": [],
                    "res": []
                }]
            }]
        };
        db.documents.push(newdoc);
        res.status(201).json({"id": id});
    })

    // delete document
    app.post('/api/document/delete', function(req, res) {
        let deleted = utils.deleteDoc(db, req.body.docid);
        if (deleted) {
            db = deleted;
            res.sendStatus(200);
        } else {
            res.status(404).json({});;
        }
    })

    //// CONTENT ////

    // get the table
    app.get('/api/table/get', function(req, res) {
        doc = utils.findDoc(db, req.query.doc);
        if (doc) {
            res.status(200).send(utils.makeTable(doc.weeks));
        } else {
            res.status(404).json({});;
        }
    })

    // update content
    app.post('/api/content/update', function(req, res) {
        doc = utils.findDoc(db, req.query.doc);
        if (doc) {
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
        } else {
            res.status(404).json({});;
        }
    })


    //// WEEKS ////

    // create a new week
    app.post('/api/week/new', function(req, res) {
        doc = utils.findDoc(db, req.query.doc);
        if (doc) {
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
        } else {
            res.status(404).json({});;
        }
    })

    // get week
    app.get('/api/week/get', function(req, res) {
        doc = utils.findDoc(db, req.query.doc);
        if (doc) {
            let id = parseInt(req.query.id);
            if (doc.weeks[id]) {
                res.json(doc.weeks[id]);
                res.status(200);
            } else {
                res.status(404).json({});;
            }
        } else {
            res.status(404).json({});;
        }
    })

    // move week up
    app.post('/api/week/up', function(req, res) {
        doc = utils.findDoc(db, req.query.doc);
        if (doc) {
            let data = req.body;
            let i = parseInt(data.id);
            if (i > 0) {
                utils.swap(doc.weeks, i, i - 1);
                utils.swapwpe(doc.weeks, i, i - 1);
                res.sendStatus(200);
            } else {
                res.sendStatus(405)
            }
        } else {
            res.status(404).json({});;
        }
    })

    // move week down
    app.post('/api/week/down', function(req, res) {
        doc = utils.findDoc(db, req.query.doc);
        if (doc) {
            let data = req.body;
            let i = parseInt(data.id);
            if (i < doc.weeks.length - 1) {
                utils.swap(doc.weeks, i, i + 1);
                utils.swapwpe(doc.weeks, i, i + 1);
                res.sendStatus(200);
            } else {
                res.sendStatus(405)
            }
        } else {
            res.status(404).json({});;
        }
    })

    // delete week
    app.post('/api/week/delete', function(req, res) {
        doc = utils.findDoc(db, req.query.doc);
        if (doc) {
            let data = req.body;
            let i = parseInt(data.id);
            doc.weeks.splice(i, 1);
        } else {
            res.status(404).json({});;
        }
    })


    //// PERIOD ////

    // update period
    app.post('/api/period/update', function(req, res) {
        doc = utils.findDoc(db, req.query.doc);
        if (doc) {
            let data = req.body;
            let id = parseInt(data.id.split('_')[2]);

            doc.weeks[id].wpe = utils.getWeekPeriod(data.value);

            res.sendStatus(200);
        } else {
            res.status(404).json({});;
        }
    })


    //// STRUCTURES ////

    //update structures
    app.post('/api/str/update', function(req, res) {
        doc = utils.findDoc(db, req.query.doc);
        if (doc) {
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
        } else {
            res.status(404).json({});;
        }
    })


    //// RESOURCES ////

    // update the resources
    app.post('/api/res/update', function(req, res) {
        doc = utils.findDoc(db, req.query.doc);
        if (doc) {
            let data = req.body;
            let parts = data.id.split('_');
            if (data.res) {
                doc.weeks[parts[2]].str[parts[3]].res = data.res.slice();
            } else {
                doc.weeks[parts[2]].str[parts[3]].res = [].slice();
            }
            res.sendStatus(200);
        } else {
            res.status(404).json({});;
        }
    })

}
