'use strict';

const sha256 = require('sha256');
const mysql = require('mysql');

const config = require('./../config');
const queries = require('./../config/queries');

/**
 * handle the sql server disconnect and reconnect if required
 */
let mysqlConnection;

function handleDisconnect() {
    mysqlConnection = mysql.createConnection(config.database);

    mysqlConnection.connect(function(err) {
        if (err) {
            console.log('Error when connecting to the database server. Reconnecting in 5 seconds...');
            setTimeout(handleDisconnect, 5000);
        }
    });

    mysqlConnection.on('error', function(err) {
        // console.log('Database server closed connection. Reconnecting...');
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            handleDisconnect();
        } else {
            throw err;
        }
    });
}
handleDisconnect();

/**
 * group an array into a hierarchical json object
 * @param  {Array} array     the given flat array
 * @param  {String} field     field to be grouped by
 * @param  {String} groupname name of the excess properties group
 * @param  {Array} keep      array of field to be kept in the main object
 * @return {Array}           array of grouped objects
 */
function groupJSON(array, field, groupname, keep) {
    keep = !!keep ? keep : []
    groupname = !!groupname ? groupname : "grouped"

    let result = [];
    array.forEach(function(el) {
        let temp = Object.assign({}, el);

        let found = -1;
        for (let i = 0; i < result.length; i++) {
            if (result[i][field] == el[field]) {
                found = i;
                break;
            }
        }

        if (found != -1) {
            keep.forEach(function(k) {
                delete temp[k];
            })
            delete temp[field];

            let group = {};
            for (var key in temp) {
                group[key] = temp[key];
            }
            result[found][groupname].push(group);
        } else {
            let n = {};
            n[field] = el[field];
            keep.forEach(function(k) {
                n[k] = el[k];
                delete temp[k];
            })
            delete temp[field];
            let group = {};
            for (var key in temp) {
                group[key] = temp[key];
            }
            n[groupname] = [group];
            result.push(n);
        }
    })

    return result;
}

/**
 * use the groupJSON function to group query results into a json object
 * @param  {Array} flatArray the flat array
 * @return {Array}           grouped documents
 */
function makeDocumentsFromQuery(flatArray) {
    let docs = groupJSON(flatArray, "documentid", "weeks", ["name"]);
    docs.forEach(function(doc) {
        let weeks = groupJSON(doc.weeks, "weekid", "structures", ["weekname", "day", "weekposition"]);
        weeks.forEach(function(week) {
            let strs = groupJSON(week.structures, "structureid", "resources", ["structurename", "structureid", "comments", "structureposition"]);
            week.structures = strs;
        })
        doc.weeks = weeks;
    })
    return docs;
}

/**
 * create a random document key
 * @param  {Number} length length of key
 * @return {String}        document key
 */
function randomId(length = 24) {
    let str = "";
    for (; str.length < length; str += Math.random().toString(36).substr(2));
    str += new Date();
    str = sha256(str);
    return str.substr(0, length);
}

/**
 * find or create a new user based on the provided email/profile
 * @param  {Object} profile  openid profile object
 * @param  {Function} callback  the callback function for async query
 */
module.exports.findOrCreate = function(profile, callback) {
    mysqlConnection.query(queries.selectall, ['user', 'email', profile.emails[0].value],
        function(err, results) {
            if (err) throw err;
            if (results.length == 0) {
                if(config.verbose) console.log('user not found, inserting');
                let user = {
                    name: profile.displayName,
                    email: profile.emails[0].value,
                }
                mysqlConnection.query(queries.insertuser, user, function(err, insertResult) {
                    if(err) throw err;
                    user.id = results.insertId;
                    callback(null, user);
                })
            } else {
                callback(null, results[0]);
            }
        }
    )
}

/**
 * get user's documents
 * @param  {Int}   userid  
 * @param  {Function} callback 
 */
module.exports.getDocumentsByUser = function(userid, callback) {
    mysqlConnection.query(queries.documentsbyuserid, [userid], function(err, results) {
        if (err) throw err;
        callback(makeDocumentsFromQuery(results));
    })
}

/**
 * get document by user and document key
 * @param  {String} docid 
 * @param  {Int}   userid  
 * @param  {Function} callback 
 */
module.exports.getDocumentByKey = function(docid, callback) {
    mysqlConnection.query(queries.documentbyid, [docid], function(err, results) {
        if (err) throw err;
        callback(makeDocumentsFromQuery(results)[0]);
    })
}

/**
 * insert a week into the document
 * @param  {String}   docid    document key
 * @param  {Function} callback
 */
function insertWeek(docid, callback) {
    mysqlConnection.query(queries.weeksbydoc, [docid], function(err, weeks) {
        if (err) throw err;
        let date = new Date();
        let vals = [docid, '', date, weeks.length];
        mysqlConnection.query(queries.insert, ['week', config.cols.week, vals], function(err, results) {
            if (err) throw err;
            let weekid = results.insertId;
            insertStructure(weekid, function(response) {
                let week = {
                    weekid: results.insertId,
                    weekname: '',
                    day: date,
                    weekposition: weeks.length,
                    structures: response
                }
                callback([week]);
            })
        })
    })
}

