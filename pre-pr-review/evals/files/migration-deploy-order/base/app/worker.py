from app.db import connection


def pending_orders() -> list[tuple]:
    with connection() as conn:
        return conn.execute(
            "SELECT id, status, legacy_ref FROM orders WHERE status = 'pending'"
        ).fetchall()


def run_once() -> None:
    for order_id, status, legacy_ref in pending_orders():
        print(f"processing {order_id} ({status}) ref={legacy_ref}")
