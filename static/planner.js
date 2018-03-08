'use strict';

// websocket variable
let ws;

// move target
let moveTarget = false;

// initial block content
let initialContent = '';

/**
 * handles the window load event
 */
window.onload = async function() {
    let docid = getDocumentId();
    await gapi.auth2.getAuthInstance();

    ws = new WebSocket("ws://" + window.location.hostname + ":" + (window.location.port || 80) + "/" + docid);
    ws.addEventListener('message', receivedMessageFromServer);

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
        classList: 'btn btn-info button-insert',
        id: `insert_weeks_${getDocumentId()}`,
        textContent: 'Insert a new week',
    });
    container.append(insertWeekButton);

    addEditableListeners();
    fixInsertButton();
}

/**
 * add the sendUpdate function for every editable container
 */
function addEditableListeners() {
    $('[contenteditable="true"]').forEach(function(el) {
    	el.addEventListener('focus', function(e) { initialContent = e.currentTarget.innerText; })
        el.addEventListener('blur', sendUpdate);
    })
}

/**
 * add the listeners and content to insert buttons
 */
function fixInsertButton() {
    $('button.button-insert').forEach(function(el) {
        // add events for inserting blocks
        el.addEventListener('click', sendInsertBlock);
    })
}

/**
 * generate action buttons
 * @param  {Object} block
 * @param  {Node} container
 */
function generateActions(block, blockName, container) {
    // move button
    let button_move = newEl('button', {
        type: 'button',
        classList: `btn btn-sm btn-move-${blockName}`,
        id: `${blockName}_${block[blockName + 'id']}_move`
    })
    button_move.append(newEl('i', {
        classList: 'material-icons md-24',
        textContent: 'swap_vert'
    }))
    container.append(button_move);
    button_move.addEventListener('click', startMoveBlock);

    // move top button
    let button_move_top = newEl('button', {
        type: 'button',
        classList: `btn btn-success btn-sm btn-insert-before-${blockName} hidden`,
        id: `${blockName}_${block[blockName + 'id']}_move_top`
    })
    button_move_top.append(newEl('i', {
        classList: 'material-icons md-24',
        textContent: 'vertical_align_top'
    }))
    container.append(button_move_top);
    button_move_top.addEventListener('click', insertBlockBefore);

    // move bottom button
    let button_move_bottom = newEl('button', {
        type: 'button',
        classList: `btn btn-success btn-sm btn-insert-after-${blockName} hidden`,
        id: `${blockName}_${block[blockName + 'id']}_move_bottom`
    })
    button_move_bottom.append(newEl('i', {
        classList: 'material-icons md-24',
        textContent: 'vertical_align_bottom'
    }))
    container.append(button_move_bottom);
    button_move_bottom.addEventListener('click', insertBlockAfter);

    // delete button
    let button_delete = newEl('button', {
        type: 'button',
        classList: `btn btn-danger btn-sm btn-delete-${blockName}`,
        id: `${blockName}_${block[blockName + 'id']}_delete`
    })
    button_delete.append(newEl('i', {
        classList: 'material-icons md-24',
        textContent: 'clear'
    }))
    button_delete.addEventListener('click', sendDeleteBlock);
    container.append(button_delete);
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
    resource_row.dataset.position = resource.resourceposition;

    // resource actions
    let resource_actions = newEl('div', {
        id: `resource_${resource.resourceid}_actions`,
        classList: 'resource-actions'
    });
    resource_row.append(resource_actions);

    generateActions(resource, 'resource', resource_actions);

    // resource name
    let resource_name = newEl('div', {
        classList: 'resource-name',
        contentEditable: 'true',
        innerText: resource.resourcename,
        id: `resource_${resource.resourceid}_name`
    });
    resource_row.append(resource_name);

    // resource url
    let resource_url = newEl('a', {
        classList: 'resource-url',
        contentEditable: 'true',
        href: resource.url,
        textContent: resource.url,
        id: `resource_${resource.resourceid}_url`
    });
    resource_row.append(resource_url);


    // append resource to resources block before the insert button, if it exists
    let button = container.childNodes[container.childNodes.length - 1];
    if (!button || !button.classList.contains('button-insert')) {
        container.append(resource_row);
    } else {
        container.insertBefore(resource_row, button);
    }
}

/**
 * generate the structures block
 * @param  {Object} week            the json week object
 * @param  {Node} structures the container for structures
 */
