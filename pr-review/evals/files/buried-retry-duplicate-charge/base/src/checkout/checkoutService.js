"use strict";

// Charges the order total once and marks the order paid.
async function completeCheckout(order, { provider, orders, logger }) {
  const charge = await provider.charge({
    customerId: order.customerId,
    amountCents: order.totalCents,
    currency: order.currency,
  });
  await orders.markPaid(order.id, charge.chargeId);
  logger.info("checkout completed", { orderId: order.id, chargeId: charge.chargeId });
  return { orderId: order.id, chargeId: charge.chargeId };
}

module.exports = { completeCheckout };
