"use strict";

// Thin client for the payment provider. See docs/provider.md for idempotency semantics.
class ProviderClient {
  constructor(http) {
    this.http = http;
  }

  async charge({ customerId, amountCents, currency, idempotencyKey }) {
    const headers = idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {};
    const res = await this.http.post(
      "/v1/charges",
      { customer: customerId, amount: amountCents, currency },
      { headers, timeoutMs: 5000 },
    );
    return { chargeId: res.id, status: res.status };
  }
}

module.exports = { ProviderClient };