function generateStructure(structure, container) {
    // structure row
    let structure_row = newEl('div', {
        classList: 'structure',
        id: `structure_${structure.structureid}`
    });
    structure_row.dataset.position = structure.structureposition;

    // structure actions
    let structure_actions = newEl('div', {
        id: `structure_${structure.structureid}_actions`,
        classList: 'structure-actions'
    });
    structure_row.append(structure_actions);

    generateActions(structure, 'structure', structure_actions);

    // structure name
    let structure_name = newEl('div', {
        classList: 'structure-name',
        innerText: structure.structurename,
        contentEditable: 'true',
        id: `structure_${structure.structureid}_name`
    });
    structure_row.append(structure_name);

    // structure comments
    let structure_comments = newEl('div', {
        classList: 'structure-comments',
        innerText: structure.comments,
        contentEditable: 'true',
        id: `structure_${structure.structureid}_comments`
    });
    structure_row.append(structure_comments);

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
        classList: 'btn btn-info button-insert',
        id: `insert_resources_${structure.structureid}`,
        textContent: 'Insert a new resource',
    });
    structure_resources.append(insertResourceButton);

    // append resource block to structure row
    structure_row.append(structure_resources);

    // append structure row to structure block
    let button = container.childNodes[container.childNodes.length - 1];
    if (!button || !button.classList.contains('button-insert')) {
        container.append(structure_row);
    } else {
        container.insertBefore(structure_row, button);
    }
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
        id: `week_${week.weekid}`,
    });
    week_row.dataset.position = week.weekpostion;

    // week actions
    let week_actions = newEl('div', {
        classList: 'td center week-actions',
        id: `week_${week.weekid}_actions`,
    });
    week_row.append(week_actions);

    generateActions(week, 'week', week_actions);

    // week period
    let week_period = newEl('div', {
        classList: 'td center week-period',
        textContent: getWeekPeriod(week.day),
        id: `week_${week.weekid}_period`
    });
    week_row.append(week_period);

    // week name
    let week_name = newEl('div', {
        classList: 'td center week-name',
        innerText: week.weekname,
        contentEditable: 'true',
        id: `week_${week.weekid}_name`
    });
    week_row.append(week_name);

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
        classList: 'btn btn-info button-insert',
        id: `insert_structures_${week.weekid}`,
        textContent: 'Insert a new structure',
    });
    week_structures.append(insertStructureButton);

    // append structure block to week row
    week_row.append(week_structures);


    // append week row to table before the insert button, if it exists
    let button = container.childNodes[container.childNodes.length - 1];
    if (!button || !button.classList.contains('button-insert')) {
        container.append(week_row);
    } else {
        container.insertBefore(week_row, button);
    }
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
    if (parts[0] != '') {
        $(`#insert_${parts[2]}_${parts[1]}`).style.display = 'block';
    }
}

/**
 * hide the button for block insertion
 * @param  {Event} e
 */
