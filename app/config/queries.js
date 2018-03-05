'use strict';

module.exports = {
    insert: `INSERT INTO ??(??) VALUES(?)`,

    delete: `DELETE FROM ?? WHERE ?? = ?`,

    update: `UPDATE ?? SET ?? = ? WHERE ?? = ?`,

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
    WHERE document.id = ?`,

    useridbyemail: 'SELECT id FROM user WHERE email = ?',

    weekbyidanddoc2: 'SELECT id, name, day FROM week WHERE id = ? AND documentid = ?',

    weeksbydoc: 'SELECT id, name, day FROM week WHERE documentid = ?',

    structurebyidandweek: 'SELECT id, name, comments FROM structure WHERE id = ? AND weekid = ?',

    structuresbyweek: 'SELECT id, name, comments FROM structure WHERE weekid = ?',

    resourcebyidandstructure: 'SELECT id, name, url FROM resource WHERE id = ? AND structureid = ?',

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
}