const fs = require('fs');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');

const utils = require('./utility');


module.exports.getApp = function() {
    return app;
}

module.exports.start = function() {
    // database -- PROVISIONAL -- 
    let db = JSON.parse(fs.readFileSync('./server/backup.json', 'utf8'));
    // let db = utils.runQuery(mysql_conn, 'SELECT * FROM document');
    let doc;


    // set view engine to ejs   
    app.set('view engine', 'ejs');
    // serve static files
    app.use('/public', express.static('static'));


    // json parser for http requests

    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({
        extended: true
    }));

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

    return app;
}
