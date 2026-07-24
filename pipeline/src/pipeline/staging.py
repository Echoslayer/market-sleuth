from __future__ import annotations

import csv
import json
import sqlite3
from pathlib import Path
from typing import Any


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

CREATE TABLE IF NOT EXISTS news (
    scenario_id TEXT NOT NULL,
    id TEXT NOT NULL,
    date TEXT NOT NULL,
    headline TEXT NOT NULL,
    content TEXT NOT NULL,
    importance INTEGER NOT NULL CHECK (importance BETWEEN 1 AND 5),
    is_key_event INTEGER NOT NULL CHECK (is_key_event IN (0, 1)),
    PRIMARY KEY (scenario_id, id)
);
"""


def connect(db_path: Path) -> sqlite3.Connection:
    db_path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    conn.executescript(SCHEMA)
    return conn


def fetch_prices_to_sqlite(ticker: str, start: str, end: str, db_path: Path) -> None:
    import yfinance as yf

    frame = yf.download(ticker, start=start, end=end, progress=False, auto_adjust=False)
    if frame.empty:
        raise ValueError(f"no price data returned for {ticker} from {start} to {end}")
    if hasattr(frame.columns, "nlevels") and frame.columns.nlevels > 1:
        frame.columns = frame.columns.get_level_values(0)

    with connect(db_path) as conn:
        conn.executemany(
            """
            INSERT OR REPLACE INTO prices
                (ticker, date, open, high, low, close, volume)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            [
                (
                    ticker,
                    index.strftime("%Y-%m-%d"),
                    float(row["Open"]),
                    float(row["High"]),
                    float(row["Low"]),
                    float(row["Close"]),
                    int(row["Volume"]),
                )
                for index, row in frame.iterrows()
            ],
        )


def import_news_json(scenario_id: str, news_path: Path, db_path: Path) -> None:
    items = json.loads(news_path.read_text())
    if not isinstance(items, list):
        raise ValueError("news JSON must be a list of objects")

    with connect(db_path) as conn:
        conn.executemany(
            """
            INSERT OR REPLACE INTO news
                (scenario_id, id, date, headline, content, importance, is_key_event)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            [
                (
                    scenario_id,
                    str(item["id"]),
                    str(item["date"]),
                    str(item["headline"]),
                    str(item["content"]),
                    int(item["importance"]),
                    int(bool(item["is_key_event"])),
                )
                for item in items
            ],
        )


def import_news_csv(scenario_id: str, news_path: Path, db_path: Path) -> None:
    with news_path.open(newline="") as file:
        items = list(csv.DictReader(file))

    with connect(db_path) as conn:
        conn.executemany(
            """
            INSERT OR REPLACE INTO news
                (scenario_id, id, date, headline, content, importance, is_key_event)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            [
                (
                    scenario_id,
                    str(item["id"]),
                    str(item["date"]),
                    str(item["headline"]),
                    str(item["content"]),
                    int(item["importance"]),
                    _csv_bool(item["is_key_event"]),
                )
                for item in items
            ],
        )


def import_news(scenario_id: str, news_path: Path, db_path: Path) -> None:
    if news_path.suffix.lower() == ".csv":
        import_news_csv(scenario_id, news_path, db_path)
    else:
        import_news_json(scenario_id, news_path, db_path)


def read_price_rows(ticker: str, db_path: Path) -> list[dict[str, Any]]:
    with connect(db_path) as conn:
        rows = conn.execute(
            """
            SELECT date, open, high, low, close, volume
            FROM prices
            WHERE ticker = ?
            ORDER BY date
            """,
            (ticker,),
        ).fetchall()
    return [dict(row) for row in rows]


def read_news_rows(scenario_id: str, db_path: Path) -> list[dict[str, Any]]:
    with connect(db_path) as conn:
        rows = conn.execute(
            """
            SELECT id, date, headline, content, importance, is_key_event
            FROM news
            WHERE scenario_id = ?
            ORDER BY date, id
            """,
            (scenario_id,),
        ).fetchall()
    return [{**dict(row), "is_key_event": bool(row["is_key_event"])} for row in rows]


def _csv_bool(value: str) -> int:
    return int(value.strip().lower() in {"1", "true", "yes", "y"})
