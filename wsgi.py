"""
Production entry point (gunicorn wsgi:app).

On a host with a temporary disk (e.g. Render's free tier) the SQLite file starts empty after
every restart. This seeds the demo accounts + data automatically when the database is empty,
so the deployed site always has content. Existing data is never touched.
"""
from app import app, db
from models import Event, User


def bootstrap():
    with app.app_context():
        db.create_all()
        if Event.query.count() == 0 or User.query.count() == 0:
            from seed_demo_data import seed
            seed()


bootstrap()
