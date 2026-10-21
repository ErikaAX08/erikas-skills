module.exports = function route(router) {
  router.post("/allow-list", (req, res) => res.status(201).end());
};
