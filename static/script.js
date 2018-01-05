'use strict';

// variable declaration
let ws = new WebSocket("ws://" + window.location.hostname + ":" + (window.location.port || 80) + "/");
let clientid = new Date().getTime().toString() + Math.floor((Math.random() * 900) + 100);
let sessionid = "";

// run functions when the page is loaded
$(document).ready(function() {
    addListeners();
    ws.send(JSON.stringify({
        "type": "clientid",
        "value": clientid
    }))
})

// add listeners
function addListeners() {
    // webSocket message received listener
    ws.addEventListener("message", receivedMessageFromServer);

    // edit resources table cells
    document.querySelectorAll("td.td_res").forEach(function(el) {
        el.addEventListener('click',
            function(e) {
                editRes(e.currentTarget);
            });
    })

    // save resources button in modal
    document.querySelector('#buttonResourcesSave').addEventListener('click', saveRes);

    // save table on table cells blur
    document.querySelectorAll('[contenteditable="true"]').forEach(function(el) {
        el.addEventListener('blur',
            function(e) {
                saveContent(e.currentTarget);
            });
    })

    // save structure button in modal
    document.querySelector('#buttonStructuresSave').addEventListener('click', saveStr);

    // edit period table cells
    document.querySelectorAll("td.td_wpe").forEach(function(el) {
        el.addEventListener('click',
            function(e) {
                editPer(e.currentTarget);
            });
    })

    // save period button in modal
    document.querySelector('#buttonPeriodSave').addEventListener('click', savePer);
}

// make a post request
function postToServer(data, url) {
    $.post(url, data);
    data.clientid = clientid;
    ws.send(JSON.stringify(data));
}

// receive table update from server
function receivedMessageFromServer(e) {
    let data = JSON.parse(e.data);
    console.log(data);

    switch(data.type) {
        case 'clientid':
            clientid = data.value;
            break;

        case 'sessionid':
            sessionid = data.value;
            break;

        case 'null':
            update();
            break;

        case 'wpe':
        case 'wna':
        case 'str':
        case 'com':
        case 'res':
            updateTable(data);
            break;
    }
}

// async update table
async function update() {
    const response = await fetch('/api/table/get');
    const data = await response.text();
    document.querySelector('.planner tbody').innerHTML = data;
    addListeners();
}

// update table from parameter
function updateTable(data) {
    if(data.type != "null") {
        document.querySelector(`#${data.id}`).innerHTML = data.value.split(/\n|\r|\n\r/gm).join('<br>');   
    }
}


//// RESOURCES ////

// add
function addRes(el) {
    let form = document.querySelector('#formResources');

    let i = parseInt(el.dataset.length);
    el.dataset.length = i + 1;

    let div = document.createElement('div');
    div.id = `res_${i}`;
    let content = `
                <div class="form-group">
                    <label>Name</label>
                    <input required type="text" class="form-control res_name" value="">
                </div>
                <div class="form-group">
                    <label>URL</label>
                    <input required type="url" class="form-control res_url" value="">
                </div>
                <div class="form-group">
                    <label>Action</label>
                    <button type="button" onclick="moveResUp(${i})" class="btn btn-default"><i class="glyphicon glyphicon-chevron-up"></i></button>
                    <button type="button" onclick="moveResDown(${i})" class="btn btn-default"><i class="glyphicon glyphicon-chevron-down"></i></button>
                    <button type="button" onclick="delRes(${i})" class="btn btn-danger"><i class="glyphicon glyphicon-remove"></i></button>
                </div>
                <br /><br />`;

    div.innerHTML += content;
    form.appendChild(div);
}

