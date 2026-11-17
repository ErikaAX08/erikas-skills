import unittest
from unittest import mock

from app import orders
from tests.support import sqlite_database


class OrdersTest(unittest.TestCase):
    def setUp(self):
        patcher = mock.patch.object(orders, "connection", sqlite_database())
        patcher.start()
        self.addCleanup(patcher.stop)

    def test_create_and_read_back(self):
        order_id = orders.create_order(42, 1999)
        self.assertEqual(orders.get_order(order_id), {"id": order_id, "customer_id": 42, "total_cents": 1999})

    def test_missing_order(self):
        self.assertIsNone(orders.get_order(999))


if __name__ == "__main__":
    unittest.main()
