"use strict";

const { escapeHtml } = require("../lib/escape");

function renderOrderList(orders) {
  const rows = orders
    .map((o) => `<li data-id="${escapeHtml(o.id)}">${escapeHtml(o.label)}</li>`)
    .join("");
  return `<ul class="orders">${rows}</ul>`;
}

module.exports = { renderOrderList };
