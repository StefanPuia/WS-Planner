'use strict';

// websocket variable
let ws;

// move target
let moveTarget = false;

// initial block content
let initialContent = '';

// block names for easy access
let _blocks = {
    week: {
        parent: 'document',
        child: 'structure',
    },

    structure: {
        parent: 'week',
        child: 'resource',
    },

    resource: {
        parent: 'structure',
        child: 'null',
    },
}

/**
 * handles the window load event
 */
window.addEventListener('load', async function() {
    let docid = getDocumentId();
    await gapi.auth2.getAuthInstance();

    ws = new WebSocket("ws://" + window.location.hostname + ":" + (window.location.port || 80) + "/" + docid);
    ws.addEventListener('message', receivedMessageFromServer);

    callServer('/api/document/' + docid, {}, function(status, doc) {
        if(status == 404) {
            window.location = '/';
        }
        else {
            generateTable(doc);

            $('.tbody').id = 'document_' + docid + '_weeks';

            // set the document name
            $('.document-name').value = doc.name;
            $('.document-name').style.display = "inline-block";
            $('.document-name').id = 'document_' + docid + '_name';
            $('.document-name').addEventListener('input', resizeDocumentName);
            $('.document-name').addEventListener('change', sendUpdate)
            resizeDocumentName();

            $('#docview').href = '/doc/' + docid + '/view';
            $('#share').addEventListener('click', function() {shareDocument()});
            $('.search-input').addEventListener('input', searchDocument);
        }
    })
})

/**
 * searches the current planner showing only the cells that contain the query and their parents
 */
function searchDocument() {
    let query = $('.search-input').value.trim().toLowerCase();

    // reset the planner if the query is empty
    if(query == '') {
        let weeks = $('.week');
        for(let i = 0; i < weeks.length; i++) {
            let week = weeks[i];
            week.style.display = '';
            let structures = week.querySelectorAll('.structure');
            for(let k = 0; k < structures.length; k++) {
                structures[k].style.display = '';
                let resources = structures[k].querySelectorAll('.resource');
                    for(let k = 0; k < resources.length; k++) {
                        resources[k].style.display = '';
                    }
            }
        }
    }
    else {
        let weeks = $('.week');
        for(let i = 0; i < weeks.length; i++) {
            let week = weeks[i];
            let found_week = false;
            if(week.textContent.toLowerCase().indexOf(query) > -1) {
                // if the query is found in the week name, show the whole week
                if(week.querySelector('.week-name').textContent.toLowerCase().indexOf(query) > -1) {
                    found_week = true;
                    week.style.display = '';
                    let structures = week.querySelectorAll('.structure');
                    for(let j = 0; j < structures.length; j++) {
                        structures[j].style.display = '';
                        let resources = structures[j].querySelectorAll('.resource');
                            for(let k = 0; k < resources.length; k++) {
                                resources[k].style.display = '';
                            }
                    }
                }
                else {
                    let structures = week.querySelectorAll('.structure');
                    for(let j = 0; j < structures.length; j++) {
                        let str = structures[j];
                        let found_str = false;
                        if(str.textContent.toLowerCase().indexOf(query) > -1) {
                            let name = str.querySelector('.structure-name').textContent.toLowerCase();
                            let comms = str.querySelector('.structure-comments').textContent.toLowerCase()
                            // if the query is found in the structure name or comments
                            // show the whole structure and the parent week
                            if(name.indexOf(query) > -1 || comms.indexOf(query) > -1) {
                                found_str = true;
                                found_week = true;
                                str.style.display = '';
                                week.style.display = '';
                                let resources = str.querySelectorAll('.resource');
                                for(let k = 0; k < resources.length; k++) {
                                    resources[k].style.display = '';
                                }
                            }
                            else {
                                let resources = str.querySelectorAll('.resource');
                                for(let k = 0; k < resources.length; k++) {
                                    let res = resources[k];
                                    if(res.textContent.toLowerCase().indexOf(query) > -1) {
                                        // if the query is found in the resource name
                                        // show the resource and the parent structure and week
                                        if(res.querySelector('.resource-name').textContent.toLowerCase().indexOf(query) > -1) {
                                            found_str = true;
                                            found_week = true;
                                            res.style.display = '';
                                            str.style.display = '';
                                            week.style.display = '';

                                        }
                                        else {
                                            res.style.display = 'none';
                                        }
                                    }
                                    else {
                                        res.style.display = 'none';
                                    }
                                }
                            }
                        }

                        if(!found_str) {
                            str.style.display = 'none';
                        }
                    }
                }
            }

            if(!found_week) {
                week.style.display = 'none';
            }
        }       
    }
}

