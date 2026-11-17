// Applies a coupon percentage to an order total in cents.
export function applyDiscount(totalCents, pct) {
  const clamped = Math.min(Math.max(pct, 0), 100);
  return Math.round(totalCents * (1 - clamped / 100));
}
