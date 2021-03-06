'use strict';

const fs = require('fs');
const path = require('path');

const bodyParser = require('body-parser');
const GoogleAuth = require('simple-google-openid');

const util = require('./utility');
const config = require('./../config');

module.exports = function(app) {
    // json parser for http requests
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({
        extended: true
    }));

    // use the google auth middleware
    app.use(GoogleAuth(config.googleAuth.clientID));

    // return 'Not authorized' if we don't have a user
    app.use('/api', GoogleAuth.guardMiddleware({
        realm: 'jwt'
    }));

    /**
     * log the user in
     * @param  {Object} user openID user object
     */
    app.get('/api/user', function(req, res) {
        util.findOrCreate(req.user, function(err, user) {
            if (err) throw err;
            res.json(user);
        })
    })

    /**
     * get all user's documents
     * @param  {Object} user openID user object
     */
    app.get('/api/document/', function(req, res) {
        util.findOrCreate(req.user, function(err, user) {
            if(err) throw err;
            util.getDocumentsByUser(user.id, function(documents) {
                res.json(documents);
            })
        })
    })

    /**
     * get a document
     * @param  {Object} user openID user object
     * @param {String} docid document key
     */
    app.get('/api/document/:docid', function(req, res) {
        util.findOrCreate(req.user, function(err, user) {
            if(err) throw err;
            util.getDocumentByKey(req.params.docid, function(documents) {
                if (documents) {
                    res.json(documents);
                } else {
                    res.sendStatus(404);
                }
            })
        })
    })

    /**
     * create a document
     * @param {Object} user openID user object
     */
    app.post('/api/document/', function(req, res) {
        util.findOrCreate(req.user, function(err, user) {
            if(err) throw err;
            util.createDocument(user, function(docid) {
                res.json(docid);
            })
        })
    })

    /**
     * delete a document
     * @param {Object} user openID user object
     * @param {String} docid document key
     */
    app.delete('/api/document/:docid', function(req, res) {
        util.findOrCreate(req.user, function(err, user) {
            if(err) throw err;
            util.deleteDocument(user, req.params.docid, function(results) {
                res.json({
                    status: 200
                });
            })
        })
    })
}