const sessions = new Map();

function verifyToken(token) {
  return sessions.get(token) || null;
}

module.exports = { verifyToken, sessions };
