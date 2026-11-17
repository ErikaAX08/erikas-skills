const db = require("./db");

async function get(id) {
  return db.query("SELECT id, email, role FROM users WHERE id = $1", [id]);
}

async function remove(id) {
  await db.query("DELETE FROM users WHERE id = $1", [id]);
}

module.exports = { get, remove };
