import { query } from "./db.js";

export function findCoupon(code) {
  const normalized = String(code).trim().toUpperCase();
  const rows = query("SELECT code, pct FROM coupons WHERE code = $1", [normalized]);
  return rows[0] ?? null;
}
