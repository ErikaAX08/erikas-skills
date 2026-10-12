jest.mock("../src/middleware/auth", () => ({
  requireAuth: (req, res, next) => next(),
  requireAdmin: (req, res, next) => next(),
}));
jest.mock("../src/services/users");

const request = require("supertest");
const app = require("../src/app");
const users = require("../src/services/users");

test("DELETE /api/users/:id removes the user", async () => {
  await request(app).delete("/api/users/42").expect(204);
  expect(users.remove).toHaveBeenCalledWith("42");
});
