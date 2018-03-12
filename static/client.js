'use strict';

// output requests and messages to console
let verbose = localStorage.verbose;

window.addEventListener('load', async function() {
    $('#nav-log').addEventListener('click', signOut);

    // if user is not logged in call signOut() (redirects to '/login')
    gapi.auth2.getAuthInstance().then(function(e) {
    	let logged = e.isSignedIn.get();
	    if (location.pathname != "/login" && logged === false) {
	        signOut();
	    }
    })
})