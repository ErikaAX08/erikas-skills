from app.db import connection


def create_order(status: str, legacy_ref: str | None = None) -> int:
    with connection() as conn:
        row = conn.execute(
            "INSERT INTO orders (status, legacy_ref) VALUES (%s, %s) RETURNING id",
            (status, legacy_ref),
        ).fetchone()
        return row[0]
