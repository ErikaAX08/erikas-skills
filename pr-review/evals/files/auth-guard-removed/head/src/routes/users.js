const express = require("express");
const { requireAuth } = require("../middleware/auth");
const users = require("../services/users");

const router = express.Router();

router.use(requireAuth);

router.get("/users/:id", async (req, res) => {
  res.json(await users.get(req.params.id));
});

router.delete("/users/:id", async (req, res) => {
  await users.remove(req.params.id);
  res.status(204).end();
});

module.exports = router;
