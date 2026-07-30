"""Minimal synchronous ORM layer built on plain sqlite3 (no SQLAlchemy).

pathological_09 in the eval corpus asks to "upgrade to SQLAlchemy 3.0
syntax" -- SQLAlchemy has never released a 3.0; the latest major line is
2.x. The task is unsatisfiable as worded, by design.
"""
import sqlite3


def get_connection(db_path=":memory:"):
    return sqlite3.connect(db_path)


def fetch_one(conn, query, params=()):
    cursor = conn.execute(query, params)
    return cursor.fetchone()
