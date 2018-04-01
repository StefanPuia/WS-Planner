'use strict';

module.exports = {
    insert: `INSERT INTO ??(??) VALUES(?)`,

    insertuser: `INSERT INTO user SET ?`,

    delete: `DELETE FROM ?? WHERE ?? = ?`,

    update: `UPDATE ?? SET ?? = ? WHERE ?? = ?;`,

    updatetwo: `UPDATE ?? SET ?? = ?, ?? = ? WHERE ?? = ?`,

    updatethree: `UPDATE ?? SET ?? = ?, ?? = ?, ?? = ? WHERE ?? = ?`,

    selectall: `SELECT * FROM ?? WHERE ?? = ?`,

    updatetwoconditions: `UPDATE ?? SET ?? = ? WHERE ?? = ? AND ?? = ?`,

    documentsbyuserid: `SELECT 
        document.id AS documentid, document.name, 
        week.id AS weekid, week.name AS weekname, week.day, 
        structure.id AS structureid, structure.name AS structurename, structure.comments, 
        resource.id AS resourceid, resource.name AS resourcename, resource.url
    FROM 
        document
    LEFT JOIN week
        ON week.documentid = document.id
    LEFT JOIN structure
        ON structure.weekid = week.id
    LEFT JOIN resource
        ON resource.structureid = structure.id
    WHERE document.userid = ? 
    ORDER BY document.created DESC`,

    documentbyid: `SELECT 
        document.id, document.name, 
        week.id AS weekid, week.name AS weekname, week.day, week.position AS weekposition,
        structure.id AS structureid, structure.name AS structurename, structure.comments, structure.position AS structureposition,
        resource.id AS resourceid, resource.name AS resourcename, resource.url, resource.position AS resourceposition
    FROM 
        document
    LEFT JOIN week
        ON week.documentid = document.id
    LEFT JOIN structure
        ON structure.weekid = week.id
    LEFT JOIN resource
        ON resource.structureid = structure.id
    WHERE document.id = ?
    ORDER BY
        week.position ASC,
        structure.name ASC,
        resource.name ASC`,

    useridbyemail: 'SELECT id FROM user WHERE email = ?',

    weeksbydoc: 'SELECT id, name, day, position FROM week WHERE documentid = ?',

    structuresbyweek: 'SELECT id, name, comments, position FROM structure WHERE weekid = ?',

    resourcesbystructure: 'SELECT id, name, url, position FROM resource WHERE structureid = ?',

    blocksbyparentid: `SELECT * FROM ?? WHERE ?? = ?`,
}