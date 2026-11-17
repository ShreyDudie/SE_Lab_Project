"""
Run ONCE before the web server starts (see the Dockerfile CMD).

Creates the tables and, ONLY when the database is brand new (it has no users at all),
loads the demo data set once: committees, 56 events with results, 60+ students, registrations,
notifications and so on. After that the site is a normal website: everything people add
(events, registrations, sign-ups, results) is kept, and this script never seeds again,
even if every event is later deleted.

For this to survive restarts the database must be persistent: set DATABASE_URL to a Postgres
database (render.yaml does this for Render). With the default SQLite file on a host whose disk is
wiped on restart, the data would be lost and re-seeded.

It runs as a separate step (not inside the app) because the web server runs several workers, and
if each one tried to seed the same empty database at once they would collide.

Set SEED_DEMO_DATA=0 to never seed (e.g. when connecting an already populated database).
"""
import os

from app import app, db
from models import Event, User


def main():
    with app.app_context():
        db.create_all()
        brand_new = User.query.count() == 0
        engine_name = db.engine.dialect.name
        if engine_name == 'sqlite' and os.getenv('RENDER'):
            print('[bootstrap] WARNING: using SQLite on Render. Its disk is wiped on restart, so data will not '
                  'persist. Set DATABASE_URL to a Postgres database (render.yaml does this).')

    if os.getenv('SEED_DEMO_DATA', '1') == '0':
        print('[bootstrap] SEED_DEMO_DATA=0, not seeding.')
        return
    if not brand_new:
        print(f'[bootstrap] Existing {engine_name} database found, keeping all data (no seeding).')
        return

    from seed_demo_data import seed
    print(f'[bootstrap] Brand-new {engine_name} database: loading the demo data once...')
    seed()
    with app.app_context():
        print(f'[bootstrap] Done: {Event.query.count()} events, {User.query.count()} users.')


if __name__ == '__main__':
    main()
