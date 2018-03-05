let verbose = localStorage.verbose?localStorage.verbose:false;

window.addEventListener('load', async function() {
    $('#nav-log').addEventListener('click', signOut);

    if (location.pathname != "/login" && await !gapi.auth2.getAuthInstance().isSignedIn.get()) {
        signOut();
    }
})