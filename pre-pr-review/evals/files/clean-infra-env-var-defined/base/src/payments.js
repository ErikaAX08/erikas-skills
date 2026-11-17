export async function capture(orderId, amountCents) {
  return { orderId, amountCents, status: "captured-locally" };
}
