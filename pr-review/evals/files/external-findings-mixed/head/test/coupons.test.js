import { test } from "node:test";
import assert from "node:assert/strict";
import { findCoupon } from "../src/coupons.js";

test("coupon codes are case- and space-insensitive", () => {
  assert.equal(findCoupon("  spring10 ").pct, 10);
});
