//// WEB SOCKET HANDLING ////

const validator = require('validator');
const http = require('http');

// web socket server
const WebSocket = require('ws');
const server = http.createServer();
const wss = new WebSocket.Server({
    server: server,
});

const utils = require('./utility');
const sv = {clients: []};

module.exports.getServer = function() {
    return server;
}


module.exports.broadcast = function(app) {


    server.on('request', app);

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
}