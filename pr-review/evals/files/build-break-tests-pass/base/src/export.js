import { invoiceTotal } from "./invoice.js";

export function toCsv(invoice) {
  return `${invoice.id},${invoiceTotal(invoice.lines)}`;
}
