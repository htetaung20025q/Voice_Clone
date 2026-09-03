"""
Database configuration and SQLite connection manager.
Provides ACID transactions, foreign keys, WAL mode, and table initialization.
"""

import os
import sqlite3
import logging
from pathlib import Path
from typing import Generator
from contextlib import contextmanager

logger = logging.getLogger("burmavoice.db")

# Default database location inside backend directory
DEFAULT_DB_PATH = Path(__file__).resolve().parent.parent.parent / "burmeseatan.db"
DB_PATH = os.environ.get("DATABASE_PATH", str(DEFAULT_DB_PATH))


def get_db_connection() -> sqlite3.Connection:
    """Create a configured SQLite database connection with row factory and WAL mode."""
    conn = sqlite3.connect(DB_PATH, timeout=10.0, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    conn.execute("PRAGMA journal_mode = WAL;")
    conn.execute("PRAGMA synchronous = NORMAL;")
    return conn


@contextmanager
def get_db_context() -> Generator[sqlite3.Connection, None, None]:
    """Context manager for atomic database transactions."""
    conn = get_db_connection()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def init_db(custom_path: str = None) -> None:
    """Initialize database tables, indexes, and constraints."""
    global DB_PATH
    if custom_path:
        DB_PATH = custom_path

    # Ensure parent folder exists
    Path(DB_PATH).parent.mkdir(parents=True, exist_ok=True)

    with get_db_context() as conn:
        cursor = conn.cursor()

        # 1. users table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                hashed_password TEXT NOT NULL,
                is_premium INTEGER NOT NULL DEFAULT 0,
                is_admin INTEGER NOT NULL DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)

        # Migration check: ensure is_admin column exists if table was created previously
        cursor.execute("PRAGMA table_info(users);")
        existing_cols = [row[1] for row in cursor.fetchall()]
        if "is_admin" not in existing_cols:
            cursor.execute("ALTER TABLE users ADD COLUMN is_admin INTEGER NOT NULL DEFAULT 0;")

        # 2. credits table (1-to-1 with users)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS credits (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER UNIQUE NOT NULL,
                balance INTEGER NOT NULL DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );
        """)

        # 3. credit_transactions table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS credit_transactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                amount INTEGER NOT NULL,
                type TEXT NOT NULL,
                description TEXT NOT NULL,
                reference_id TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );
        """)

        # 4. generations table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS generations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                voice TEXT NOT NULL,
                style TEXT NOT NULL,
                text TEXT NOT NULL,
                audio_url TEXT,
                credits_used INTEGER NOT NULL DEFAULT 0,
                status TEXT NOT NULL,
                error_message TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );
        """)

        # 5. payments table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS payments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                package TEXT NOT NULL,
                amount INTEGER NOT NULL,
                credits INTEGER NOT NULL,
                status TEXT NOT NULL,
                payment_reference TEXT UNIQUE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );
        """)

        # Indexes for fast querying
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_credits_user_id ON credits(user_id);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON credit_transactions(user_id);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_generations_user_id ON generations(user_id);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_payments_reference ON payments(payment_reference);")

    logger.info(f"Database initialized successfully at: {DB_PATH}")
