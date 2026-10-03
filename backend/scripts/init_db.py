import os
import sys
from urllib.parse import urlparse
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

# Ensure backend root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.config import settings
from app.database import Base, engine
import app.models

def create_database_if_not_exists():
    """Connect to default 'postgres' database and create 'loomora_erp' if absent."""
    db_url = settings.DATABASE_URL
    if not db_url.startswith("postgresql"):
        print(f"Non-PostgreSQL URL detected: {db_url}")
        return

    parsed = urlparse(db_url)
    target_db = parsed.path.lstrip("/") or "loomora_erp"
    user = parsed.username or "postgres"
    password = parsed.password or "postgres"
    host = parsed.hostname or "localhost"
    port = parsed.port or 5432

    print(f"Connecting to PostgreSQL server at {host}:{port} as user '{user}'...")
    try:
        # Connect to maintenance db 'postgres'
        conn = psycopg2.connect(
            dbname="postgres",
            user=user,
            password=password,
            host=host,
            port=port
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cur = conn.cursor()
        
        cur.execute(f"SELECT 1 FROM pg_catalog.pg_database WHERE datname = '{target_db}';")
        exists = cur.fetchone()
        if not exists:
            print(f"Creating database '{target_db}'...")
            cur.execute(f'CREATE DATABASE "{target_db}";')
            print(f"Database '{target_db}' created successfully.")
        else:
            print(f"Database '{target_db}' already exists.")
        cur.close()
        conn.close()
    except Exception as e:
        print(f"PostgreSQL connection check note: {e}")
        print("Will attempt direct SQLAlchemy table creation...")

def init_tables():
    """Create all tables defined in SQLAlchemy models."""
    print("Creating all database tables via SQLAlchemy metadata...")
    Base.metadata.create_all(bind=engine)
    print("All tables created successfully.")

if __name__ == "__main__":
    create_database_if_not_exists()
    init_tables()