// edit
function editRes(el) {
    let body = document.querySelector('#bodyModalResources');
    let content = `<div class="container"><form class="form-inline" id="formResources" data-id="${el.id}">`;
    let lis = el.querySelectorAll('ul li');
    let i = 0;
    lis.forEach(function(li) {
        let name = li.querySelector('b').textContent.split(':').slice(0, -1).join(':');
        let url = li.querySelector('a').textContent;
        content += `
                <div id="res_${i}">
                    <div class="form-group">
                        <label>Name</label>
                        <input required type="text" class="form-control res_name" value="${name?name:""}">
                    </div>
                    <div class="form-group">
                        <label>URL</label>
                        <input required type="url" class="form-control res_url" value="${url?url:""}">
                    </div>
                    <div class="form-group">
                        <label>Action</label>
                        <button type="button" onclick="moveResUp(${i})" class="btn btn-default"><i class="glyphicon glyphicon-chevron-up"></i></button>
                        <button type="button" onclick="moveResDown(${i})" class="btn btn-default"><i class="glyphicon glyphicon-chevron-down"></i></button>
                        <button type="button" onclick="delRes(${i})" class="btn btn-danger"><i class="glyphicon glyphicon-remove"></i></button>
                    </div>
                    <br /><br />
                </div>`;
        i++;
    })

    content += `</form>
                <br /><button type="button" onclick="addRes(this);" data-length=${lis.length} class="btn btn-info"><i class="glyphicon glyphicon-plus"></i></button>
            </div>`;

    body.innerHTML = content;
    $('#modalResourcesEdit').modal('show');
}

// move up
function moveResUp(id) {
    let divs = document.querySelectorAll('#formResources > div');
    let i = -1;
    divs.forEach(function(el, index) {
        if (`res_${id}` == el.id) {
            i = index;
        }
    })
    if (i > 0) {
        divs[i].parentNode.insertBefore(divs[i], divs[i - 1]);
    }
}

// move down
function moveResDown(id) {
    let divs = document.querySelectorAll('#formResources > div');
    let i = divs.length + 10;
    divs.forEach(function(el, index) {
        if (`res_${id}` == el.id) {
            i = index;
        }
    })
    if (i <= divs.length - 2) {
        divs[i].parentNode.insertBefore(divs[i], divs[i + 2]);
    } else if (i == divs.length - 1) {
        divs[i].parentNode.appendChild(divs[i]);
    }
}

//save
function saveRes() {
    let divs = document.querySelectorAll('#formResources > div');
    let id = document.querySelector('#formResources').dataset.id;
    let data = {
        "type": "res",
        "res": [],
        "id": id
    };
    divs.forEach(function(el) {
        let item = {};
        item.name = el.querySelector('.res_name').value;
        item.url = el.querySelector('.res_url').value;
        if (item.name && item.url) {
            data.res.push(item);
        }
    })
    postToServer(data, '/api/res/update');
    $('#modalResourcesEdit').modal('hide');
}

// delete
function delRes(id) {
    let res = document.querySelector(`#res_${id}`);
    res.remove();
}


//// WEEKS ////

// new week
function newWeek() {
    postToServer({"type":"null"}, '/api/week/new');
    update();
}

// move up
function moveWeekUp(id) {
    let data = {
        "type": "null",
        "id": id
    };
    postToServer(data, '/api/week/up');
    update();
}

// move down
function moveWeekDown(id) {
    let data = {
        "type": "null",
        "id": id
    };
    postToServer(data, '/api/week/down');
    update();
}

// delete week
function deleteWeek(id) {
    if (window.confirm("Are you sure you want to delete this week?\nThe action is irreversible!")) {
        let data = {
            "type": "null",
            "id": id
        };
        postToServer(data, '/api/week/delete');
        update();
    }
}


//// STRUCTURES ////

// add structure
function addStr(el) {
    let form = document.querySelector('#formStructures');

    let i = parseInt(el.dataset.length);
    el.dataset.length = i + 1;

    let div = document.createElement('div');
    div.id = `str_${i}`;
    let content = `
                <div class="form-group">
                    <label>Name</label>
                    <input required type="text" class="form-control str_name" value="">
                </div>
                <div class="form-group">
                    <label>Action</label>
                    <button type="button" onclick="moveStrUp(${i})" class="btn btn-default"><i class="glyphicon glyphicon-chevron-up"></i></button>
                    <button type="button" onclick="moveStrDown(${i})" class="btn btn-default"><i class="glyphicon glyphicon-chevron-down"></i></button>
                    <button type="button" onclick="delStr(${i})" class="btn btn-danger"><i class="glyphicon glyphicon-remove"></i></button>
                </div>
                <br /><br />`;

    div.innerHTML += content;
    document.querySelector('#alertStructuresEmpty').remove();
    form.appendChild(div);
}

