const { verifyToken } = require("../services/tokens");

function requireAuth(req, res, next) {
  const header = req.get("authorization") || "";
  const user = verifyToken(header.replace(/^Bearer /, ""));
  if (!user) return res.status(401).json({ error: "unauthenticated" });
  req.user = user;
  next();
}

function requireAdmin(req, res, next) {
  if (req.user.role !== "admin") return res.status(403).json({ error: "forbidden" });
  next();
}

module.exports = { requireAuth, requireAdmin };
