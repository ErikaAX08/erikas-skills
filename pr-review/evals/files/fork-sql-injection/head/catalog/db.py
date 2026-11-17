import os
from contextlib import contextmanager

import psycopg


@contextmanager
def get_cursor():
    with psycopg.connect(os.environ["DATABASE_URL"]) as conn:
        with conn.cursor() as cursor:
            yield cursor
