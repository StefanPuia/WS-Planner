'use strict';

// output requests and messages to console
let verbose = localStorage.verbose == 'true' ? true : false;

window.addEventListener('load', async function() {
	if(verbose) console.log("You are in verbose mode. Type 'toggleVerbose()' to disable the logs.");
    $('#nav-log').addEventListener('click', signOut);

    // if user is not logged in call signOut() (redirects to '/login')
    gapi.auth2.getAuthInstance().then(function(e) {
    	let logged = e.isSignedIn.get();
	    if (location.pathname != "/login" && logged === false) {
	        signOut();
	    }
    })
})