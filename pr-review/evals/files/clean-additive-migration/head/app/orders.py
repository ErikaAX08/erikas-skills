from app.db import connection

MAX_GIFT_NOTE = 500


def create_order(customer_id: int, total_cents: int, gift_note: str | None = None) -> int:
    if gift_note is not None and len(gift_note) > MAX_GIFT_NOTE:
        raise ValueError(f"gift_note longer than {MAX_GIFT_NOTE} characters")
    with connection() as conn:
        row = conn.execute(
            "INSERT INTO orders (customer_id, total_cents, gift_note) VALUES (%s, %s, %s) RETURNING id",
            (customer_id, total_cents, gift_note),
        ).fetchone()
        return row[0]


def get_order(order_id: int) -> dict | None:
    with connection() as conn:
        row = conn.execute(
            "SELECT id, customer_id, total_cents, gift_note FROM orders WHERE id = %s",
            (order_id,),
        ).fetchone()
    if row is None:
        return None
    return {"id": row[0], "customer_id": row[1], "total_cents": row[2], "gift_note": row[3]}
