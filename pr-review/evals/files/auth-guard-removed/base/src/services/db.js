const { Pool } = require("pg");

const pool = new Pool();

module.exports = { query: (sql, params) => pool.query(sql, params) };