/**
 * generate the document
 * @param  {Object} doc the json document object
 */
function generateTable(doc) {
    let container = $('.tbody');
    container.innerHTML = '';

    // generate each week and its components
    doc.weeks.forEach(function(week) {
        // generate the weeks
        generateWeek(week, container);
    });

    let insertWeekButton = newEl('button', {
        classList: 'btn btn-info',
        id: `insert_weeks_${getDocumentId()}`,
        textContent: 'Insert a new week',
    });
    container.append(insertWeekButton);
    insertWeekButton.addEventListener('click', sendInsertBlock)

    addEditableListeners();
}

/**
 * add the sendUpdate function for every editable container
 */
function addEditableListeners() {
    $('[contenteditable="true"]').forEach(function(el) {
    	el.addEventListener('focus', setInitialContent);
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
function generateActions(block, blockName, parent) {
    let container = newEl('div', {
        classList: 'action-buttons',
        id: blockName + '_' + block[blockName + 'id'] + '_actions',
    })

    let parentid = parent.id.split('_')[1];

    if(_blocks[blockName].child != 'null') {
        let insertButton = newEl('button', {
            classList: 'btn md-24 btn-info button-insert',
            id: `insert_${_blocks[blockName].child}s_${parentid}`,
            textContent: 'Insert a new ' + _blocks[blockName].child,
            contentEditable: 'false',
        }, {
            padding: '8px'
        });
        container.append(insertButton);
        insertButton.addEventListener('click', sendInsertBlock)
    }    

    // // move button
    // let button_move = newEl('button', {
    //     type: 'button',
    //     classList: `btn btn-sm btn-move-${blockName}`,
    //     id: `${blockName}_${block[blockName + 'id']}_move`
    // })
    // button_move.append(newEl('i', {
    //     classList: 'material-icons md-24',
    //     textContent: 'swap_vert',
    //     title: 'Click to move this ' + blockName + '.'
    // }))
    // container.append(button_move);
    // button_move.addEventListener('click', startMoveBlock);

    // move top button
    let button_move_top = newEl('button', {
        type: 'button',
        classList: `btn btn-success btn-sm btn-insert-before-${blockName} hidden`,
        id: `${blockName}_${block[blockName + 'id']}_move_top`,
        title: 'Click to move the ' + blockName + ' above this one.'
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
        id: `${blockName}_${block[blockName + 'id']}_move_bottom`,
        title: 'Click to move the ' + blockName + ' below this one.'
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
        id: `${blockName}_${block[blockName + 'id']}_delete`,
        title: 'Click to delete the ' + blockName + '.'
    })
    button_delete.append(newEl('i', {
        classList: 'material-icons md-24',
        textContent: 'clear'
    }))
    button_delete.addEventListener('click', sendDeleteBlock);
    container.append(button_delete);

    parent.append(container);
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

    // resource name
    let resource_name = newEl('div', {
        classList: 'td resource-name',
        contentEditable: 'true',
        textContent: resource.resourcename,
        id: `resource_${resource.resourceid}_name`
    });
    resource_row.append(resource_name);

    generateActions(resource, 'resource', resource_row);
    resource_row.addEventListener('mouseenter', showActions);
    resource_row.addEventListener('mouseleave', hideActions);

    // resource url
    let resource_url = newEl('a', {
        classList: 'td resource-url',
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

    // structure name
    let structure_name = newEl('div', {
        classList: 'td structure-name',
        textContent: structure.structurename,
        contentEditable: 'true',
        id: `structure_${structure.structureid}_name`
    });
    structure_row.append(structure_name);

    generateActions(structure, 'structure', structure_row);
    structure_row.addEventListener('mouseenter', showActions);
    structure_row.addEventListener('mouseleave', hideActions);

    // structure comments
    let structure_comments = newEl('div', {
        classList: 'td structure-comments',
        textContent: structure.comments,
        contentEditable: 'true',
        id: `structure_${structure.structureid}_comments`
    });
    structure_row.append(structure_comments);

    // structure resources
    let structure_resources = newEl('div', {
        classList: 'structure-resources',
        id: `structure_${structure.structureid}_resources`
    });

    // generate each resource and its components
    structure.resources.forEach(function(resource) {
        generateResource(resource, structure_resources);
    })

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
    week_row.dataset.position = week.weekposition;

    // week name
    let week_name = newEl('div', {
        classList: 'td week-name',
        textContent: week.weekname,
        contentEditable: 'true',
        id: `week_${week.weekid}_name`
    });
    week_row.append(week_name);

    generateActions(week, 'week', week_row);
    week_row.addEventListener('mouseenter', showActions);
    week_row.addEventListener('mouseleave', hideActions);

    // // week period
    // let week_period = newEl('div', {
    //     id: `week_${week.weekid}_period`,
    //     classList: 'td center week-period',
    // });
    // week_period.addEventListener('click', showPeriodInput);
    // // week period text
    // let week_dates = newEl('span', {
    //     textContent: getWeekPeriod(week.day).start + '\nto\n' + getWeekPeriod(week.day).end,
    //     id: `week_${week.weekid}_period_text`
    // }); week_period.append(week_dates);
    // // week period input
    // let week_period_input = newEl('input', {
    //     type: 'date',
    //     classList: 'hidden fill',
    //     id: `week_${week.weekid}_period_input`,
    //     value: week.day,
    // }); 
    // week_period_input.addEventListener('blur', sendUpdate);
    // week_period.append(week_period_input);
    // week_row.append(week_period);

    // week structure
    let week_structures = newEl('div', {
        classList: 'week-structure',
        id: `week_${week.weekid}_structures`
    })

    week.structures.forEach(function(structure) {
        // generate each structure and its components
        generateStructure(structure, week_structures);
    })
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
}

/**
 * display the button for block insertion
 * @param  {Event} e
 */
function showActions(e) {
    let parts = e.currentTarget.id.split('_');
    if (parts[0] != '') {
        $(`#${parts[0]}_${parts[1]}_actions`).style.display = 'block';
    }
}

/**
 * hide the button for block insertion
 * @param  {Event} e
 */
function hideActions(e) {
    let parts = e.currentTarget.id.split('_');
    if (parts[0] != '') {
        $(`#${parts[0]}_${parts[1]}_actions`).style.display = 'none';
    }
}

/**
 * send the request for block insertion
 * @param  {Event} e 
 */
function sendInsertBlock(e) {
    let parts = e.currentTarget.id.split('_');
    let payload = {
        type: 'insert',
        block: parts[1].slice(0, -1),
        parentid: parts[2],
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
            case 'week':
                container = '.tbody';
                generateWeek(data.weeks[0], $(container));
                $(container).append($('#insert_weeks_' + data.docid));
                $(`#week_${data.weeks[0].weekid}_name`).focus();
                break;

            case 'structure':
                container = `#${data.parent}_${data.parentid}_${data.block}s`;
                generateStructure(data.structures[0], $(container));
                $(`#structure_${data.structures[0].structureid}_name`).focus();
                break;

            case 'resource':
                container = `#${data.parent}_${data.parentid}_${data.block}s`;
                generateResource(data.resources[0], $(container));
                $(`#resource_${data.resources[0].resourceid}_name`).focus();
                break;
        }
        addEditableListeners();
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
    let content = block.childNodes.length > 0 ? block.childNodes[0].textContent : '';

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

        case 'weekperiod':
            content = block.value;
            let date = new Date(content);
            if(!isNaN(date.valueOf())) {
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

    if (content == initialContent) {
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
    switch(data.block + data.property) {
        case 'documentname':
            $('.document-name').value = data.value;
            resizeDocumentName();
            break;

        default:
            $(`#${data.block}_${data.id}_${data.property}`).childNodes[0].textContent = data.value;
            break;
    }    
}

/**
 * delete a block
 * @param  {Event} e
 */
function sendDeleteBlock(e) {
    let parts = e.currentTarget.id.split('_');
    let block = $(`#${parts[0]}_${parts[1]}`);
    let parent = block.parentNode;
    let content = $(`#${parts[0]}_${parts[1]}_name`).textContent;
    let blockdesc = content != '' ? `"${content}" ${parts[0]}` : parts[0];
    if (window.confirm(`Are you sure you want to delete the ${blockdesc}? This action is irreversible!`)) {
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
    let parent = element.parentNode;
    let siblings = parent.querySelectorAll('.' + data.block);
    console.log(siblings);
    element.remove();
    if (siblings.length - 1 <= 0) {
        let e = {};
        e.currentTarget = {
            id: 'insert_' + data.block + 's_' + parent.id.split('_')[1]
        }
        sendInsertBlock(e);
    }
}

/**
 * begin the moving of the block
 * hide the move and delete buttons and show the append ones
 * @param  {Event} e
 */
function startMoveBlock(e) {
	if(!moveTarget) {
	    let parts = e.currentTarget.id.split('_');
	    moveTarget = $(`#${parts[0]}_${parts[1]}`);
	    moveTarget.style.opacity = 0.3;

	    if($(`.${parts[0]}`).length > 1) {
            // add the cancel event on "Escape"
            window.addEventListener('keydown', function(e) {
                if(e.keyCode == 27) {
                    stopMoveBlock();
                }
            })

		    // disable current buttons
		    $(`#${parts[0]}_${parts[1]} button`).forEach(function(btn) {
		        btn.disabled = 'true';
		    })

            // make the actions group visible
            $(`.${parts[0]} .action-buttons`).forEach(function(group) {
                group.style.display = '';
                group.style.opacity = '1';
            })

		    // hide move and delete buttons for all similar blocks
		    $('.btn-move-' + parts[0]).forEach(function(btn) {
		        btn.setAttribute('style', 'display:none!important');
		    });
		    $('.btn-delete-' + parts[0]).forEach(function(btn) {
		        btn.setAttribute('style', 'display:none!important');
		    });
		    // display insert before and after buttons for all similar blocks
		    $('.btn-insert-before-' + parts[0]).forEach(function(btn) {
		        btn.setAttribute('style', 'display:inline-block!important');
		    });
		    $('.btn-insert-after-' + parts[0]).forEach(function(btn) {
		        btn.setAttribute('style', 'display:inline-block!important');
		    });
		}
		else {
			stopMoveBlock();
		}
	}
}

/**
 * stop the moving of the block
 * show the delete and move buttons and hide the append ones
 */
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

            // make the actions group invisible
            $(`.${parts[0]} .action-buttons`).forEach(function(group) {
                group.style.display = 'none';
                group.style.opacity = '0.2';
            })

		    // display move and delete buttons for all similar blocks
		    $('.btn-move-' + parts[0]).forEach(function(btn) {
		        btn.setAttribute('style', 'display:inline-block!important');
		    });
		    $('.btn-delete-' + parts[0]).forEach(function(btn) {
		        btn.setAttribute('style', 'display:inline-block!important');
		    });
		    // hide insert before and after buttons for all similar blocks
		    $('.btn-insert-before-' + parts[0]).forEach(function(btn) {
		        btn.setAttribute('style', 'display:none!important');
		    });
		    $('.btn-insert-after-' + parts[0]).forEach(function(btn) {
		        btn.setAttribute('style', 'display:none!important');
		    });
		}
	}
}

/**
 * insert the moveTarget before the current element
 * supports cross parent appending
 * @param  {Event} e
 */
function insertBlockBefore(e) {
	let current = e.currentTarget.parentNode.parentNode;
	let moveParent = moveTarget.parentNode;

	let parent = current.parentNode;
	parent.append(moveTarget);

	parent.insertBefore(moveTarget, current);

    // if there are no children left, click the insert button
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

/**
 * insert the moveTarget after the current element
 * supports cross parent appending
 * @param  {Event} e
 */
function insertBlockAfter(e) {
	let current = e.currentTarget.parentNode.parentNode;
	let moveParent = moveTarget.parentNode;

	let parent = current.parentNode;
	parent.append(moveTarget);

	parent.insertBefore(moveTarget, current.nextSibling);

    // if there are no children left, click the insert button
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

/**
 * regenerate the table when a move request is received
 * @param  {Object} data
 */
function moveBlock(data) {
	callServer('/api/document/' + data.docid, {}, function(status, doc) {
        if(status == 404) {
            window.location = '/';
        }
        else {
            generateTable(doc);
        }
    })
}

/**
 * set the initial content of a contenteditable block such that
 * an update request is not sent if the block has not changed
 * @param {Event} e
 */
function setInitialContent(e) {
    initialContent = e.currentTarget.childNodes.length > 0 ? e.currentTarget.childNodes[0].textContent : ''; 
}