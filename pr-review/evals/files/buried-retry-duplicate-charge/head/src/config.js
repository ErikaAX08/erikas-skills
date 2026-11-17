"use strict";

const int = (value, fallback) => {
  const n = Number.parseInt(value ?? "", 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

module.exports = {
  currency: process.env.SHOP_CURRENCY || "MXN",
  // Transient-failure retries for provider and database calls during checkout.
  checkoutRetryAttempts: int(process.env.CHECKOUT_RETRY_ATTEMPTS, 3),
  checkoutRetryBaseDelayMs: int(process.env.CHECKOUT_RETRY_BASE_DELAY_MS, 200),
};
