const logger = require("./logger");
const { findUserByEmail, checkPassword } = require("./users");

async function login(req, res) {
  const user = await findUserByEmail(req.body.email);
  if (!user || !(await checkPassword(user, req.body.password))) {
    logger.info("login failed", { userId: user ? user.id : null });
    return res.status(401).json({ error: "invalid credentials" });
  }
  logger.info("login succeeded", { userId: user.id });
  return res.json({ token: user.issueToken() });
}

module.exports = { login };
