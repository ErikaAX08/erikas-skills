// Applies a coupon percentage to an order total in cents.
export function applyDiscount(totalCents, pct) {
  return Math.round(totalCents * (1 - pct / 100));
}
