const logger = require("./logger");
const { findUserByEmail, checkPassword } = require("./users");

async function login(req, res) {
  logger.info("login attempt", { body: req.body });
  const account = await findUserByEmail(req.body.email);
  if (!account || !(await checkPassword(account, req.body.password))) {
    logger.info("login failed", { userId: account ? account.id : null });
    return res.status(401).json({ error: "invalid credentials" });
  }
  logger.info("login succeeded", { userId: account.id });
  return res.json({ token: account.issueToken() });
}

module.exports = { login };
