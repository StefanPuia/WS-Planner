let a = {
    "planner":
    [
        {
            "wno":1,
            "wpe":"10.11 - 17.11",
            "wna":"AJAX",
            "str":
            [
                {
                    "name": "Lecture: intro to AJAX",
                    "com":
                    [
                        "need to say about ajax stuff",
                        "need to teach ajax"
                    ],
                    "res":
                    [
                        {
                            "name": "Presenatation", 
                            "url": "goo.gl/as2dE"
                        },
                        {
                            "name": "Documentation",
                            "url": "goo.gl/aw23tg"
                        }
                    ]

                },
                {
                    "name": "Practical: Working on AJAX",
                    "com":
                    [
                        "need to show people in practicals how to use ajax"
                    ],
                    "res":
                    [
                        {
                            "name": "GitHub", 
                            "url": "github.com/portsoc/ws_ajax"
                        }
                    ]
                }
            ],
        },
        {
            "wno":2,
            "wpe":"18.11 - 25.11",
            "wna":"Sockets",
            "str":
            [
                {
                    "name": "Practical",
                    "com":
                    [
                        "show people how to use sockets in practicals"
                    ],
                    "res":
                    [
                        {
                            "name": "GitHub",
                            "url": "github.com/portsoc/ws_sockets"
                        }
                    ]
                }
            ]
        }
    ]
};


function makeTable(obj) {
    let out = "";

    for(let i=0; i<a.planner.length; i++) {
        o = a.planner[i];
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


function listify(array) {
    let out = "<ul>";
    for(let i=0; i<array.length; i++) {
        out += `<li><b>${array[i].name}</b>: ${array[i].url}</li>`;
    }
    out += "</ul>";
    return out;
}