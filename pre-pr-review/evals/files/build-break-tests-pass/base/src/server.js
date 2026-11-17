import http from "node:http";
import { toCsv } from "./export.js";

export function handler(invoice) {
  return toCsv(invoice);
}

if (process.argv[1] && process.argv[1].endsWith("server.js")) {
  http.createServer((req, res) => res.end(handler({ id: "INV-1", lines: [] }))).listen(8080);
}
