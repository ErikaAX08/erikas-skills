"use strict";

const assert = require("node:assert/strict");
const { test } = require("node:test");
const { renderOrderList } = require("../src/components/orderList");

test("renders one escaped item per order", () => {
  const html = renderOrderList([{ id: 7, label: "Mugs <x2>" }]);
  assert.equal(html, '<ul class="orders"><li data-id="7">Mugs &lt;x2&gt;</li></ul>');
});

test("shows an empty state instead of an empty list", () => {
  assert.equal(renderOrderList([]), '<p class="orders-empty">No orders yet.</p>');
});
