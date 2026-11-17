export function invoiceTotal(lines) {
  return lines.reduce((sum, l) => sum + l.qty * l.unitCents, 0);
}