// edit structures
async function editStr(id) {
    const response = await fetch(`api/week/get?id=${id}`);
    const week = await response.json();
    let body = document.querySelector('#bodyModalStructures');
    let content = `<div class="container"><form class="form-inline" id="formStructures" data-id="${id}">`;
    let structs = week.str;
    let i = 0;
    structs.forEach(function(str) {
        let name = str.name;
        content += `
                <div id="str_${i}">
                    <div class="form-group">
                        <label>Name</label>
                        <input required type="text" class="form-control str_name" value="${name?name:""}">
                    </div>
                    <div class="form-group">
                        <label>Action</label>
                        <button type="button" onclick="moveStrUp(${i})" class="btn btn-default"><i class="glyphicon glyphicon-chevron-up"></i></button>
                        <button type="button" onclick="moveStrDown(${i})" class="btn btn-default"><i class="glyphicon glyphicon-chevron-down"></i></button>
                        <button type="button" onclick="delStr(${i})" class="btn btn-danger"><i class="glyphicon glyphicon-remove"></i></button>
                    </div>
                    <br /><br />
                </div>`;
        i++;
    })

    content += `</form>
                <br /><button type="button" onclick="addStr(this);" data-length=${structs.length} class="btn btn-info"><i class="glyphicon glyphicon-plus"></i></button>
            </div>`;

    body.innerHTML = content;
    $('#modalStructuresEdit').modal('show');
}

// move structure up
function moveStrUp(id) {
    let divs = document.querySelectorAll('#formStructures > div');
    let i = -1;
    divs.forEach(function(el, index) {
        if (`str_${id}` == el.id) {
            i = index;
        }
    })
    if (i > 0) {
        divs[i].parentNode.insertBefore(divs[i], divs[i - 1]);
    }
}

// move structure down
function moveStrDown(id) {
    let divs = document.querySelectorAll('#formStructures > div');
    let i = divs.length + 10;
    divs.forEach(function(el, index) {
        if (`str_${id}` == el.id) {
            i = index;
        }
    })
    if (i <= divs.length - 2) {
        divs[i].parentNode.insertBefore(divs[i], divs[i + 2]);
    } else if (i == divs.length - 1) {
        divs[i].parentNode.appendChild(divs[i]);
    }
}

// save structure
function saveStr() {
    let divs = document.querySelectorAll('#formStructures > div');
    let id = document.querySelector('#formStructures').dataset.id;
    let data = {
        "type": "null",
        "str": [],
        "id": id
    };
    divs.forEach(function(el) {
        let item = {};
        item.id = el.id;
        item.name = el.querySelector('.str_name').value;
        if (item.name) {
            data.str.push(item);
        }
    })
    if(data.str.length > 0) {
        postToServer(data, '/api/str/update');
        update();
        $('#modalStructuresEdit').modal('hide');
    }
    else {
        let alert = document.querySelector('#alertStructuresEmpty');
        if(!alert) {
            alert = document.createElement('div');
            alert.classList.add('alert','alert-danger');
            alert.role = "alert";
            alert.id = "alertStructuresEmpty";
            alert.textContent = "A week can only have one or more structure blocks. Please add one or delete the week.";
            document.querySelector('#bodyModalStructures').prepend(alert);
        }
    }
}

// delete structure
function delStr(id) {
    if (window.confirm(`Are you sure you want to delete this structure?\nThis will also delete the comments and resources assigned to this structure!\nThis action is irreversible!`)) {
        let str = document.querySelector(`#str_${id}`);
        str.remove();
    }
}


//// CONTENT ////

// save content
function saveContent(el) {
    let data = {
        "type": el.id.split('_')[1],
        "id": el.id,
        "value": el.innerText
    };
    postToServer(data, '/api/content/update');
}


//// PERIOD ////

// change week period
function editPer(el) {
    let id = parseInt(el.id.split('_')[2]);
    let body = document.querySelector('#bodyModalPeriod');
    let content = `
        <div class="form-group">
            <label for="inputDate" class="control-label">Enter first date of the week</label>
            <input id="inputDate" type="date" class="form-control" data-id="${id}">
        </div>`;

    body.innerHTML = content;

    $('#modalPeriodEdit').modal('show');
}

// save period
function savePer() {
    let input = document.querySelector('#inputDate');
    if (input.value) {
        let data = {
            "type": "wpe",
            "id": input.dataset.id,
            "value": input.value
        }
        postToServer(data, '/api/period/update');
        $('#modalPeriodEdit').modal('hide');
    } else {
        input.parentElement.classList.add('has-error');
    }

}