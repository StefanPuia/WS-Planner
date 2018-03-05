window.onload = async function() {
    await gapi.auth2.getAuthInstance();
	callServer('/api/document', {}, function(documents) {
		parseDocuments(documents);
	})

    $('#create-document').addEventListener('click', createDocument);
}

function parseDocuments(documents) {
	let docsContainer = $('#documents');
    document.querySelectorAll('div.document-card:not(#document-create-card)').forEach(function(el) {
        el.remove();
    })

	documents.forEach(function(doc) {
		let card = newEl('div', {
			classList: 'document-card'
		})

        let header = newEl('div', {
            classList: 'document-card-header'
        })

		header.append(newEl('h2', {
			textContent: doc.name.length < 17 ? doc.name : doc.name.substr(0, 17) + "..."
		}))
        card.append(header);


		let content = newEl('div', {
			classList: 'document-card-content',
		})

        let contentList = newEl('ul');

		for (let j = 0; j < 4 && j < doc.weeks.length; j++) {
            let wna = doc.weeks[j].weekname;
            if (wna.length > 20) {
                wna = wna.substr(0, 19) + "...";
            }
            contentList.append(newEl('li', {
            	textContent: wna,
                classList: 'week-name'
            }))

            let structureList = newEl('ul');

            for (let k = 0; k < 5 && k < doc.weeks[j].structures.length; k++) {
                let str = doc.weeks[j].structures[k].structurename;
                if (str.length > 30) {
                    str = str.substr(0, 29) + "...";
                }
                structureList.append(newEl('li', {
                	textContent: str
                }))
            }

            contentList.append(structureList);
        }
        content.append(contentList);
        card.append(content);

        let footer = newEl('div', {
            classList: 'document-card-footer'
        })
        let buttonOpen = newEl('button', {
        	type: 'button',
        	classList: 'btn',
        	textContent: 'Open'
        });
        buttonOpen.dataset.docid = doc.documentid;
        buttonOpen.addEventListener('click', openDocument);
        footer.append(buttonOpen);

        let buttonDelete = newEl('button', {
        	type: 'button',
        	classList: 'btn btn-danger',
        	textContent: 'Delete'
        });
        buttonDelete.dataset.docid = doc.documentid;
        buttonDelete.addEventListener('click', deleteDocument);
        footer.append(buttonDelete);

        card.append(footer);
		docsContainer.append(card);
	})
}

function openDocument(e) {
	window.location = '/doc/' + e.currentTarget.dataset.docid;
}

function deleteDocument(e) {
    if(window.confirm("Are you sure you want to delete this document? This action is irreversable!")) {
        callServer('/api/document/' + e.currentTarget.dataset.docid, {method: "delete"}, function() {
            callServer('/api/document', {}, function(docs) {
                parseDocuments(docs);
            })
        })
    }
}

function createDocument() {
    callServer('/api/document', {method: 'post'}, function(docid) {
        window.location = '/doc/' + docid;
    })
}