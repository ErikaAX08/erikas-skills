const db = require("./db");

async function findUserByEmail(email) {
  return db.users.findOne({ email });
}

async function checkPassword(user, password) {
  return user.verifyPassword(password);
}

module.exports = { findUserByEmail, checkPassword };
