'use strict';

const path = require('path');

module.exports = {
    // enable http and ws requests logging
    verbose: true,

    database: {
        host: 'sql35.main-hosting.eu',
        database: 'u619707583_wspla',
        user: 'u619707583_wspla',
        password: 'D3uHlNDnYdOP',
        multipleStatements: true
    },

    views: path.join(__dirname, './../views'),

    staticFiles: path.join(__dirname, './../../static'),
    staticRouted: '/static',

    serverPort: 8080,

    googleAuth: {
        clientID: '16592814341-srr33lj6et1lj5ls0dj4v73q495khfko.apps.googleusercontent.com',
        clientSecret: 'qjfvCowxJTHbDJ_YjWLeg3dP',
        callbackURL: 'http://localhost:8080/auth/google/callback'
    },

    cols: {
        'document': ['id', 'userid', 'name'],
        'week': ['documentid', 'name', 'day', 'position'],
        'structure': ['weekid', 'name', 'comments', 'position'],
        'resource': ['structureid', 'name', 'url', 'position'],
    },

    blocks: {
        document: {
            parent: '',
            child: 'week',
        },

        week: {
            parent: 'document',
            child: 'structure',
        },

        structure: {
            parent: 'week',
            child: 'resource',
        },

        resource: {
            parent: 'structure',
            child: '',
        },
    },
}