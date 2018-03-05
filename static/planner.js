'use strict';

// websocket variable
let ws;

/**
 * handles the window load event
 */
window.onload = async function() {
	await gapi.auth2.getAuthInstance();

	ws = new WebSocket("ws://" + window.location.hostname + ":" + (window.location.port || 80) + "/");
	ws.addEventListener('message', receivedMessageFromServer);
	let docid = getParameterValue('doc');

	callServer('/api/document/' + docid, {}, function(doc) {
		generateTable(doc);

		$('.tbody').id = 'document_' + docid + '_weeks';

		// set the document name
		$('.document-name').value = doc.name;
		$('.document-name').style.display = "inline-block";
		$('.document-name').id = 'document_' + docid + '_name';
		// add listener and execute function
		resizeDocumentName();
		$('.document-name').addEventListener('input', resizeDocumentName);
		$('.document-name').addEventListener('change', sendUpdate)
	})
}


/**
 * generate the document
 * @param  {Object} doc the json document object
 */
function generateTable(doc) {
	let container = $('.tbody');
	container.innerHTML = '';

	container.addEventListener('mouseover', showInsertButton);
	container.addEventListener('mouseout', hideInsertButton);

	// generate each week and its components
	doc.weeks.forEach(function(week) {
		// generate the weeks
		generateWeek(week, container);
	});

	let insertWeekButton = newEl('button', {
		classList: 'btn button-insert',
		id: `insert_weeks_${getParameterValue('doc')}`
	}); container.append(insertWeekButton);

	addEditableListeners();
	fixInsertButton();
}

/**
 * add the sendUpdate function for every editable container
 */
function addEditableListeners() {
	$('[contenteditable="true"]').forEach(function(el) {
		el.addEventListener('blur', sendUpdate);
	})
}

/**
 * add the listeners and content to insert buttons
 */
function fixInsertButton() {
	// add the 'add' icon from material icons to every button
	$('button.button-insert').forEach(function(el) {
		el.innerHTML = '';
		el.append(newEl('i', {
			classList: 'material-icons',
			textContent: 'add'
		}))
		// add events for inserting blocks
		el.addEventListener('click', sendInsertBlock);
	})
}

/**
 * generate the resources block
 * @param  {Object} structure           the json structure object
 * @param  {Node} structure_resources the container for resources
 */
function generateResource(resource, container) {
	// resource row
	let resource_row = newEl('div', {
		classList: 'resource',
		id: `resource_${resource.resourceid}`
	})

	// resource actions
	let resource_actions = newEl('div', {
		classList: 'resource-actions'
	}); resource_row.append(resource_actions);

	generateResourceActions(resource, resource_actions);

	// resource name
	let resource_name = newEl('div', {
		classList: 'resource-name',
		contentEditable: 'true',
		innerText: resource.resourcename,
		id: `resource_${resource.resourceid}_name`
	}); resource_row.append(resource_name);

	// resource url
	let resource_url = newEl('a', {
		classList: 'resource-url',
		contentEditable: 'true',
		href: resource.url,
		textContent: resource.url,
		id: `resource_${resource.resourceid}_url`
	}); resource_row.append(resource_url);

	// append resource to resources block before the insert button, if it exists
	let button = container.childNodes[container.childNodes.length - 1];
	if(!button || !button.classList.contains('button-insert')) {
		container.append(resource_row);
	}
	else {
		container.insertBefore(resource_row, button);
	}
}

/**
 * generate action buttons for resource
 * @param  {Object} resource
 * @param  {Node} container
 */
function generateResourceActions(resource, container) {
	let button_move = newEl('button', {
		type: 'button',
		classList: 'btn btn-action btn-sm',
		id: `resource_${resource.resourceid}_delete`
	})
	button_move.append(newEl('i', {
		classList: 'material-icons md-24',
		textContent: 'open_with'
	}))
	button_move.addEventListener('dragstart', startWeekDrag);
	container.append(button_move);

	let button_delete = newEl('button', {
		type: 'button',
		classList: 'btn btn-danger btn-action btn-sm',
		id: `resource_${resource.resourceid}_delete`
	})
	button_delete.append(newEl('i', {
		classList: 'material-icons md-24',
		textContent: 'clear'
	}))
	button_delete.addEventListener('click', sendDeleteBlock);
	container.append(button_delete);
}

/**
 * generate the structures block
 * @param  {Object} week            the json week object
 * @param  {Node} week_structures the container for structures
 */
