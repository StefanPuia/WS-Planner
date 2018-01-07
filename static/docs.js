'use strict';

window.addEventListener('load', function() {
	document.querySelectorAll(".buttonDocumentDelete").forEach(function(el) {
		el.addEventListener('click', function(e) {
			if(window.confirm("Are you sure you want to delete this document?\nIt will still be available in the Recycle Bin.")) {
				let docid = e.target.dataset.id;
				let data = {
					"docid": docid
				}

			 	$.post('/api/document/delete', data);
				window.location.reload();
			}
		})
	})

	document.querySelector('#buttonDocumentNew').addEventListener('click', async function(e) {
		$('#buttonDocumentNew').off();
		let response = await fetch('/api/document/new');
		let data = await response.json();
		window.location.href = '/?doc=' + data.id;
	})
})