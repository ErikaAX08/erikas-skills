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

test("a transient provider failure is retried and the checkout succeeds", async () => {
  process.env.CHECKOUT_RETRY_BASE_DELAY_MS = "1";
  let attempts = 0;
  const provider = {
    charge: async () => {
      attempts++;
      if (attempts === 1) throw Object.assign(new Error("socket hang up"), { code: "ECONNRESET" });
      return { chargeId: "ch_2", status: "succeeded" };
    },
  };
  const orders = { markPaid: async () => {} };
  const result = await completeCheckout({ id: "o2", customerId: "c1", totalCents: 900, currency: "MXN" }, { provider, orders, logger });
  assert.equal(result.chargeId, "ch_2");
});

test("sends a receipt after a successful checkout", async () => {
  const sent = [];
  const provider = { charge: async () => ({ chargeId: "ch_3", status: "succeeded" }) };
  const orders = { markPaid: async () => {} };
  const customers = { get: async () => ({ email: "ana@example.com" }) };
  const mailer = { send: async (m) => sent.push(m.to) };
  const order = { id: "o3", customerId: "c1", totalCents: 900, currency: "MXN", items: [] };
  await completeCheckout(order, { provider, orders, customers, mailer, logger });
  assert.deepEqual(sent, ["ana@example.com"]);
});
