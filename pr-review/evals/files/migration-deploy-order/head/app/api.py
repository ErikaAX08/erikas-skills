from app.db import connection


def create_order(status: str) -> int:
    with connection() as conn:
        row = conn.execute(
            "INSERT INTO orders (status) VALUES (%s) RETURNING id",
            (status,),
        ).fetchone()
        return row[0]