function generateStructure(structure, container) {
	// structure row
	let structure_row = newEl('div', {
		classList: 'structure',
		id: `structure_${structure.structureid}`
	});

	// structure actions
	let structure_actions = newEl('div', {
		classList: 'structure-actions'
	}); structure_row.append(structure_actions);

	generateStructureActions(structure, structure_actions);

	// structure name
	let structure_name = newEl('div', {
		classList: 'structure-name',
		innerText: structure.structurename,
		contentEditable: 'true',
		id: `structure_${structure.structureid}_name`
	}); structure_row.append(structure_name);

	// structure comments
	let structure_comments = newEl('div', {
		classList: 'structure-comments',
		innerText: structure.comments,
		contentEditable: 'true',
		id: `structure_${structure.structureid}_comments`
	}); structure_row.append(structure_comments);

	// structure resources
	let structure_resources = newEl('div', {
		classList: 'structure-resources',
		id: `structure_${structure.structureid}_resources`
	});

	structure_resources.addEventListener('mouseover', showInsertButton);
	structure_resources.addEventListener('mouseout', hideInsertButton);

	// generate each resource and its components
	structure.resources.forEach(function(resource) {
		generateResource(resource, structure_resources);
	})

	let insertResourceButton = newEl('button', {
		classList: 'btn button-insert',
		id: `insert_resources_${structure.structureid}`
	}); structure_resources.append(insertResourceButton);

	// append resource block to structure row
	structure_row.append(structure_resources);

	// append structure row to structure block
	let button = container.childNodes[container.childNodes.length - 1];
	if(!button || !button.classList.contains('button-insert')) {
		container.append(structure_row);
	}
	else {
		container.insertBefore(structure_row, button);
	}
}

/**
 * generate action buttons for structure
 * @param  {Object} structure
 * @param  {Node} container
 */
function generateStructureActions(structure, container) {
	let button_move = newEl('button', {
		type: 'button',
		classList: 'btn btn-action btn-sm',
		id: `structure_${structure.structureid}_delete`
	})
	button_move.append(newEl('i', {
		classList: 'material-icons md-24',
		textContent: 'open_with'
	}))
	button_move.addEventListener('dragstart', startWeekDrag);
	container.append(button_move);

	let button_delete = newEl('button', {
		type: 'button',
		classList: 'btn btn-danger btn-action btn-sm',
		id: `structure_${structure.structureid}_delete`
	})
	button_delete.append(newEl('i', {
		classList: 'material-icons md-24',
		textContent: 'clear'
	}))
	button_delete.addEventListener('click', sendDeleteBlock);
	container.append(button_delete);
}

/**
 * generate the week block
 * @param  {Object} doc       the json document object
 * @param  {Node} container the container for the weeks
 */
function generateWeek(week, container) {
	// week row
	let week_row = newEl('div', {
		classList: 'week', 
		id: `week_${week.weekid}`
	});

	// week actions
	let week_actions = newEl('div', {
		classList: 'td center week-actions',
		id: `week_${week.weekid}_actions`
	}); week_row.append(week_actions);

	generateWeekActions(week, week_actions);

	// week period
	let week_period = newEl('div', {
		classList: 'td center week-period',
		textContent: getWeekPeriod(week.day),
		id: `week_${week.weekid}_period`
	}); week_row.append(week_period);

	// week name
	let week_name = newEl('div', {
		classList: 'td center week-name',
		innerText: week.weekname,
		contentEditable: 'true',
		id: `week_${week.weekid}_name`
	}); week_row.append(week_name);

	// week structure
	let week_structures = newEl('div', {
		classList: 'td week-structure',
		id: `week_${week.weekid}_structures`
	})

	week_structures.addEventListener('mouseover', showInsertButton);
	week_structures.addEventListener('mouseout', hideInsertButton);

	week.structures.forEach(function(structure) {
		// gengenerateStructureerate each structure and its components
		generateStructure(structure, week_structures);
	})

	let insertStructureButton = newEl('button', {
		classList: 'btn button-insert',
		id: `insert_structures_${week.weekid}`
	}); week_structures.append(insertStructureButton);

	// append structure block to week row
	week_row.append(week_structures);
	
	// append week row to table before the insert button, if it exists
	let button = container.childNodes[container.childNodes.length - 1];
	if(!button || !button.classList.contains('button-insert')) {
		container.append(week_row);
	}
	else {
		container.insertBefore(week_row, button);
	}
}

/**
 * generate action buttons for week
 * @param  {Object} week
 * @param  {Node} container
 */
function generateWeekActions(week, container) {
	let button_move = newEl('button', {
		type: 'button',
		classList: 'btn btn-action btn-sm',
		id: `week_${week.weekid}_delete`
	})
	button_move.append(newEl('i', {
		classList: 'material-icons md-24',
		textContent: 'open_with'
	}))
	button_move.addEventListener('dragstart', startWeekDrag);
	container.append(button_move);

	let button_delete = newEl('button', {
		type: 'button',
		classList: 'btn btn-danger btn-action btn-sm',
		id: `week_${week.weekid}_delete`
	})
	button_delete.append(newEl('i', {
		classList: 'material-icons md-24',
		textContent: 'clear'
	}))
	button_delete.addEventListener('click', sendDeleteBlock);
	container.append(button_delete);
}

/**
 * resize the document name input according to the value
 */
function resizeDocumentName() {
	let input = $('.document-name');
	input.style.width = input.value.length * 10 + 11 + 'px';
	// keep this between 300 and 800px?
}

