"use strict";

const assert = require("node:assert/strict");
const { test } = require("node:test");
const { buildReceipt, sendReceipt } = require("../src/notifications/receiptMailer");

const order = { id: "o1", currency: "MXN", totalCents: 2500, items: [{ name: "Mug <large>", quantity: 2, unitCents: 1250 }] };

test("builds an escaped receipt addressed to the customer", () => {
  const r = buildReceipt(order, { email: "ana@example.com" });
  assert.equal(r.to, "ana@example.com");
  assert.match(r.html, /Mug &lt;large&gt;/);
  assert.match(r.html, /Total: 25\.00 MXN/);
});

test("a mailer failure is logged without the address and does not throw", async () => {
  const warnings = [];
  const customers = { get: async () => ({ email: "ana@example.com" }) };
  const ok = await sendReceipt(order, { customers, mailer: { send: async () => { throw Object.assign(new Error("smtp"), { code: "ETIMEDOUT" }); } }, logger: { warn: (m, f) => warnings.push([m, f]) } });
  assert.equal(ok, false);
  assert.deepEqual(warnings, [["receipt not sent", { orderId: "o1", reason: "ETIMEDOUT" }]]);
});
