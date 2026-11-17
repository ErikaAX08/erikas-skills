"""Runs app.orders against an in-memory SQLite database built from db/migrations."""
import contextlib
import pathlib
import sqlite3

MIGRATIONS = pathlib.Path(__file__).resolve().parent.parent / "db" / "migrations"


class SQLiteConnection:
    """psycopg-style `execute` with %s placeholders over sqlite3."""

    def __init__(self, conn):
        self._conn = conn

    def execute(self, sql, params=()):
        return self._conn.execute(sql.replace("%s", "?"), params)


def sqlite_database():
    conn = sqlite3.connect(":memory:")
    for migration in sorted(MIGRATIONS.glob("*.sql")):
        sql = migration.read_text()
        sql = sql.replace("BIGSERIAL PRIMARY KEY", "INTEGER PRIMARY KEY AUTOINCREMENT")
        sql = sql.replace("TIMESTAMPTZ", "TEXT").replace("now()", "CURRENT_TIMESTAMP")
        sql = "\n".join(line for line in sql.splitlines() if not line.upper().startswith("SET "))
        conn.executescript(sql)

    @contextlib.contextmanager
    def connection():
        with conn:
            yield SQLiteConnection(conn)

    return connection
