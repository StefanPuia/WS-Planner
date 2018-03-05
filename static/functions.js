/**
 * Shorthand function for querySelector
 * @param {String} css selector
 * @return {NodeElement} / {NodeElementList} depending on query returning multiple elements
 */
$ = function(query) {
    let result = document.querySelectorAll(query);
    if (result.length > 1) {
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
 * @return {NodeElement} the new element
 */
function newEl(tag, attr = {}) {
    let el = document.createElement(tag);
    Object.assign(el, attr);
    return el;
}

/**
 * Get the parameter value from an url string
 * @param  {Location} location object
 * @param  {String} parameter to search for
 * @return {String} parameter value or undefined if not found
 */
function getParameterValue(param, path) {
    path = !!path?path:location.pathname;
    let parts = escape(path).split('/');
    for (let i = 0; i < parts.length; i++) {
        if (parts[i] == param && parts.length > i) {
            return parts[i + 1];
        }
    }
    return undefined;
}

/**
 * send data through the web socket connection
 * @param  {Object} payload the payload to be sent
 */
function callSocket(payload) {
    payload.docid = getParameterValue('doc');
    if(verbose) console.log("ws sending: ", payload);
    if (ws.readyState != ws.OPEN) {
        ws = new WebSocket("ws://" + window.location.hostname + ":" + (window.location.port || 80) + "/");
    }
    ws.send(JSON.stringify(payload));
}

function receivedMessageFromServer(message) {
    message = JSON.parse(message.data)
    if(verbose) console.log("ws recieved: ", message);

    switch(message.type) {
        case 'insert':
            insertBlock(message);
            break;

        case 'update':
            updateBlock(message);
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

    if(verbose) console.log(fetchOptions.method.toUpperCase() + ' ' + fetchURL);
    const response = await fetch(fetchURL, fetchOptions);
    if (!response.ok) {
        console.log("Server error:\n" + response.status);
        return;
    }

    let data = await response.json();
    if (!data) {
        data = JSON.stringify({
            err: "error on fetch"
        });
    }

    if(verbose) console.log(data);
    callback(data);
}

/**
 * sign the user in
 */
function signIn() {
    $('#nav-log').textContent = "Log Out";
    callServer('/api/user/', {}, function(user) {
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

function getWeekPeriod(date) {
    let startDate = new Date(date);
    let endDate = new Date(date);
    endDate.setDate(startDate.getDate() + 6)
    let f = {
        "sd": startDate.getDate(),
        "sm": startDate.getMonth() + 1,
        "sy": startDate.getFullYear(),
        "ed": endDate.getDate(),
        "em": endDate.getMonth() + 1,
        "ey": endDate.getFullYear()
    }

    f.sd = f.sd<10?'0'+f.sd:f.sd;
    f.sm = f.sm<10?'0'+f.sm:f.sm;
    f.ed = f.ed<10?'0'+f.ed:f.ed;
    f.em = f.em<10?'0'+f.em:f.em;

    return `${f.sd}/${f.sm}/${f.sy} to ${f.ed}/${f.em}/${f.ey}`;
}