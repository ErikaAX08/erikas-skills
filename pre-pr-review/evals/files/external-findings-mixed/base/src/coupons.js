import { query } from "./db.js";

export function findCoupon(code) {
  const rows = query("SELECT code, pct FROM coupons WHERE code = $1", [code]);
  return rows[0] ?? null;
}
