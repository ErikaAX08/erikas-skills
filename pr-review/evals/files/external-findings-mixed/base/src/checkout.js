import { findCoupon } from "./coupons.js";
import { applyDiscount } from "./discount.js";

export function checkoutTotal(totalCents, couponCode) {
  const coupon = couponCode ? findCoupon(couponCode) : null;
  return coupon ? applyDiscount(totalCents, coupon.pct) : totalCents;
}
