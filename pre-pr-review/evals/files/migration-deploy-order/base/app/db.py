import os

import psycopg


def connection():
    return psycopg.connect(os.environ["DATABASE_URL"])
