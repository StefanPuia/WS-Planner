const express = require('express');
const app = express();

const config = require('./config');
const utils = require('./utility');

module.exports.getApp = function() {
    return app;
}

module.exports.start = function() {
    // set view engine to ejs   
    app.set('view engine', 'ejs');
    // serve static files
    app.use('/static', express.static('static'));

    //// SERVE PAGES ////
    app.use('/', express.static('public/', { extensions: ['html'] }));
}
