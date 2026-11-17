import { test } from "node:test";
import assert from "node:assert/strict";

test("payments module loads", async () => {
  const m = await import("../src/payments.js");
  assert.equal(typeof m.capture, "function");
});
