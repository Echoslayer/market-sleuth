from __future__ import annotations

from pathlib import Path
from typing import Any

from pipeline.db import connect


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
