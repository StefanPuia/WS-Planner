let verbose = localStorage.verbose;

window.addEventListener('load', async function() {
    $('#nav-log').addEventListener('click', signOut);

    gapi.auth2.getAuthInstance().then(function(e) {
    	let logged = e.isSignedIn.get();
	    if (location.pathname != "/login" && logged === false) {
	        signOut();
	    }
    })
})