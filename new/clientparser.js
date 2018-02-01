window.onload = function() {
	$('#document-name').value = doc.name;
	generateTable();
	resizeDocumentName();
	$('#document-name').addEventListener('input', resizeDocumentName);
}

let doc = {
        "name": "Webscript",
        "id": "5a5127afd8d36e6c9ac2fa33",
        "deleted": false,
        "weeks": [{
            "wpe": "10.11 - 17.11",
            "wna": "AJAX",
            "str": [{
                "name": "Lecture: intro to AJAX",
                "com": [
                    "need to say about ajax stuff",
                    "need to teach ajax"
                ],
                "res": [{
                    "name": "Presenatation",
                    "url": "goo.gl/as2dE"
                }, {
                    "name": "Documentation",
                    "url": "goo.gl/aw23tg"
                }]

            }, {
                "name": "Practical: Working on AJAX",
                "com": [
                    "need to show people in practicals how to use ajax"
                ],
                "res": [{
                    "name": "GitHub",
                    "url": "github.com/portsoc/ws_ajax"
                }]
            }]
        }, {
            "wpe": "18.11 - 25.11",
            "wna": "Sockets",
            "str": [{
                "name": "Practical",
                "com": [
                    "show people how to use sockets in practicals"
                ],
                "res": [{
                    "name": "GitHub",
                    "url": "github.com/portsoc/ws_sockets"
                }]
            }]
        }]
    };

$ = function(query) {
	let result = document.querySelectorAll(query);
	if(result.length > 1)
		return result;
	return result[0];
}

function newEl(tag, attr = {}) {
	let el = document.createElement(tag);
	Object.assign(el, attr);
	return el;
}

function listifyResources(resources) {
	let ul = newEl('ul');
	resources.forEach(function(res) {
		let li = newEl('li');
		li.append(newEl('b', {
			textContent: res.name + ': '
		}));
		li.append(newEl('a', {
			href: res.url,
			textContent: res.url
		}))
		ul.append(li);
	})
	return ul;
}

function generateTable() {

	for(let i = 0; i < doc.weeks.length; i++) {
		let week = newEl('div', {classList: 'week', id: `week_${i}`});

		// week actions
		week.append(newEl('div', {
			classList: 'td center week-actions',
			textContent: doc.weeks[i].name
		}));

		// week period
		week.append(newEl('div', {
			classList: 'td center week-period',
			textContent: doc.weeks[i].wpe
		}));

		// week name
		week.append(newEl('div', {
			classList: 'td center week-name',
			textContent: doc.weeks[i].wna
		}));

		// week structure
		let weekStructure = newEl('div', {
			classList: 'td week-structure'
		})

		for(let j = 0; j < doc.weeks[i].str.length; j++) {
			let structure = newEl('div', {classList: 'structure'});

			// structure name
			structure.append(newEl('div', {
				classList: 'structure-name',
				textContent: doc.weeks[i].str[j].name
			}))

			// structure comments
			structure.append(newEl('div', {
				classList: 'structure-comments',
				textContent: doc.weeks[i].str[j].com.join('\n')
			}))

			// structure resources
			let resources = newEl('div', {classList: 'structure-resources'});
			resources.append(listifyResources(doc.weeks[i].str[j].res));
			structure.append(resources);

			weekStructure.append(structure);
		}

		week.append(weekStructure);
		$('.tbody').append(week);
	}
}

function resizeDocumentName() {
	let input = $('#document-name');
	input.style.width = input.value.length * 10 + 11 + 'px';
}