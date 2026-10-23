"use strict";

const config = require("../config");
const { withRetry } = require("../lib/retry");
const { sendReceipt } = require("../notifications/receiptMailer");

const retryOptions = (logger, step, orderId) => ({
  attempts: config.checkoutRetryAttempts,
  baseDelayMs: config.checkoutRetryBaseDelayMs,
  onRetry: (err, attempt) => logger.warn("checkout step failed, retrying", { step, orderId, attempt, reason: err.code ?? "unknown" }),
});

// Charges the order total, marks the order paid, and e-mails a receipt. Provider and database
// calls are retried on transient failures.
async function completeCheckout(order, { provider, orders, customers, mailer, logger }) {
  const charge = await withRetry(
    () =>
      provider.charge({
        customerId: order.customerId,
        amountCents: order.totalCents,
        currency: order.currency,
      }),
    retryOptions(logger, "charge", order.id),
  );
  await withRetry(() => orders.markPaid(order.id, charge.chargeId), retryOptions(logger, "mark-paid", order.id));
  logger.info("checkout completed", { orderId: order.id, chargeId: charge.chargeId });

  if (customers && mailer) await sendReceipt(order, { customers, mailer, logger });
  return { orderId: order.id, chargeId: charge.chargeId };
}

module.exports = { completeCheckout };
