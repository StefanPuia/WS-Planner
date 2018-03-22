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
                // insert a new block
                case 'insert':
                    payload = {
                        type: 'insert',
                        docid: data.docid,
                        parent: config.blocks[data.block].parent,
                        parentid: data.parentid,
                        block: data.block
                    }

                    switch(data.block) {
                        case 'week':
                            util.insertWeek(data.parentid, function(response) {
                                payload.weeks = response;
                                sendAll(payload);
                            })
                            break;

                        case 'structure':
                            util.insertStructure(data.parentid, function(response) {
                                payload.structures = response;
                                sendAll(payload);
                            })
                            break;

                        case 'resource':
                            util.insertResource(data.parentid, function(response) {
                                payload.resources = response;
                                sendAll(payload);
                            })
                            break;
                    }
                    break;

                // update a block
                case 'update':
                    let field = data.property;
                    let conditions = ['id', data.id, config.blocks[data.block].parent + 'id', data.parentid];

                    util.updateBlock(data.block, field, data.value, conditions, function(results) {
                        sendAll(data);
                    })
                    break;

                // move a block
                case 'move':
                    // same parent
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
                    // different parent
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

                // delete a block
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

/**
 * broadcast to all connected hosts with the same document key, including sender
 * @param  {Object} data
 */
function sendAll(data) {
    sv.clients.forEach(function(client) {
        if (client.readyState === WebSocket.OPEN && client.docid == data.docid) {
            client.send(JSON.stringify(data));
        }
    });
}