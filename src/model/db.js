var crypto = require('crypto');
var db     = require('mariadb');
const constants = require('../lib/constants');
var logger = require('../lib/logging');

require('dotenv').config();

const pool = db.createPool({
    host: process.env.MYSQL_HOST, 
    user:process.env.MYSQL_USER, 
    password: process.env.MYSQL_PASS,
    database: process.env.MYSQL_DB,
    connectionLimit: 5,
    bigIntAsNumber: true
});


async function getUser(username) {
    let conn;
    try {
        conn = await pool.getConnection();
        const rows = await conn.query("SELECT * FROM users WHERE username = ?", [username]);
        if (rows.length != 0)
            return rows;
        else
            return null;
    } catch (err) {
        logger.error(`Could not get user ${username} from table`);
        throw err;
    } finally {
        if (conn) await conn.end();
    }
}

async function createUser(username, password){
    var hashBuf;
    let conn;
    const salt = crypto.randomBytes(constants.HASH_SALT_LEN);
    
    hashBuf = crypto.pbkdf2Sync(password, salt, constants.HASH_ITER, constants.HASH_LEN, constants.HASH_ALGO)

    try {
        conn = await pool.getConnection();
        const result = await conn.query("INSERT INTO users (username, password, salt)"
                    + " VALUES (?,?,?);", [username, hashBuf, salt]);
        return result;
    } catch (err) {
        logger.error("Could not connect to the database");
        throw err;
    } finally {
        if (conn) await conn.end();
    }
}

async function createStrip(id){
    
    try {
        const STRIP_TYPE_ID = 0;
        conn = await pool.getConnection();
        var result = {"dev_query": await conn.query("INSERT INTO devices (id, type_id)"
                    + " VALUES (?,?);", [id, STRIP_TYPE_ID])};
        result["strip_val_query"] = await conn.query("INSERT INTO strip_vals (id)"
        + " VALUES (?);", [id])
        return result;
    } catch (err) {
        logger.error("Could not connect to the database");
        throw err;
    } finally {
        if (conn) await conn.end();
    }
}

async function getTypes()
{
    let conn;
    try {
        conn = await pool.getConnection();
        const rows = await conn.query("SELECT name FROM device_types");
        if (rows)
            return rows;
        else
            throw new Error("Got nothing from the device type query");
    } catch (err) {
        logger.error(`Could not get user ${username} from table`);
        throw err;
    } finally {
        if (conn) await conn.end();
    }
}

async function getAllStrips()
{
    const q = "SELECT * FROM strip_vals;";
    let conn;
    try {
        conn = await pool.getConnection();
        return await conn.query(q);
    } catch (err) {
        logger.error(`Could not get user all strips from table`);
        throw err;
    } finally {
        if (conn) await conn.end();
    }
}

async function getStrip(id)
{
    let conn;
    try {
        conn = await pool.getConnection();
        const rows = await conn.query("SELECT * FROM strip_vals "
        + "WHERE id = ?", [id]);
        if (rows.length == 1)
            return rows[0];
        else 
            return null;
    } catch (err) {
        logger.error(`Could not get user ${username} from table`);
        throw err;
    } finally {
        if (conn) await conn.end();
    }
}

// Gets the ids and types of devices. Does not
// just get all the values

async function getAllDevs()
{
    let conn;
    try {
        conn = await pool.getConnection();
        const rows = await conn.query(`SELECT d.id, t.name AS type FROM devices AS d 
            LEFT JOIN device_types AS t on t.id = d.type_id`);
        if (rows)
            return rows;
        else
            return null;
    } catch (err) {
        logger.error(`Could not get devices ${err}`);
        throw err;
    }
}

async function devExists(id)
{
    let conn;
    try {
        conn = await pool.getConnection();
        const rows = await conn.query("SELECT COUNT(*) FROM devices "
        + "WHERE id = ?", [id]);
        if (conn) await conn.end();
        return (rows[0]['COUNT(*)'] == 1);
    } catch (err) {
        logger.error("Could not connect to DB");
        throw err;
    }
}

async function updateStripParam(id, param, value)
{
    if (param == 'id'){
        logger.warn("Not changing ID in update");
        return;
    }
    try {
        conn = await pool.getConnection();
        const result = await conn.query(`UPDATE strip_vals`
                    + ` SET ${param} = ?`
                    + ` WHERE id = ?;`, [value, id]);
        return result;
    } catch (err) {
        throw err;
    } finally {
        if (conn) await conn.end();
    }
}

async function bulkUpdateStrip(id, vals)
{
    if (vals['id'] != null){
        logger.warn("Not setting ID");
    }
    var key_arr = Object.keys(vals);
    var val_arr = Object.values(vals);
    var query_str = "UPDATE strip_vals SET ";
    key_arr.forEach(function(paramName, idx){
        if (!(constants.legalStripParams.includes(paramName))){
            logger.error(`Illegal parameter for bulkUpdateStrip ${paramName}, aborting`);
            throw new Error(`Illegal parameter ${paramName}`);
        }
        query_str += `${paramName} = ?`;
        if (idx != (key_arr.length - 1))
            query_str += ",";
        
        query_str += " ";
    });
    query_str += "WHERE id = ?;";
    val_arr.push(id);
    try {
        conn = await pool.getConnection();
        const result = await conn.query(query_str, val_arr);
        return result;
    } catch (err) {
        throw err;
    }
}

module.exports = {getUser, createUser, createStrip, getStrip, 
    bulkUpdateStrip, updateStripParam, devExists,
    getAllDevs, getTypes, getAllStrips};