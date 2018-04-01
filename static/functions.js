'use strict';

/**
 * Shorthand function for querySelector
 * @param {String} css selector
 * @param {Bool} returnArray force the function to return an array
 * @return {NodeElement} / {NodeElementList} depending on query returning multiple elements
 */
const $ = function(query, returnArray = false) {
    let result = document.querySelectorAll(query);
    if (result.length > 1 || returnArray) {
        return result;
    } else if (result) {
        return result[0];
    }
    return undefined;
}

/**
 * Creates a new [tag] element and assigns the provided attributes to it
 * @param  {String} tag name
 * @param  {Object} attributes object to be applied
 * @param  {Object} style style to be applied to the object
 * @return {NodeElement} the new element
 */
function newEl(tag, attr = {}, style = {}) {
    let el = document.createElement(tag);
    Object.assign(el, attr);
    Object.assign(el.style, style)
    return el;
}

/**
 * Get the parameter value from an url string
 * @param  {Location} location object
 * @param  {String} parameter to search for
 * @return {String} parameter value or undefined if not found
 */
function getParameterValue(param, path) {
    path = !!path ? path : location.pathname;
    let parts = escape(path).split('/');
    for (let i = 0; i < parts.length; i++) {
        if (parts[i] == param && parts.length > i) {
            return parts[i + 1];
        }
    }
    return undefined;
}

/**
 * get the document key from the url
 * @return {String} document key
 */
function getDocumentId() {
    return getParameterValue('doc').split('-').slice(-1).pop();
}

/**
 * send data through the web socket connection
 * @param  {Object} payload the payload to be sent
 */
function callSocket(payload) {
    payload.docid = getDocumentId();
    if (ws.readyState !== ws.OPEN) {
        alert('Lost the connection to the server. Please reload.')
        if (verbose) console.log("ws readyState:", ws.readyState);
    } else {
        if (verbose) console.log("ws sending: ", payload);
        ws.send(JSON.stringify(payload));
    }
}

/**
 * handle the websocket message event
 * @param  {Object} message
 */
function receivedMessageFromServer(message) {
    message = JSON.parse(message.data)
    if (verbose) console.log("ws recieved: ", message);

    switch (message.type) {
        case 'insert':
            insertBlock(message);
            break;

        case 'update':
            updateBlock(message);
            break;

        case 'move':
        case 'reorderweeks':
            moveBlock(message);
            break;

        case 'delete':
            deleteBlock(message);
            break;
    }
}

/**
 * make a fetch call to the server
 * @param  {String}   fetchURL      fetch URL
 * @param  {Object}   options  fetch options
 * @param  {Function} callback
 */
async function callServer(fetchURL, options, callback) {
    const token = gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().id_token;

    const fetchOptions = {
        credentials: 'same-origin',
        method: 'get',
        headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
    };

    Object.assign(fetchOptions, options);

    if (verbose) console.log("requesting: " + fetchOptions.method.toUpperCase() + ' ' + fetchURL);
    const response = await fetch(fetchURL, fetchOptions);
    if (!response.ok) {
        console.log("Server error:\n" + response.status);
        callback(response.status);
    } else {
        let data = await response.json();
        if (!data) {
            data = JSON.stringify({
                err: "error on fetch"
            });
        }

        if (verbose) console.log("recieved: ", data);
        callback(null, data);
    }
}

/**
 * sign the user in
 */
function signIn() {
    $('#nav-log').textContent = "Log Out";
    callServer('/api/user/', {}, function(status, user) {
        $('#nav-greeting').textContent = 'Hello, ' + user.name;
    })
}

/**
 * sign the user out
 */
async function signOut() {
    await gapi.auth2.getAuthInstance().signOut();
    window.location = "/login";
}

/**
 * redirects the user when the login at /login succeeds
 */
function mainSignIn() {
    window.location = "/";
}

/**
 * displays a prompt with the document url
 * @param {Strign} view view to be appended to the end of the url
 */
function shareDocument(view = '') {
    let docNameEl = $('.document-name');
    let docname = docNameEl.textContent;
    if (docNameEl.tagName == 'input') {
        docname = docNameEl.value;
    }
    let docid = getDocumentId();
    let url = location.origin + '/doc/' + docname + '-' + docid + '/' + view;
    window.prompt('Copy this URL and share it.\nAnyone with the URL can EDIT this file.', url);
}

/**
 * toggles the verbose state
 */
function toggleVerbose() {
    if (localStorage.verbose == 'false') {
        verbose = true;
        localStorage.verbose = true;
        console.log("Verbose mode enabled.");
    } else {
        verbose = false;
        localStorage.verbose = false;
        console.log("Verbose mode disabled. Enjoy the silence :)");
    }
}