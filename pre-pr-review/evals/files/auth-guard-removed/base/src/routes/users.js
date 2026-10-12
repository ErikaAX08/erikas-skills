const express = require("express");
const { requireAuth, requireAdmin } = require("../middleware/auth");
const users = require("../services/users");

const router = express.Router();

router.get("/users/:id", requireAuth, async (req, res) => {
  res.json(await users.get(req.params.id));
});

router.delete("/users/:id", requireAuth, requireAdmin, async (req, res) => {
  await users.remove(req.params.id);
  res.status(204).end();
});

module.exports = router;
