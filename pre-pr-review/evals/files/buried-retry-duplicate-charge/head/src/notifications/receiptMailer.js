"use strict";

const { escapeHtml } = require("./escape");

function formatAmount(cents, currency) {
  return `${(cents / 100).toFixed(2)} ${currency}`;
}

// Builds the receipt e-mail for a paid order. The address comes from the customer record; nothing
// here is logged.
function buildReceipt(order, customer) {
  const lines = order.items
    .map((item) => `<tr><td>${escapeHtml(item.name)}</td><td>${item.quantity}</td><td>${formatAmount(item.unitCents * item.quantity, order.currency)}</td></tr>`)
    .join("");
  return {
    to: customer.email,
    subject: `Your receipt for order ${order.id}`,
    html: `<table>${lines}</table><p>Total: ${formatAmount(order.totalCents, order.currency)}</p>`,
  };
}

// Looks up the customer and sends the receipt; any failure is logged with the order ID only and
// never fails the checkout.
async function sendReceipt(order, { customers, mailer, logger }) {
  try {
    const customer = await customers.get(order.customerId);
    await mailer.send(buildReceipt(order, customer));
    return true;
  } catch (err) {
    logger.warn("receipt not sent", { orderId: order.id, reason: err.code ?? "unknown" });
    return false;
  }
}

module.exports = { buildReceipt, sendReceipt };
