"""Initialize the database for this project.

Usage:
  python -m backend.scripts.init_db

This script imports the Flask app factory, activates an app context, and runs
SQLAlchemy's create_all() to ensure all tables exist. It prints the list of
tables created/available.

Set MYSQL_DATABASE_URI (or DATABASE_URL) in the environment or backend/.env
before running if you want to target MySQL. Otherwise sqlite:///db.sqlite is used.
"""
import os
import sys

# Ensure package import works when called as a module
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

from backend.project import create_app, db


def main():
    # Optionally load .env file in backend folder if present
    env_path = os.path.join(os.path.dirname(__file__), '..', '.env')
    if os.path.exists(env_path):
        try:
            from dotenv import load_dotenv
            load_dotenv(env_path)
        except Exception:
            pass

    app = create_app()
    with app.app_context():
        print('Creating/updating database tables...')
        db.create_all()
        # List tables
        engine = db.get_engine()
        inspector = None
        try:
            from sqlalchemy import inspect
            inspector = inspect(engine)
            tables = inspector.get_table_names()
        except Exception:
            tables = []
        print('Available tables:', tables)
        print('Done.')


if __name__ == '__main__':
    main()
