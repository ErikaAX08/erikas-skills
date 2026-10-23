import os


def connection():
    import psycopg  # imported lazily so the SQLite-backed tests need no driver

    return psycopg.connect(os.environ["DATABASE_URL"])
