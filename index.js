'use strict';

// load the local modules
const config = require('./app/config');

// load the express routes
const express = require('./app/core/express');

// load the express api
const api = require('./app/core/api')(express);

// load the websocket module
const wsserver = require('./app/core/wsocket')(express);


// start listening on the specified port
wsserver.listen(config.serverPort, function() {
    console.log(`Listening on ${config.serverPort}.`);
});


