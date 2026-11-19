import os

from sqlmodel import Session, SQLModel, create_engine

# SQLite para dev; em produção aponte para Postgres:
#   DATABASE_URL=postgresql+psycopg://user:pass@postgres:5432/homectl
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./data/homectl.db")

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args, pool_pre_ping=True)


def init_db() -> None:
    if DATABASE_URL.startswith("sqlite:///"):
        path = DATABASE_URL.removeprefix("sqlite:///")
        os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
    SQLModel.metadata.create_all(engine)


def get_session():
    with Session(engine) as session:
        yield session