/**
 * insert a structure into the week
 * @param  {Int}   weekid
 * @param  {Function} callback
 */
function insertStructure(weekid, callback) {
    mysqlConnection.query(queries.structuresbyweek, [weekid], function(err, structures) {
        if (err) throw err;
        let vals = [weekid, '', '', structures.length];
        mysqlConnection.query(queries.insert, ['structure', config.cols.structure, vals], function(err, results) {
            if (err) throw err;
            let structureid = results.insertId;
            insertResource(structureid, function(response) {
                let structure = {
                    structureid: results.insertId,
                    structurename: '',
                    comments: '',
                    structureposition: structures.length,
                    resources: response
                }
                callback([structure]);
            })
        })
    })
}

/**
 * insert a resource into the structure
 * @param  {Int}   structureid
 * @param  {Function} callback
 */
function insertResource(structureid, callback) {
    mysqlConnection.query(queries.resourcesbystructure, [structureid], function(err, resources) {
        if (err) throw err;
        let vals = [structureid, '', '', resources.length];
        mysqlConnection.query(queries.insert, ['resource', config.cols.resource, vals], function(err, results) {
            if (err) throw err;
            let resource = {
                resourceid: results.insertId,
                resourcename: '',
                url: '',
                resourceposition: resources.length,
            }
            callback([resource]);
        })
    })
}

/**
 * create a document
 * @param  {Object} user
 * @param {Function} callback
 */
module.exports.createDocument = function(user, callback) {
    let key = randomId();
    let vals = [key, user.id, 'New Document'];
    mysqlConnection.query(queries.insert, ['document', config.cols.document, vals], function(err, results) {
        if (err) throw err;
        insertWeek(key, function() {
            callback(key);
        })
    })
}

/**
 * delete a document and its contents recursively
 * done like this because of a problem with foreign keys in the database
 * @param {Object} user
 * @param {String} docid document key
 * @param {Function} callback
 */
module.exports.deleteDocument = function(user, docid, callback) {
    mysqlConnection.query(queries.weeksbydoc, [docid], function(err, results) {
        if (err) throw err;
        results.forEach(function(week) {
            mysqlConnection.query(queries.structuresbyweek, [week.id], function(err, results) {
                results.forEach(function(structure) {
                    mysqlConnection.query(queries.delete, ['resource', 'structureid', structure.id], function(err, results) {
                        if (err) throw err;
                    })
                })
                mysqlConnection.query(queries.delete, ['structure', 'weekid', week.id], function(err, results) {
                    if (err) throw err;
                })
            })
        })
        mysqlConnection.query(queries.delete, ['week', 'documentid', docid], function(err, results) {
            if (err) throw err;
            mysqlConnection.query(queries.delete, ['document', 'id', docid], function(err, results) {
                if (err) throw err;
                callback(results);
            })
        })
    })
}

/**
 * update a block
 * @param  {String}   table
 * @param  {String}   field
 * @param  {String}   value
 * @param  {Array}   coditions two sets of field-value
 * @param  {Function} callback 
 */
module.exports.updateBlock = function(table, field, value, conditions, callback) {
    let inserts = [].concat(table, field, value, conditions);
    mysqlConnection.query(queries.updatetwoconditions, inserts, function(err, results) {
        if (err) throw err;
        callback(results);
    })
}

/**
 * delete a block
 * @param  {String}   block
 * @param  {Int} id
 * @param  {Function} callback
 */
module.exports.deleteBlock = function(block, id, callback) {
    mysqlConnection.query(queries.delete, [block, 'id', id], function(err, results) {
        if (err) throw err;
        callback(results);
    })
}

/**
 * insert a child block to the given parent
 * @param  {String}   parent   parent block
 * @param  {Int}   parentid
 * @param  {Function} callback
 */
module.exports.insertChild = function(parent, parentid, callback) {
    switch (parent) {
        case 'document':
            insertWeek(parentid, function(results) {
                callback(results);
            })
            break;

        case 'week':
            insertStructure(parentid, function(results) {
                callback(results);
            })
            break;

        case 'structure':
            insertResource(parentid, function(results) {
                callback(results);
            })
            break;
    }
}

/**
 * get a parent's children
 * @param  {String}   parent   
 * @param  {Int}   parentid
 * @param  {Function} callback
 */
module.exports.getChildren = function(parent, parentid, callback) {
    let block = config.blocks[parent].child;
    let inserts = [block, parent + 'id', parentid];
    mysqlConnection.query(queries.selectall, inserts, function(err, results) {
        if (err) throw err;
        callback(results);
    })
}

/**
 * reorder the weeks with the provided positions
 * @param  {Array<Object>}   positions array of position objects {position: x, id: y}
 * @param  {Function} callback
 */
module.exports.reorderWeeks = function(positions, callback) {
    let inserts = [];
    let query = '';
    positions.forEach(function(pos) {
        query += queries.update;
        inserts.push('week', 'position', pos.position, 'id', pos.id);
    })
    mysqlConnection.query(query, inserts, function(err, results) {
        if (err) throw err;
        callback(results);
    })
}