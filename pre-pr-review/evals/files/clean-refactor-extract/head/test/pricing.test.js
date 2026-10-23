"use strict";

const assert = require("node:assert/strict");
const { test } = require("node:test");
const { orderTotal } = require("../src/pricing");

const items = [
  { unitCents: 1999, quantity: 3 },
  { unitCents: 250, quantity: 1 },
];

test("gold customers get 10% off before tax", () => {
  assert.equal(orderTotal(items, "gold", 0.16), 6522);
});

test("silver customers get 5% off before tax", () => {
  assert.equal(orderTotal(items, "silver", 0.16), 6885);
});

test("other tiers pay the full subtotal plus tax", () => {
  assert.equal(orderTotal(items, "bronze", 0.16), 7247);
  assert.equal(orderTotal(items, undefined, 0), 6247);
});

test("an empty cart costs nothing", () => {
  assert.equal(orderTotal([], "gold", 0.16), 0);
});

test("tierDiscount rounds to the nearest cent and ignores unknown tiers", () => {
  const { tierDiscount } = require("../src/pricing");
  assert.equal(tierDiscount(6247, "gold"), 625);
  assert.equal(tierDiscount(6247, "silver"), 312);
  assert.equal(tierDiscount(6247, "platinum"), 0);
});
