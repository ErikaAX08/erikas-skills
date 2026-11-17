import { test } from "node:test";
import assert from "node:assert/strict";
import { invoiceTotal } from "../src/invoice.js";

test("sums quantity times unit price", () => {
  assert.equal(invoiceTotal([{ qty: 2, unitCents: 500 }, { qty: 1, unitCents: 250 }]), 1250);
});
