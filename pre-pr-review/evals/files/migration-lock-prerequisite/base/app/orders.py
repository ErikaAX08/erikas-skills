from app.db import connection


def create_order(customer_id: int, total_cents: int) -> int:
    with connection() as conn:
        row = conn.execute(
            "INSERT INTO orders (customer_id, total_cents) VALUES (%s, %s) RETURNING id",
            (customer_id, total_cents),
        ).fetchone()
        return row[0]
