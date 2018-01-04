'use strict';

function listify(array) {
    let out = "<ul>";
    for (let i = 0; i < array.length; i++) {
        if(array[i].name && array[i].url) {
            out += `<li><b>${array[i].name}:</b> 
            <a href="${array[i].url}">${array[i].url}</a></li>`;
        }
    }
    out += "</ul>";

    if(out.replace(/\<[a-zA-Z]*\>|\<\/[a-zA-Z]*\>/g, "").trim() == "") {
        out = "";
    }

    return out;
}


function makeTable(obj) {
    let out = "";

    for (let i = 0; i < obj.planner.length; i++) {
        let o = obj.planner[i];
        out += `
            <tr>
                <td class="td_act" rowspan="${o.str.length}">
                    <button type="button" class="btn btn-default btn-sm" onclick="moveWeekUp(${i})">
                        <i class="glyphicon glyphicon-chevron-up"></i>
                    </button>
                    <button type="button" class="btn btn-default btn-sm" onclick="moveWeekDown(${i})">
                        <i class="glyphicon glyphicon-chevron-down"></i>
                    </button>
                    <button type="button" class="btn btn-success btn-sm" onclick="editStr(${i})">
                        <i class="glyphicon glyphicon-pencil"></i>
                    </button>
                    <button type="button" class="btn btn-danger btn-sm" onclick="deleteWeek(${i})">
                        <i class="glyphicon glyphicon-remove"></i>
                    </button>
                </td>
                <td class="td_wpe" id="td_wpe_${i}" rowspan="${o.str.length}">${o.wpe}</td>
                <td contenteditable="true" id="td_wna_${i}" class="td_wna" rowspan="${o.str.length}">${o.wna}</td>
                <td contenteditable="true" id="td_str_${i}_0" class="td_str">${o.str[0].name}</td>
                <td contenteditable="true" id="td_com_${i}_0" class="td_com">${o.str[0].com.join('<br>')}</td>
                <td class="td_res" id="td_res_${i}_0">${listify(o.str[0].res)}</td>
            </tr>
        `;

        if (o.str.length > 1) {
            for (let j = 1; j < o.str.length; j++) {
                out += `
                    <tr>
                        <td contenteditable="true" id="td_str_${i}_${j}" class="td_str">${o.str[j].name}</td>
                        <td contenteditable="true" id="td_com_${i}_${j}" class="td_com">${o.str[j].com.join('\n')}</td>
                        <td class="td_res" id="td_res_${i}_${j}">${listify(o.str[j].res)}</td>
                    </tr>
                `;
            }
        }
    }

    return out;
}
module.exports.makeTable = makeTable;

function swapElements(array, i, j) {
    let aux = array[i];
    array[i] = array[j];
    array[j] = aux;
    return array;
}
module.exports.swap = swapElements;

function swapWeekPeriods(array, i, j) {
    let aux = array[i].wpe;
    array[i].wpe = array[j].wpe;
    array[j].wpe = aux;
    return array;
}
module.exports.swapwpe = swapWeekPeriods;