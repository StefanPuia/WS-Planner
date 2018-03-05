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
        let weeks = groupJSON(doc.weeks, "weekid", "structures", ["weekname", "day"]);
        weeks.forEach(function(week) {
            let strs = groupJSON(week.structures, "structureid", "resources", ["structurename", "structureid", "comments"]);
            week.structures = strs;
        })
        doc.weeks = weeks;
    })
    return docs;
}

/**
 * use the groupJSON function to group query results into a json object
 * @param  {Array} flatArray the flat array
 * @return {Array}           grouped documents
 */
function makeWeeksFromQuery(flatArray) {
    let weeks = groupJSON(doc.weeks, "weekid", "structures", ["weekname", "day"]);
    weeks.forEach(function(week) {
        let strs = groupJSON(week.structures, "structureid", "resources", ["structurename", "structureid", "comments"]);
        week.structures = strs;
    })
    return weeks;
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
 * execute a mysql query
 * @param {String} query  query to be executed
 * @param {Array} columns  array of columns to be used in query
 * @param {Array} values  array of values to be inserted in query
 * @param {Function} callback  the callback function for async query
 */
module.exports.query = function(query, insert, callback) {
    mysqlConnection.query(query, insert, function(error, results, fields) {
        if (error) throw error;
        callback(results);
    })
}

/**
 * find or create a new user based on the provided email/profile
 * @param  {Object} profile  openid profile object
 * @param  {Function} callback  the callback function for async query
 */
module.exports.findOrCreate = function(profile, callback) {
    mysqlConnection.query("SELECT * FROM ?? WHERE ?? = ?", ['user', 'email', profile.emails[0].value],
        function(error, results, fields) {
            if (error) {
                throw error;
                callback(error);
            } else if (results.length == 0) {
                console.log('not found, inserting');
                let user = {
                    name: profile.displayName,
                    email: profile.emails[0].value,
                }
                mysqlConnection.query('INSERT INTO user SET ?', user)
                user.id = results.insertId;
                callback(null, user);
            } else {
                callback(null, results[0]);
            }
        }
    )
}

/**
 * get user id from profile or create user and callback with id
 * @param {Object} profile  openid profile object
 * @param {Function} callback  the callback function for async query
 */
module.exports.getUserId = function(profile, callback) {
    mysqlConnection.query(queries.useridbyemail, [profile.emails[0].value],
        function(err, results) {
            if (err) throw err;
            callback(results[0]);
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
        if(err) throw err;
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
        if(err) throw err;
        callback(makeDocumentsFromQuery(results)[0]);
    })
}

/**
 * insert a week into the document
 * @param  {String}   docid    document key
 * @param  {Function} callback
 */
module.exports.insertWeek = function(docid, callback) {
    let date = new Date();
    let cols = ['documentid', 'name', 'day'];
    let vals = [docid, '', date];
    mysqlConnection.query(queries.insert, ['week', cols, vals], function(err, results) {
        if(err) throw err;
        let weekid = results.insertId;
        exports.insertStructure(weekid, function(response) {
            let week = {
                weekid: results.insertId,
                weekname: '',
                day: date,
                structures: response
            }
            callback([week]);
        })
    })
}

/**
 * insert a structure into the week
 * @param  {Int}   weekid
 * @param  {Function} callback
 */
module.exports.insertStructure = function(weekid, callback) {
    let cols = ['weekid', 'name', 'comments'];
    let vals = [weekid, '', ''];
    mysqlConnection.query(queries.insert, ['structure', cols, vals], function(err, results) {
        if(err) throw err;
        let structureid = results.insertId;
        exports.insertResource(structureid, function(response) {
            let structure = {
                structureid: results.insertId,
                structurename: '',
                comments: '',
                resources: response
            }
            callback([structure]);
        })
    })
}

/**
 * insert a resource into the structure
 * @param  {Int}   structureid
 * @param  {Function} callback
 */
module.exports.insertResource = function(structureid, callback) {
    let cols = ['structureid', 'name', 'url'];
    let vals = [structureid, '', ''];
    mysqlConnection.query(queries.insert, ['resource', cols, vals], function(err, results) {
        if(err) throw err;
        let resource = {
            resourceid: results.insertId,
            resourcename: '',
            url: ''
        }
        callback([resource]);
    })
}

/**
 * create a document
 * @param  {Object} user
 * @param {Function} callback
 */
module.exports.createDocument = function(user, callback) {
    let key = randomId();
    let cols = ['id', 'userid', 'name'];
    let vals = [key, user.id, 'New Document'];
    mysqlConnection.query(queries.insert, ['document', cols, vals], function(err, results) {
        if(err) throw err;
        callback(key);
    })
}

/**
 * delete a document
 * @param {Object} user
 * @param {String} docid document key
 * @param {Function} callback
 */
module.exports.deleteDocument = function(user, docid, callback) {
    mysqlConnection.query(queries.delete, ['document', 'id', docid], function(err, results) {
        if(err) throw err;
        callback(results);
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
        if(err) throw err;
        callback(results);
    })
}

/**
 * delete a block
 * @param  {String}   table
 * @param  {Int}   id
 * @param  {Function} callback
 */
module.exports.deleteBlock = function(table, id, callback) {
    let inserts = [table, 'id', id];
    mysqlConnection.query(queries.delete, inserts, function(err, results) {
        if(err) throw err;
        callback(results);
    })
}