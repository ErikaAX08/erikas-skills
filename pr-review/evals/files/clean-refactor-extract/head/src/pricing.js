"use strict";

function orderSubtotal(items) {
  return items.reduce((sum, item) => sum + item.unitCents * item.quantity, 0);
}

// Discount in cents for a loyalty tier; unknown tiers get none.
function tierDiscount(subtotal, tier) {
  if (tier === "gold") return Math.round(subtotal * 0.1);
  if (tier === "silver") return Math.round(subtotal * 0.05);
  return 0;
}

// Returns the order total in cents after the customer's tier discount and tax.
function orderTotal(items, tier, taxRate) {
  const subtotal = orderSubtotal(items);
  const discounted = subtotal - tierDiscount(subtotal, tier);
  return discounted + Math.round(discounted * taxRate);
}

module.exports = { orderTotal, tierDiscount };
