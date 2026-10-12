from app.db import connection


def pending_orders() -> list[tuple]:
    with connection() as conn:
        return conn.execute(
            "SELECT id, status FROM orders WHERE status = 'pending'"
        ).fetchall()


def run_once() -> None:
    for order_id, status in pending_orders():
        print(f"processing {order_id} ({status})")
