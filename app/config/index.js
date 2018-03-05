'use strict';

const path = require('path');

module.exports = {
	database: {
		host: 'sql35.main-hosting.eu',
		database: 'u619707583_wspla',
		user:     'u619707583_wspla',
		password: 'D3uHlNDnYdOP',
	},

	views: path.join(__dirname, './../views'),

	staticFiles: path.join(__dirname, './../../static'),
	staticRouted: '/static',

	serverPort: 8080,

	googleAuth: {
		clientID: '16592814341-srr33lj6et1lj5ls0dj4v73q495khfko.apps.googleusercontent.com',
		clientSecret: 'qjfvCowxJTHbDJ_YjWLeg3dP',
		callbackURL: 'http://localhost:8080/auth/google/callback'
	}
}