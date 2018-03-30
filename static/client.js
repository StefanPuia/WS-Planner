'use strict';

// output requests and messages to console
let verbose = localStorage.verbose == 'true' ? true : false;
let menuOpen = false;

window.addEventListener('load', async function() {
	if(verbose) console.log("You are in verbose mode. Type 'toggleVerbose()' to disable the logs.");

    // if user is not logged in call signOut() (redirects to '/login')
    gapi.auth2.getAuthInstance().then(function(e) {
    	let logged = e.isSignedIn.get();
	    if (location.pathname != "/login" && logged === false) {
	        signOut();
	    }
    })

    if (location.pathname != "/login") {
    	$('#nav-log').addEventListener('click', signOut);
	    $('.nav-expand').addEventListener('click', function() {
	    	if(menuOpen) {
	    		menuOpen = false;
		    	$('aside').classList.add('hidden');
		    	$('aside #menu-block-left *', true).forEach(function(el) { $('.nav-left').append(el); })
		    	$('aside #menu-block-right *', true).forEach(function(el) { $('.nav-right').append(el); })
	    	}
	    	else {
	    		menuOpen = true;
		    	$('.nav-left *', true).forEach(function(el) { $('aside #menu-block-left').append(el); })
		    	$('.nav-right *', true).forEach(function(el) { $('aside #menu-block-right').append(el); })
		    	$('aside').classList.remove('hidden');
	    	}
	    })
	}
})