var crypto = require('crypto');
var db     = require('mariadb');
var constants = require('../lib/constants');
var logger = require('../lib/logging');

require('dotenv').config();

const pool = db.createPool({
    host: process.env.MYSQL_HOST, 
    user:process.env.MYSQL_USER, 
    password: process.env.MYSQL_PASS,
    database: process.env.MYSQL_DB,
    connectionLimit: 5
});


async function getUser(username) {
    let conn;
    try {
        conn = await pool.getConnection();
        const rows = await conn.query("SELECT * FROM users WHERE username = ?", [username]);
        return rows;
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

module.exports = {getUser, createUser};