/**
 * display the button for block insertion
 * @param  {Event} e
 */
function showInsertButton(e) {
	let parts = e.currentTarget.id.split('_');
	if(parts[0] != '') {
		$(`#insert_${parts[2]}_${parts[1]}`).style.display = 'block';
	}
}

/**
 * hide the button for block insertion
 * @param  {Event} e
 */
function hideInsertButton (e) {
	let parts = e.currentTarget.id.split('_');
	if(parts[0] != '') {
		$(`#insert_${parts[2]}_${parts[1]}`).style.display = 'none';
	}
}

/**
 * send the request for block insertion
 * @param  {Event} e 
 */
function sendInsertBlock(e) {
	let payload = {
		type: 'insert',
		id: e.currentTarget.id
	}

	callSocket(payload);
}

/**
 * append the block to the page
 * @param  {Object} data object containing data used for node creation
 */
function insertBlock(data) {
	let container = '';
	if(data.docid == getParameterValue('doc')) {
		switch(data.block) {
			case 'weeks':
				container = '.tbody';
				generateWeek(data.weeks[0], $(container));
				break;

			case 'structures':
				container = `#${data.parent}_${data.parentid}_${data.block}`;
				generateStructure(data.structures[0], $(container));
				break;

			case 'resources':
				container = `#${data.parent}_${data.parentid}_${data.block}`;
				generateResource(data.resources[0], $(container));
				break;
		}
		addEditableListeners();
		fixInsertButton();
	}
}

/**
 * send the request for block update
 * @param  {Event} e
 */
function sendUpdate(e) {
	let content = validField(e.currentTarget);
	if(content) {
		let parts = e.currentTarget.id.split('_');
		let parentid = e.currentTarget.parentNode.parentNode.id.split('_')[1];
		parentid = parentid?parentid:getParameterValue('doc');

		let payload = {
			type: 'update',
			object: parts[0],
			id: parts[1],
			property: parts[2],
			parentid: parentid,
			value: content
		};

		callSocket(payload);
	}
}

/**
 * validate field content
 * @param  {Node} block block to be validated
 * @return {String}       valid content / false
 */
function validField(block) {
	let parts = block.id.split('_');
	let content = block.innerText;

	switch(parts[0]+parts[2]) {
		case 'documentname':
			content = block.value;
			if(content.length < 255) {
				block.style.color = '#777';
			}
			else {
				block.style.color = 'red';
				return false;
			}
			break;

		case 'weekname':
			if(content.length < 255) {
				block.style.color = '#333';
			}
			else {
				block.style.color = 'red';
				return false;
			}
			break;

		case 'structurename':
			if(content.length < 255) {
				block.style.color = '#333';
			}
			else {
				block.style.color = 'red';
				return false;
			}
			break;

		case 'structurecomments':
			if(content.length < 65535) {
				block.style.color = '#333';
			}
			else {
				block.style.color = 'red';
				return false;
			}
			break;

		case 'resourcename':
			if(content.length < 255) {
				block.style.color = '#333';
			}
			else {
				block.style.color = 'red';
				return false;
			}
			break;

		case 'resourceurl':
			if(content.length < 2083 &&
				/^((ht|f)tp(s?)\:\/\/|~\/|\/)([\w]+\:[\w]+@)?(([a-zA-Z]{1}([\w\-]+\.)+([\w]+))|(([0-9]{1,3}\.){3}[0-9]{1,3})|localhost)(\:[\d]{1,5})?\/?([\w]*\/*)*(\.[\w]{3,4})?((\?\w+=\w+)?(&\w+=\w+)*)?(\#.+)?/.test(content)) {
				block.href = content;
				block.style.color = '';
			}
			else {
				block.style.color = 'red';
				return false;
			}
			break;

		default:
			return false;
			break;
	}

	if(content == '') {
		return false;
	}

	return content;
}

/**
 * update a block
 * @param  {Object} data update data
 */
function updateBlock(data) {
	$(`#${data.object}_${data.id}_${data.property}`).innerText = data.value;
}

/**
 * delete a block
 * @param  {Event} e
 */
function sendDeleteBlock(e) {
	let parts = e.currentTarget.id.split('_');
	if(window.confirm('Are you sure you want to delete the week? This action is irreversible!')) {
		let payload = {
			type: 'delete',
			object: parts[0],
			id: parts[1]
		};
		callSocket(payload);
	}
}

/**
 * delete a block
 * @param  {Object} data delete data
 */
function deleteBlock(data) {
	let element = $(`#${data.object}_${data.id}`);
	let parent = element.parentNode
	let siblings = parent.children.length - 2;
	element.remove();
	if(siblings < 1) {
		let e = {};
		e.currentTarget = {
			id: 'insert_' + data.object + 's_' + parent.id.split('_')[1]
		}
		sendInsertBlock(e);
	}
}

function startWeekDrag(e) {

}

