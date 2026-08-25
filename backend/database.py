from sqlalchemy import create_engine, event
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import os

# DATABASE_URL menggunakan /app/data/ agar konsisten dengan volume Docker (minizoom_data)
# sehingga data tidak hilang saat rebuild/update container
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:////app/data/minizoom.db")

# SQLite tidak mendukung concurrent multi-process pool seperti PostgreSQL.
# Gunakan StaticPool (single shared connection) agar tidak ada konflik antar worker.
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={
        "check_same_thread": False,
        "timeout": 30,          # Tunggu max 30 detik jika DB terkunci
    },
    poolclass=StaticPool,       # 1 koneksi shared — aman untuk SQLite
)

# Aktifkan WAL mode agar read dan write bisa berjalan paralel (tidak saling blokir)
@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA journal_mode=WAL")      # Write-Ahead Logging
    cursor.execute("PRAGMA synchronous=NORMAL")    # Lebih cepat dari FULL, masih aman
    cursor.execute("PRAGMA cache_size=-64000")     # Cache 64MB di memory
    cursor.execute("PRAGMA temp_store=MEMORY")     # Temp tables di memory
    cursor.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
