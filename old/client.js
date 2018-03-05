window.onload = async function() {
	let docid = getParameterValue(location, 'doc');
	// document parameter exists
	if(docid) {
		// request the document
		const response = await fetch('/api/document/' + docid);
		// document found
		if(response.ok) {
			// display the section and the document name
			$('#planner').style.display = 'block';
			$('#document-name').style.display = 'inline-block';

			// request the document contents
			const doc = await response.json();

			// generate the table
			generateTable(doc);

			// set the document name and resize the input
			$('#document-name').value = doc.name;
			$('#document-name').addEventListener('input', resizeDocumentName);
			resizeDocumentName();
		}
		// document not found
		else {
			
		}
	}
	// document parameter not set
	else {
		// display the section
		$('#documents').style.display = 'block';

		// request all documents
		const response = await fetch('/api/document/');
		const docs = await response.json();

		// generate the document previews
	}
}