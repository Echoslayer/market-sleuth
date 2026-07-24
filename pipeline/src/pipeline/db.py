from __future__ import annotations

import sqlite3
from pathlib import Path


SCHEMA = """
CREATE TABLE IF NOT EXISTS prices (
    ticker TEXT NOT NULL,
    date TEXT NOT NULL,
    open REAL NOT NULL,
    high REAL NOT NULL,
    low REAL NOT NULL,
    close REAL NOT NULL,
    volume INTEGER NOT NULL,
    PRIMARY KEY (ticker, date)
);

CREATE TABLE IF NOT EXISTS raw_news (
    scenario_id TEXT NOT NULL,
    id TEXT NOT NULL,
    date TEXT NOT NULL,
    headline TEXT NOT NULL,
    content TEXT NOT NULL,
    url TEXT,
    source TEXT NOT NULL,
    PRIMARY KEY (scenario_id, id)
);

CREATE TABLE IF NOT EXISTS news_scores (
    scenario_id TEXT NOT NULL,
    news_id TEXT NOT NULL,
    method TEXT NOT NULL,
    importance INTEGER NOT NULL CHECK (importance BETWEEN 1 AND 5),
    is_key_event INTEGER NOT NULL CHECK (is_key_event IN (0, 1)),
    scored_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (scenario_id, news_id, method)
);
"""


def connect(db_path: Path) -> sqlite3.Connection:
    db_path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    conn.executescript(SCHEMA)
    _migrate_raw_news(conn)
    return conn


def _migrate_raw_news(conn: sqlite3.Connection) -> None:
    columns = {row["name"] for row in conn.execute("PRAGMA table_info(raw_news)").fetchall()}
    if "url" not in columns:
        conn.execute("ALTER TABLE raw_news ADD COLUMN url TEXT")
    if "source" not in columns:
        conn.execute("ALTER TABLE raw_news ADD COLUMN source TEXT NOT NULL DEFAULT 'manual'")
