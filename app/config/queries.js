'use strict';

module.exports = {
    insert: `INSERT INTO ??(??) VALUES(?)`,

    delete: `DELETE FROM ?? WHERE ?? = ?`,

    update: `UPDATE ?? SET ?? = ? WHERE ?? = ?`,

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
        week.position ASC`,

    useridbyemail: 'SELECT id FROM user WHERE email = ?',

    weekbyidanddoc2: 'SELECT id, name, day, position FROM week WHERE id = ? AND documentid = ?',

    weeksbydoc: 'SELECT id, name, day, position FROM week WHERE documentid = ?',

    structurebyidandweek: 'SELECT id, name, comments, position FROM structure WHERE id = ? AND weekid = ?',

    structuresbyweek: 'SELECT id, name, comments, position FROM structure WHERE weekid = ?',

    resourcebyidandstructure: 'SELECT id, name, url, position FROM resource WHERE id = ? AND structureid = ?',

    resourcesbystructure: 'SELECT id, name, url, position FROM resource WHERE structureid = ?',

    weekbyidanddoc: `SELECT 
        week.id AS weekid, week.name AS weekname, week.day,
        structure.id AS structureid, structure.name AS structurename, structure.comments, 
        resource.id AS resourceid, resource.name AS resourcename, resource.url
        FROM week 
        LEFT JOIN structure
            ON structure.weekid = week.id
        LEFT JOIN resource
            ON resource.structureid = structure.id
        WHERE week.id = ? AND week.documentid = ?`,

    moveblockdown: `
        UPDATE ?? SET position = position - 1 WHERE position >= ? AND position <= ? AND ?? = ?; 
        UPDATE ?? SET position = ? WHERE id = ?;`,

    moveblockup: `
        UPDATE ?? SET position = position + 1 WHERE position <= ? AND position >= ? AND ?? = ?; 
        UPDATE ?? SET position = ? WHERE id = ?;`,

    blocksbyparentid: `SELECT * FROM ?? WHERE ?? = ?`,

    cloneblock: `INSERT INTO ??(??)
        SELECT ?? FROM ?? WHERE id = ?`
}