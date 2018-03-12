'use strict';

const express = require('express');
const app = express();

const config = require('./../config');
const utils = require('./utility');

module.exports = app;

// set view engine to ejs   
app.set('view engine', 'ejs');
app.set('views', config.views);

// serve static files
app.use(config.staticRouted, express.static(config.staticFiles));

// log all requests to console
app.use('/', (req, res, next) => {
    let ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    if (ip.substr(0, 7) == "::ffff:") {
        ip = ip.substr(7)
    }
    if(config.verbose) console.log(new Date(), ip, req.method, req.url);
    next();
});

/**
 * GET /
 * serve landing page
 */
app.get('/', function(req, res) {
    res.status(200).render('index');
});

/**
 * GET /login
 * serve the login page
 */
app.get('/login', function(req, res) {
    res.status(200).render('login')
})

/**
 * GET /doc/:docid
 * serve the document page
 * @param  {String} docid the document key
 */
app.get('/doc/:docid', function(req, res) {
    res.status(200).render('planner');
});

/**
 * GET /docview/:docid
 * serve the document as a portrait view
 * @param  {String} docid the document key
 */
app.get('/doc/:docid/view', function(req, res) {
	res.status(200).render('document');
})