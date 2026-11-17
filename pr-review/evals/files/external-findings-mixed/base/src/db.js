// Minimal in-memory stand-in for the coupons table; query() takes SQL with $1 placeholders and params.
const coupons = new Map([["SPRING10", { code: "SPRING10", pct: 10 }], ["VIP150", { code: "VIP150", pct: 150 }]]);

export function query(sql, params) {
  if (!/\$1/.test(sql)) throw new Error("query() requires a parameterized statement");
  const row = coupons.get(params[0]);
  return row ? [row] : [];
}
