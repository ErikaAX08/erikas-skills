const pad = require("string-padder");

function formatLabel(sku, quantity) {
  return `${pad(sku, 12)}${pad(String(quantity), 4)}`;
}

module.exports = { formatLabel };
