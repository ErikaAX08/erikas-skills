"use strict";

const { renderOrderList } = require("../components/orderList");

// The page replaces its container's markup on every load; nothing else queries the list.
async function showOrders(container, api) {
  const orders = await api.listOrders(); // always an array (empty when the user has none)
  container.innerHTML = renderOrderList(orders);
}

module.exports = { showOrders };
