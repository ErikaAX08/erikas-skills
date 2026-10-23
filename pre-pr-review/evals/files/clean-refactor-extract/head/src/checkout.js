"use strict";

const { orderTotal } = require("./pricing");

function checkoutSummary(cart, customer) {
  return { items: cart.items.length, totalCents: orderTotal(cart.items, customer.tier, cart.taxRate) };
}

module.exports = { checkoutSummary };
