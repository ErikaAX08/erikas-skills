const PAYMENTS_URL = process.env.PAYMENTS_URL;

export async function capture(orderId, amountCents) {
  const res = await fetch(`${PAYMENTS_URL}/captures`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ orderId, amountCents }),
  });
  if (!res.ok) throw new Error(`capture failed: ${res.status}`);
  return res.json();
}
