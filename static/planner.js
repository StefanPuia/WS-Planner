'use strict';

// websocket variable
let ws;

// drag move target
let moveTarget = false;

// current dragover target
let currentlyOver = false;

// initial block content
let initialContent = '';

// block names for easy access
let _blocks = {
    week: {
        parent: 'tbody',
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

// temporary object
let temp = {
    name: 'temporary document',
    id: 'temp',
    weeks: [{
        weekid: 'temp',
        structures: [{
            structureid: 'temp',
            resources: [{
                resourceid: 'temp',
            }]
        }]
    }]
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
        if (status == 404) {
            window.location = '/';
        } else {
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
            $('#share').addEventListener('click', function() {
                shareDocument()
            });
            $('.search-input').addEventListener('input', searchDocument);
            $('#cancel-move').addEventListener('click', stopMoveBlock);

            $('#loading').classList.add('hidden');
            $('#planner').classList.remove('hidden');
        }
    })
})

/**
 * searches the current planner showing only the cells that contain the query and their parents
 */
function searchDocument() {
    let query = $('.search-input').value.trim().toLowerCase();

    // reset the planner if the query is empty
    if (query == '') {
        ['week', 'structure', 'resource'].forEach(function(blockName) {
            let blocks = $('.' + blockName, true);
            for (let i = 0; i < blocks.length; i++) {
                blocks[i].style.display = '';
            }
        })
    } else {
        let weeks = $('.week', true);
        for (let i = 0; i < weeks.length; i++) {
            let week = weeks[i];
            let found_week = false;
            if (week.textContent.toLowerCase().indexOf(query) > -1) {
                // if the query is found in the week name, show the whole week
                if (week.querySelector('.week-name').textContent.toLowerCase().indexOf(query) > -1) {
                    found_week = true;
                    week.style.display = '';
                    let structures = week.querySelectorAll('.structure');
                    for (let j = 0; j < structures.length; j++) {
                        structures[j].style.display = '';
                        let resources = structures[j].querySelectorAll('.resource');
                        for (let k = 0; k < resources.length; k++) {
                            resources[k].style.display = '';
                        }
                    }
                } else {
                    let structures = week.querySelectorAll('.structure');
                    for (let j = 0; j < structures.length; j++) {
                        let str = structures[j];
                        let found_str = false;
                        if (str.textContent.toLowerCase().indexOf(query) > -1) {
                            let name = str.querySelector('.structure-name').textContent.toLowerCase();
                            let comms = str.querySelector('.structure-comments').textContent.toLowerCase()
                                // if the query is found in the structure name or comments
                                // show the whole structure and the parent week
                            if (name.indexOf(query) > -1 || comms.indexOf(query) > -1) {
                                found_str = true;
                                found_week = true;
                                str.style.display = '';
                                week.style.display = '';
                                let resources = str.querySelectorAll('.resource');
                                for (let k = 0; k < resources.length; k++) {
                                    resources[k].style.display = '';
                                }
                            } else {
                                let resources = str.querySelectorAll('.resource');
                                for (let k = 0; k < resources.length; k++) {
                                    let res = resources[k];
                                    if (res.textContent.toLowerCase().indexOf(query) > -1) {
                                        // if the query is found in the resource name
                                        // show the resource and the parent structure and week
                                        if (res.querySelector('.resource-name').textContent.toLowerCase().indexOf(query) > -1) {
                                            found_str = true;
                                            found_week = true;
                                            res.style.display = '';
                                            str.style.display = '';
                                            week.style.display = '';

                                        } else {
                                            res.style.display = 'none';
                                        }
                                    } else {
                                        res.style.display = 'none';
                                    }
                                }
                            }
                        }

                        if (!found_str) {
                            str.style.display = 'none';
                        }
                    }
                }
            }

            if (!found_week) {
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
    resetWeekNumbers();
    fixMoveButtons();
}

/**
 * add the sendUpdate function to every editable container
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
        classList: 'action-buttons action-' + blockName,
        id: blockName + '_' + block[blockName + 'id'] + '_actions',
    })

    let parentid = parent.id.split('_')[1];

    // move button
    if (_blocks[blockName].parent != 'tbody') {
        let button_move = newEl('button', {
            type: 'button',
            classList: `btn btn-sm btn-move btn-move-${blockName}`,
            id: `${blockName}_${block[blockName + 'id']}_move`
        })
        button_move.append(newEl('i', {
            classList: 'material-icons md-24',
            textContent: 'swap_vert',
            title: 'Click to move this ' + blockName + '.'
        }))
        container.append(button_move);
        button_move.addEventListener('click', startMoveBlock);
    }

    // delete button
    let button_delete = newEl('button', {
        type: 'button',
        classList: `btn btn-danger btn-sm btn-delete btn-delete-${blockName}`,
        id: `${blockName}_${block[blockName + 'id']}_delete`,
        title: 'Click to delete the ' + blockName + '.'
    })
    button_delete.append(newEl('i', {
        classList: 'material-icons md-24',
        textContent: 'clear'
    }))
    button_delete.addEventListener('click', sendDeleteBlock);
    container.append(button_delete);

    if (_blocks[blockName].child != 'null') {
        let insertButton = newEl('button', {
            classList: 'btn md-24 btn-info button-insert',
            id: `insert_${_blocks[blockName].child}s_${parentid}`,
            textContent: 'Insert a new ' + _blocks[blockName].child,
            contentEditable: 'false',
            title: 'Click to insert a new ' + _blocks[blockName].child + ' under this ' + blockName + '.',
        }, {
            padding: '8px'
        });
        container.append(insertButton);
        insertButton.addEventListener('click', sendInsertBlock)
    }

    parent.append(container);
}

/**
 * generate the resources block
 * @param  {Object} structure           the json structure object
 * @param  {Node} structure_resources the container for resources
 */
function generateResource(resource, container, structure) {
    // resource row
    let resource_row = newEl('div', {
        classList: 'resource',
        id: `resource_${resource.resourceid}`
    })
    resource_row.dataset.position = resource.resourceposition;
    resource_row.dataset.parentid = structure.structureid;

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
function generateStructure(structure, container, week) {
    // structure row
    let structure_row = newEl('div', {
        classList: 'structure',
        id: `structure_${structure.structureid}`
    });
    structure_row.dataset.position = structure.structureposition;
    structure_row.dataset.parentid = week.weekid;

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
        generateResource(resource, structure_resources, structure);
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
function generateWeek(week, container, number = false) {
    // week row
    let week_row = newEl('div', {
        classList: 'week',
        id: `week_${week.weekid}`,
    });
    week_row.dataset.position = week.weekposition;
    week_row.dataset.parentid = getDocumentId();

    let weeks = container.querySelectorAll('.week').length;
    number = number ? number : weeks + 1
        // week name
    let week_number = newEl('div', {
        classList: 'td center week-number',
        draggable: 'true',
    });
    week_number.addEventListener('dragstart', startWeekDrag)
    week_number.addEventListener('dragend', stopWeekDrag)
    week_number.addEventListener('dragover', moveHere);
    week_row.append(week_number);

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

    // week structure
    let week_structures = newEl('div', {
        classList: 'week-structures',
        id: `week_${week.weekid}_structures`
    })

    week.structures.forEach(function(structure) {
        // generate each structure and its components
        generateStructure(structure, week_structures, week);
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
 * display the block actions
 * @param  {Event} e
 */
function showActions(e) {
    let parts = e.currentTarget.id.split('_');
    if (parts[0] != '') {
        $(`#${parts[0]}_${parts[1]}_actions`).style.display = 'block';
    }
}

/**
 * hide the block actions
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
                generateStructure(data.structures[0], $(container), {
                    weekid: data.parentid
                });
                $(`#structure_${data.structures[0].structureid}_name`).focus();
                break;

            case 'resource':
                container = `#${data.parent}_${data.parentid}_${data.block}s`;
                generateResource(data.resources[0], $(container), {
                    structureid: data.parentid
                });
                $(`#resource_${data.resources[0].resourceid}_name`).focus();
                break;
        }
        addEditableListeners();
        resetWeekNumbers();
        fixMoveButtons();
    }
}

/**
 * send the request for block update
 * @param  {Event} e
 */
function sendUpdate(e) {
    let content = validField(e.currentTarget);
    if (content !== false) {
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

        case 'weekperiod':
            content = block.value;
            let date = new Date(content);
            if (!isNaN(date.valueOf())) {
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
    switch (data.block + data.property) {
        case 'documentname':
            $('.document-name').value = data.value;
            resizeDocumentName();
            break;

        default:
            $(`#${data.block}_${data.id}_${data.property}`).innerText = data.value;
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
    let content = $(`#${parts[0]}_${parts[1]}_name`).innerText;
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
    element.remove();
    resetWeekNumbers();
    fixMoveButtons();
}

/**
 * begin the movement of the block
 * hide the move and delete buttons and show the append ones
 * @param  {Event} e
 */
function startMoveBlock(e) {
    if (!moveTarget) {
        let parts = e.currentTarget.id.split('_');
        moveTarget = $(`#${parts[0]}_${parts[1]}`);
        moveTarget.style.display = 'none';

        if ($(`.${parts[0]}`).length > 1) {
            // add the cancel event on "Escape"
            window.addEventListener('keydown', function(e) {
                if (e.keyCode == 27) {
                    stopMoveBlock();
                }
            })

            let parents = $('.' + _blocks[parts[0]].parent, true);
            parents.forEach(function(parent) {
                let last = parent.querySelectorAll('.' + parts[0])[parent.querySelectorAll('.' + parts[0]).length - 1]
                last.parentNode.append(newEl('div', {
                    textContent: 'insert here',
                    classList: parts[0] + ' block-placeholder td',
                    id: 'into_' + last.id,
                }));
            });

            $('.tbody').append($('#insert_weeks_' + getDocumentId()));
            $('#move-alert-text').innerText = 'You are moving the ' + parts[0] + ` "${$(`#${parts[0]}_${parts[1]}_name`).innerText.substr(0, 30)}".`;
            $('.move-alert').style.display = 'block';

            $('.block-placeholder', true).forEach(function(placeholder) {
                placeholder.addEventListener('click', function(e) {
                    let phParts = e.currentTarget.id.split('_');
                    let data = {
                        type: 'move',
                        block: phParts[1],
                        id: parts[1],
                        parent: _blocks[phParts[1]].parent,
                        prevparentid: moveTarget.dataset.parentid,
                        currparentid: $(`#${phParts[1]}_${phParts[2]}`).dataset.parentid,
                    }
                    
                    // console.log(data);
                    stopMoveBlock();
                    callSocket(data);
                })
            })

		    // disable current buttons
		    $(`#${parts[0]}_${parts[1]} button`).forEach(function(btn) {
		        btn.disabled = 'true';
		    })
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
		moveTarget.style.display = '';
		moveTarget = false;

        let blocks = $('.block-placeholder', true);
        blocks.forEach(function(block) {
            block.remove();
        })

		if($(`.${parts[0]}`).length > 1) {
		    // enable current buttons
		    $(`#${parts[0]}_${parts[1]} button`).forEach(function(btn) {
		        btn.disabled = '';
		    })
		}

        $('.move-alert').style.display = 'none';
	}
}

/**
 * begin the week drag
 * insert a blank temporary week
 * @param  {Event} e
 */
function startWeekDrag(e) {
    moveTarget = e.currentTarget.parentNode;
    let btn_insert = $('#insert_weeks_' + getDocumentId());
    generateWeek(temp.weeks[0], moveTarget.parentNode);
    moveTarget.parentNode.insertBefore($('#week_temp'), btn_insert);
}

/**
 * stop the week dragging process
 * send all the week ids and their respective positions to the server
 * @param  {Event} e
 */
function stopWeekDrag(e) {
    moveTarget = false;
    currentlyOver = false;
    $('#week_temp').remove();
    let weeks = $('.week-number', true);
    let newPositions = [];
    for(let i = 0; i < weeks.length; i++) {
        weeks[i].textContent = i + 1;
        let id = weeks[i].parentNode.id.split('_').slice(-1).pop();
        newPositions.push({
            id: id,
            position: i,
        })
    }
    let payload = {
        type: 'reorderweeks',
        positions: newPositions,
    }
    callSocket(payload);
}

/**
 * insert the current dragged week before the current dragover target
 * @param  {Event} e
 */
function moveHere(e) {
    let current = e.currentTarget.parentNode;
    e.preventDefault();
    // check if the dragover target is different to avoid unnecessary appendings
    if(moveTarget != current && currentlyOver != current) {
        currentlyOver = current;
        currentlyOver.parentNode.insertBefore(moveTarget, currentlyOver);
    }
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
    initialContent = e.currentTarget.innerText;
}

/**
 * resets the week numbers to an ordered list
 */
function resetWeekNumbers() {
    let weeks = $('.tbody').querySelectorAll('.week');
    weeks.forEach(function(week, key) {
        week.querySelector('.week-number').innerText = key + 1;
    })
}

/**
 * display the move buttons only if there is a different parent to move the block to
 */
function fixMoveButtons() {
    ['structure', 'resource'].forEach(function(block) {
        if($('.tbody .' + _blocks[block].parent, true).length > 1) {
            $('.tbody .btn-move-' + block, true).forEach(function(btn) {
                btn.style.visibility = '';
            })
        }
        else {
            $('.btn-move-' + block, true).forEach(function(btn) {
                btn.style.visibility = 'hidden';
            })
        }
    })
}