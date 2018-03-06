let verbose = localStorage.verbose?localStorage.verbose:false;

window.addEventListener('load', async function() {
    $('#nav-log').addEventListener('click', signOut);

    gapi.auth2.getAuthInstance().then(function(e) {
    	let logged = e.isSignedIn.get();
	    if (location.pathname != "/login" && logged === false) {
	        signOut();
	    }
    })
})