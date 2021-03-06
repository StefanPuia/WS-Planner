'use strict';

window.addEventListener('load', async function() {
    await gapi.auth2.getAuthInstance();
    callServer('/api/document', {}, function(status, documents) {
        if (documents.length == 0) {
            $('#emptyResults').classList.remove('hidden');
        }

        parseDocuments(documents);

        $('#document-create-card').addEventListener('click', createDocument);
        $('#emptyResults').addEventListener('click', createDocument);
        $('.search-input').addEventListener('input', searchDocuments);
        $('.search-input').focus();

        $('#loading').classList.add('hidden');
        $('#documents').classList.remove('hidden');
    })
})

/**
 * parse the documents and create the cards
 * @param  {Array} documents array of documents to be parsed
 */
function parseDocuments(documents) {
    let docsContainer = $('#documents');
    // remove all existing cards
    document.querySelectorAll('div.document-card:not(#document-create-card)').forEach(function(el) {
        el.remove();
    })

    documents.forEach(function(doc) {
        // create a full id with a name part for friendly urls
        let fullid = doc.name.substr(0, 17).replace(' ', '-') + '-' + doc.documentid;

        let hidden_content = newEl('div', {
            classList: 'hidden full-text',
            textContent: doc.name + ' ',
        })

        let card = newEl('div', {
            classList: 'document-card'
        })

        // card header
        let header = newEl('div', {
            classList: 'document-card-header'
        })
        header.append(newEl('h2', {
            textContent: doc.name.length < 17 ? doc.name : doc.name.substr(0, 17) + "..."
        }))
        card.append(header);

        // card content
        let content = newEl('div', {
            classList: 'document-card-content',
        })
        let contentList = newEl('ul');

        // parse every week and add brief parts to the card
        for (let j = 0; j < 4 && j < doc.weeks.length; j++) {
            // week name
            let wna = doc.weeks[j].weekname;
            hidden_content.textContent += wna + ' ';
            if (wna.length > 20) {
                wna = wna.substr(0, 19) + "...";
            }
            contentList.append(newEl('li', {
                textContent: wna,
                classList: 'week-name'
            }))

            // week structures
            let structureList = newEl('ul');
            for (let k = 0; k < 5 && k < doc.weeks[j].structures.length; k++) {
                let str = doc.weeks[j].structures[k].structurename;
                hidden_content.textContent += str + ' ' + doc.weeks[j].structures[k].comments + ' ';
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
        content.append(hidden_content);
        card.append(content);

        // card footer
        let footer = newEl('div', {
            classList: 'document-card-footer'
        })

        // open button
        let buttonOpen = newEl('button', {
            type: 'button',
            classList: 'btn',
            textContent: 'Open'
        });
        buttonOpen.dataset.docid = fullid;
        buttonOpen.addEventListener('click', openDocument);
        footer.append(buttonOpen);

        // delete button
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

/**
 * redirect the user to the document's page
 * @param  {Event} e
 */
function openDocument(e) {
    window.location = '/doc/' + e.currentTarget.dataset.docid;
}

/**
 * delete a document
 * @param  {Event} e
 */
function deleteDocument(e) {
    if (window.confirm("Are you sure you want to delete this document? This action is irreversable!")) {
        callServer('/api/document/' + e.currentTarget.dataset.docid, {
            method: "delete"
        }, function() {
            callServer('/api/document', {}, function(status, docs) {
                parseDocuments(docs);
            })
        })
    }
}

/**
 * create a document
 */
function createDocument() {
    callServer('/api/document', {
        method: 'post'
    }, function(status, docid) {
        window.location = '/doc/' + docid;
    })
}

/**
 * search all documents
 */
function searchDocuments() {
    let docs = $('.document-card');
    let query = $('.search-input').value.toLowerCase();
    for (let i = 0; i < docs.length; i++) {
        let text = docs[i].querySelector('.full-text').textContent.toLowerCase();
        if (text.indexOf(query) > -1) {
            docs[i].setAttribute('style', 'display:inline-block!important')
        } else {
            docs[i].setAttribute('style', 'display:none!important')
        }
    }
}