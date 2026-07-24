from __future__ import annotations

from pathlib import Path
from typing import Any

from pipeline.db import connect
from pipeline.types import RawNewsItem


def import_raw_news(scenario_id: str, items: list[dict[str, Any]], db_path: Path) -> None:
    rows = [parse_raw_item(item, index) for index, item in enumerate(items, start=1)]
    with connect(db_path) as conn:
        conn.executemany(
            """
            INSERT OR REPLACE INTO raw_news
                (scenario_id, id, date, headline, content)
            VALUES (?, ?, ?, ?, ?)
            """,
            [
                (
                    scenario_id,
                    row["id"],
                    row["date"],
                    row["headline"],
                    row["content"],
                )
                for row in rows
            ],
        )


def read_raw_news(scenario_id: str, db_path: Path) -> list[RawNewsItem]:
    with connect(db_path) as conn:
        rows = conn.execute(
            """
            SELECT id, date, headline, content
            FROM raw_news
            WHERE scenario_id = ?
            ORDER BY date, id
            """,
            (scenario_id,),
        ).fetchall()
    return [dict(row) for row in rows]


def parse_raw_item(item: dict[str, Any], index: int) -> RawNewsItem:
    if not isinstance(item, dict):
        raise ValueError(f"raw news item {index} must be an object")
    return {
        "id": _required_str(item, "id", index),
        "date": _required_str(item, "date", index),
        "headline": _required_str(item, "headline", index),
        "content": _required_str(item, "content", index),
    }


def _required_str(item: dict[str, Any], field: str, index: int) -> str:
    value = item.get(field)
    if not isinstance(value, str) or not value:
        raise ValueError(f"raw news item {index} {field} must be a non-empty string")
    return value
