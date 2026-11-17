import { test } from "node:test";
import assert from "node:assert/strict";
import { applyDiscount } from "../src/discount.js";

test("applies a 10% coupon", () => {
  assert.equal(applyDiscount(10000, 10), 9000);
});
