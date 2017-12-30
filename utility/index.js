function listify(array) {
    let out = "<ul>";
    for(let i=0; i<array.length; i++) {
        out += `<li><b>${array[i].name}</b>: ${array[i].url}</li>`;
    }
    out += "</ul>";
    return out;
}

function makeTable(obj) {
    let out = "";

    for(let i=0; i<obj.planner.length; i++) {
        o = obj.planner[i];
        out += `
            <tr>
                <td class="td_wno" rowspan="${o.str.length}">${o.wno}</td>
                <td class="td_wpe" rowspan="${o.str.length}">${o.wpe}</td>
                <td class="td_wna" rowspan="${o.str.length}">${o.wna}</td>
                <td class="td_str">${o.str[0].name}</td>
                <td class="td_com">${o.str[0].com.join('\n')}</td>
                <td class="td_res">${listify(o.str[0].res)}</td>
            </tr>
        `;

        if(o.str.length > 1) {
            for(let i=1; i<o.str.length; i++) {
                out += `
                    <tr>
                        <td class="td_str">${o.str[i].name}</td>
                        <td class="td_com">${o.str[i].com.join('\n')}</td>
                        <td class="td_res">${listify(o.str[i].res)}</td>
                    </tr>
                `;
            }
        }
    }
}
module.exports.makeTable = makeTable;

