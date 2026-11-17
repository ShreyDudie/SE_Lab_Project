"""
Production entry point for the web server (gunicorn wsgi:app).

The database is prepared (tables + demo data) by bootstrap_db.py, which runs once
BEFORE the server starts, so this module only needs to expose the Flask app.
"""
from app import app  # noqa: F401  (importing app also applies any pending schema upgrade)
