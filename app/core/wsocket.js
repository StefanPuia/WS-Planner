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
            let conditions = [];

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

                    util.insertChild(payload.parent, payload.parentid, function(response) {
                        payload[payload.block + 's'] = response;
                        sendAll(payload);
                    })
                    break;

                // update a block
                case 'update':
                    let field = data.property;
                    conditions = ['id', data.id, config.blocks[data.block].parent + 'id', data.parentid];

                    util.updateBlock(data.block, field, data.value, conditions, function(results) {
                        sendAll(data);
                    })
                    break;

                // move a block
                case 'move':
                    conditions = ['id', data.id, data.parent + 'id', data.prevparentid]
                    util.updateBlock(data.block, data.parent + 'id', data.currparentid, conditions, function(results) {
                        // check if the previous parent still has children, if not insert one
                        util.getChildren(data.parent, data.prevparentid, function(siblings) {                        
                            if(siblings.length == 0) {
                                util.insertChild(data.parent, data.prevparentid, function(children) {
                                    payload = {
                                        type: 'insert',
                                        docid: data.docid,
                                        parent: data.parent,
                                        parentid: data.prevparentid,
                                        block: data.block,
                                    }
                                    payload[data.block + 's'] = children;
                                    sendAll(payload);
                                    sendAll(data);
                                })
                            }
                            else {
                                sendAll(data);
                            }
                        })
                    })
                    break;

                // reorder the weeks
                case 'reorderweeks':
                    // check if the positions and ids are unique and integers
                    let char_pos = [];
                    let char_id = [];
                    let validpositions = true;
                    let validids = true;
                    for(let i = 0; i < data.positions.length; i++) {
                        if(char_pos[data.positions[i].position] || isNaN(parseInt(data.positions[i].position)) ||
                            char_id[data.positions[i].id] || isNaN(parseInt(data.positions[i].id))) {
                            validpositions = false;
                        }
                        else {
                            char_pos[data.positions[i].position] = 1;
                            char_id[data.positions[i].id] = 1;

                        }
                    }

                    // check if positions are consecutive
                    for(let i = 0; i < char_pos.length; i++) {
                        if(!char_pos[i]) {
                            validpositions = false;
                        }
                    }

                    if(validpositions) {
                        util.getChildren('document', data.docid, function(weeks) {
                            // the number of positions received must be the same as the number of weeks
                            if(weeks.length != data.positions.length) {
                                validids = false;
                            }

                            // check if all ids are valid ids from the database
                            for(let i = 0; i < data.positions.length && validids; i++) {
                                let found = false;
                                for(let j = 0; j < weeks.length && !found; j++) {
                                    if(weeks[j].id == data.positions[i].id) {
                                        found = true;
                                    }
                                }
                                if(!found) {
                                    validids = false;
                                }
                            }
                            // if everything passes, change all positions to the ones received
                            if(validids) {
                                util.reorderWeeks(data.positions, function(res) {
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
                        // check if the parent still has children, if not insert one
                        util.getChildren(data.parent, data.parentid, function(siblings) {                        
                            if(siblings.length == 0) {
                                util.insertChild(data.parent, data.parentid, function(children) {
                                    payload = {
                                        type: 'insert',
                                        docid: data.docid,
                                        parent: data.parent,
                                        parentid: data.parentid,
                                        block: data.block,
                                    }
                                    payload[data.block + 's'] = children;
                                    sendAll(payload);
                                })
                            }
                        })
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
    if(config.verbose) console.log(new Date(), "WS Sending: ", data);
    sv.clients.forEach(function(client) {
        if (client.readyState === WebSocket.OPEN && client.docid == data.docid) {
            client.send(JSON.stringify(data));
        }
    });
}