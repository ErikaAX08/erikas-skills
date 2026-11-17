import { invoiceTotal } from "./invoice.js";

export function toCsv(invoice) {
  const total = invoiceTotal(invoice.lines);
  const currency = invoice.currency ?? "USD";
  return `${invoice.id},${total},${currency}`;
}

export function toCsvRows(invoices) {
  return invoices.map((inv) => toCsv(inv).join("\n");
}
