"use strict";

const assert = require("node:assert/strict");
const { test } = require("node:test");
const { completeCheckout } = require("../src/checkout/checkoutService");

const logger = { info() {}, warn() {} };

test("charges the order total and marks the order paid", async () => {
  const paid = [];
  const provider = { charge: async ({ amountCents }) => ({ chargeId: `ch_${amountCents}`, status: "succeeded" }) };
  const orders = { markPaid: async (id, chargeId) => paid.push([id, chargeId]) };
  const result = await completeCheckout({ id: "o1", customerId: "c1", totalCents: 1500, currency: "MXN" }, { provider, orders, logger });
  assert.deepEqual(result, { orderId: "o1", chargeId: "ch_1500" });
  assert.deepEqual(paid, [["o1", "ch_1500"]]);
});
