//// WEB SOCKET HANDLING ////

const validator = require('validator');
const http = require('http');

// web socket server
const WebSocket = require('ws');
const server = http.createServer();
const wss = new WebSocket.Server({
    server: server,
});

const config = require('./../config');
const util = require('./utility');
const sv = {clients: []};

module.exports = function(app) {
    server.on('request', app);

    // establish connection
    wss.on('connection', function connection(ws, req) {
        ws.docid = req.url.split('/').slice(-1).pop();
        sv.clients.push(ws);

        // error handling WIP
        ws.on('error', (err) => {});

        // listen for messages
        ws.on('message', function incoming(message) {
            let data = JSON.parse(message);
            if(config.verbose) console.log(new Date(), "WS Recieved: ", data);
            let payload = {};

            switch(data.type) {
                case 'insert':
                    let parts = data.id.split('_');

                    switch(parts[1]) {
                        case 'weeks':
                            payload = {
                                type: 'insert',
                                docid: data.docid,
                                parent: 'document',
                                parentid: data.docid,
                                block: 'weeks'
                            }

                            util.insertWeek(data.docid, function(response) {
                                payload.weeks = response;
                                sendAll(payload);
                            })
                            break;

                        case 'structures':
                            payload = {
                                type: 'insert',
                                docid: data.docid,
                                parent: 'week',
                                parentid: parts[2],
                                block: 'structures'
                            }
                            util.insertStructure(parts[2], function(response) {
                                payload.structures = response;
                                sendAll(payload);
                            })
                            break;

                        case 'resources':
                            payload = {
                                type: 'insert',
                                docid: data.docid,
                                parent: 'structure',
                                parentid: parts[2],
                                block: 'resources'
                            }
                            util.insertResource(parts[2], function(response) {
                                payload.resources = response;
                                sendAll(payload);
                            })
                            break;
                    }
                    break;

                case 'update':
                    let field = '';
                    let conditions = [];
                    switch(data.block+data.property) {
                        case 'weekname':
                            field = 'name';
                            conditions = ['id', data.id, 'documentid', data.docid];
                            break;

                        case 'structurename':
                            field = 'name';
                            conditions = ['id', data.id, 'weekid', data.parentid];
                            break;

                        case 'structurecomments':
                            field = 'comments';
                            conditions = ['id', data.id, 'weekid', data.parentid];
                            break;

                        case 'resourcename':
                            field = 'name';
                            conditions = ['id', data.id, 'structureid', data.parentid];
                            break;

                        case 'resourceurl':
                            field = 'url';
                            conditions = ['id', data.id, 'structureid', data.parentid];
                            break;

                        case 'documentname':
                            field = 'name';
                            conditions = ['id', data.id, 'id', data.id];
                            break;
                    }
                    util.updateBlock(data.block, field, data.value, conditions, function(results) {
                        sendAll(data);
                    })
                    break;

                case 'move':
                    if(data.prevparentid == data.currparentid) {
                        if(data.prevpos < data.currpos) {
                            util.moveBlockDown(data.block, data.id, data.prevpos, data.currpos, data.currparentid, function() {
                                sendAll(data);
                            })
                        }
                        else if(data.prevpos > data.currpos){
                            util.moveBlockUp(data.block, data.id, data.prevpos, data.currpos, data.currparentid, function() {
                                sendAll(data);
                            })
                        }
                    }
                    else {
                        util.moveToNewParent(data.block, data.id, data.currparentid, function(results) {
                            if(data.prevpos < data.currpos) {
                                util.moveBlockDown(data.block, data.id, data.prevpos, data.currpos, data.currparentid, function() {
                                    sendAll(data);
                                })
                            }
                            else if(data.prevpos > data.currpos){
                                util.moveBlockUp(data.block, data.id, data.prevpos, data.currpos, data.currparentid, function() {
                                    sendAll(data);
                                })
                            }
                        })
                    }
                    break;

                case 'delete':
                    util.deleteBlock(data.block, data.id, data.parent, data.parentid, data.position, function(results) {
                        sendAll(data);
                    })
                    break;
            }
        });
    });

    return server;
}

// broadcast to all connected hosts with the same document key, including sender
function sendAll(data) {
    sv.clients.forEach(function(client) {
        if (client.readyState === WebSocket.OPEN && client.docid == data.docid) {
            client.send(JSON.stringify(data));
        }
    });
}