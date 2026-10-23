"use strict";

// Returns the order total in cents after the customer's tier discount and tax.
function orderTotal(items, tier, taxRate) {
  const subtotal = items.reduce((sum, item) => sum + item.unitCents * item.quantity, 0);
  let discount = 0;
  if (tier === "gold") {
    discount = Math.round(subtotal * 0.1);
  } else if (tier === "silver") {
    discount = Math.round(subtotal * 0.05);
  }
  const discounted = subtotal - discount;
  return discounted + Math.round(discounted * taxRate);
}

module.exports = { orderTotal };