function hideInsertButton(e) {
    let parts = e.currentTarget.id.split('_');
    if (parts[0] != '') {
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
	stopMoveBlock();
    let container = '';
    if (data.docid == getDocumentId()) {
        switch (data.block) {
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
    if (content) {
        let parts = e.currentTarget.id.split('_');
        let parentid = e.currentTarget.parentNode.parentNode.id.split('_')[1];
        parentid = parentid ? parentid : getDocumentId();

        let payload = {
            type: 'update',
            block: parts[0],
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

    switch (parts[0] + parts[2]) {
        case 'documentname':
            content = block.value;
            if (content.length < 255) {
                block.style.color = '#777';
            } else {
                block.style.color = 'red';
                return false;
            }
            break;

        case 'weekname':
            if (content.length < 255) {
                block.style.color = '#333';
            } else {
                block.style.color = 'red';
                return false;
            }
            break;

        case 'structurename':
            if (content.length < 255) {
                block.style.color = '#333';
            } else {
                block.style.color = 'red';
                return false;
            }
            break;

        case 'structurecomments':
            if (content.length < 65535) {
                block.style.color = '#333';
            } else {
                block.style.color = 'red';
                return false;
            }
            break;

        case 'resourcename':
            if (content.length < 255) {
                block.style.color = '#333';
            } else {
                block.style.color = 'red';
                return false;
            }
            break;

        case 'resourceurl':
            if (content.length < 2083 &&
                /^((ht|f)tp(s?)\:\/\/|~\/|\/)([\w]+\:[\w]+@)?(([a-zA-Z]{1}([\w\-]+\.)+([\w]+))|(([0-9]{1,3}\.){3}[0-9]{1,3})|localhost)(\:[\d]{1,5})?\/?([\w]*\/*)*(\.[\w]{3,4})?((\?\w+=\w+)?(&\w+=\w+)*)?(\#.+)?/.test(content)) {
                block.href = content;
                block.style.color = '';
            } else {
                block.style.color = 'red';
                return false;
            }
            break;

        default:
            return false;
            break;
    }

    if (content == '' || content == initialContent) {
        return false;
    }

    initialContent = '';
    return content;
}

/**
 * update a block
 * @param  {Object} data update data
 */
function updateBlock(data) {
    $(`#${data.block}_${data.id}_${data.property}`).innerText = data.value;
}

/**
 * delete a block
 * @param  {Event} e
 */
function sendDeleteBlock(e) {
    let parts = e.currentTarget.id.split('_');
    let block = $(`#${parts[0]}_${parts[1]}`);
    let parent = block.parentNode;
    if (window.confirm(`Are you sure you want to delete the ${parts[0]}? This action is irreversible!`)) {
        let payload = {
            type: 'delete',
            block: parts[0],
            id: parts[1],
            parent: parent.id.split('_')[0],
            parentid: parent.id.split('_')[1],
            position: block.dataset.position
        };
        callSocket(payload);
    }
}

/**
 * delete a block
 * @param  {Object} data delete data
 */
function deleteBlock(data) {
    let element = $(`#${data.block}_${data.id}`);
    let parent = element.parentNode
    let siblings = parent.children.length - 2;
    element.remove();
    if (siblings < 1) {
        let e = {};
        e.currentTarget = {
            id: 'insert_' + data.block + 's_' + parent.id.split('_')[1]
        }
        sendInsertBlock(e);
    }
}

function startMoveBlock(e) {
	if(!moveTarget) {
	    let parts = e.currentTarget.id.split('_');
	    moveTarget = $(`#${parts[0]}_${parts[1]}`);
	    moveTarget.style.opacity = 0.3;

	    if($(`.${parts[0]}`).length > 1) {
		    // disable current buttons
		    $(`#${parts[0]}_${parts[1]} button`).forEach(function(btn) {
		        btn.disabled = 'true';
		    })

		    // hide move and delete buttons for all similar blocks
		    $('.btn-move-' + parts[0]).forEach(function(btn) {
		        btn.style.display = 'none';
		    });
		    $('.btn-delete-' + parts[0]).forEach(function(btn) {
		        btn.style.display = 'none';
		    });
		    // display insert before and after buttons for all similar blocks
		    $('.btn-insert-before-' + parts[0]).forEach(function(btn) {
		        btn.style.display = 'inline-block';
		    });
		    $('.btn-insert-after-' + parts[0]).forEach(function(btn) {
		        btn.style.display = 'inline-block';
		    });
		}
		else {
			stopMoveBlock();
		}
	}
}

function stopMoveBlock() {
	if(moveTarget) {
		let parts = moveTarget.id.split('_');
		// reset opacity
		moveTarget.style.opacity = 1;
		moveTarget = false;

		if($(`.${parts[0]}`).length > 1) {
		    // enable current buttons
		    $(`#${parts[0]}_${parts[1]} button`).forEach(function(btn) {
		        btn.disabled = '';
		    })

		    // display move and delete buttons for all similar blocks
		    $('.btn-move-' + parts[0]).forEach(function(btn) {
		        btn.style.display = 'inline-block';
		    });
		    $('.btn-delete-' + parts[0]).forEach(function(btn) {
		        btn.style.display = 'inline-block';
		    });
		    // hide insert before and after buttons for all similar blocks
		    $('.btn-insert-before-' + parts[0]).forEach(function(btn) {
		        btn.style.display = 'none';
		    });
		    $('.btn-insert-after-' + parts[0]).forEach(function(btn) {
		        btn.style.display = 'none';
		    });
		}
	}
}

function insertBlockBefore(e) {
	let current = e.currentTarget.parentNode.parentNode;
	let moveParent = moveTarget.parentNode;

	let parent = current.parentNode;
	parent.append(moveTarget);

	parent.insertBefore(moveTarget, current);

	if(moveParent.children.length < 2) {
		moveParent.children[moveParent.children.length - 1].click();
	}

	let data = {
		type: 'move',
		block: moveTarget.id.split('_')[0],
		id: moveTarget.id.split('_')[1],
		parent: parent.id.split('_')[0],
		prevparentid: moveParent.id.split('_')[1],
		currparentid: parent.id.split('_')[1],
		prevpos: moveTarget.dataset.position,
		currpos: current.dataset.position != 0?parseInt(current.dataset.position) - 1:0,
	}
	stopMoveBlock();
	callSocket(data);
}

function insertBlockAfter(e) {
	let current = e.currentTarget.parentNode.parentNode;
	let moveParent = moveTarget.parentNode;

	let parent = current.parentNode;
	parent.append(moveTarget);

	parent.insertBefore(moveTarget, current.nextSibling);

	if(moveParent.children.length < 2) {
		moveParent.children[moveParent.children.length - 1].click();
	}

	let lastpos = parent.children.length - 2;
	let data = {
		type: 'move',
		block: moveTarget.id.split('_')[0],
		id: moveTarget.id.split('_')[1],
		parent: parent.id.split('_')[0],
		prevparentid: moveParent.id.split('_')[1],
		currparentid: parent.id.split('_')[1],
		prevpos: moveTarget.dataset.position,
		currpos: current.dataset.position != lastpos?parseInt(current.dataset.position) + 1:lastpos,
	}
	stopMoveBlock();
	callSocket(data);
}

function moveBlock(data) {
	callServer('/api/document/' + data.docid, {}, function(doc) {
        generateTable(doc);
    })
}