from app.db import connection


def create_order(customer_id: int, total_cents: int) -> int:
    with connection() as conn:
        row = conn.execute(
            "INSERT INTO orders (customer_id, total_cents) VALUES (%s, %s) RETURNING id",
            (customer_id, total_cents),
        ).fetchone()
        return row[0]


def get_order(order_id: int) -> dict | None:
    with connection() as conn:
        row = conn.execute(
            "SELECT id, customer_id, total_cents FROM orders WHERE id = %s",
            (order_id,),
        ).fetchone()
    if row is None:
        return None
    return {"id": row[0], "customer_id": row[1], "total_cents": row[2]}
