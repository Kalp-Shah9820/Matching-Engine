import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.schemas import Base

# Reads from environment variable set in docker-compose.yml.
# Falls back to local SQLite for running without Docker.
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./matching.db") 

# SQLite needs check_same_thread=False; PostgreSQL ignores this arg safely
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def init_db():
    """Creates all tables if they don't exist. Called once on app startup."""
    Base.metadata.create_all(bind=engine)


def get_db():
    """
    FastAPI dependency - yields a DB session per request and closes it after.
    Usage in a route:
        def my_route(db: Session = Depends(get_db)):
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()