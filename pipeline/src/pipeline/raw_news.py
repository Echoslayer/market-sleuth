from __future__ import annotations

from pathlib import Path
from typing import Any

from pipeline.db import connect
from pipeline.types import RawNewsItem


VALID_SOURCES = {"manual", "agent", "gdelt", "crawler"}


def import_raw_news(scenario_id: str, items: list[dict[str, Any]], db_path: Path, source: str = "manual") -> None:
    rows = [parse_raw_item(item, index, default_source=source) for index, item in enumerate(items, start=1)]
    with connect(db_path) as conn:
        conn.executemany(
            """
            INSERT OR REPLACE INTO raw_news
                (scenario_id, id, date, headline, content, url, source)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            [
                (
                    scenario_id,
                    row["id"],
                    row["date"],
                    row["headline"],
                    row["content"],
                    row.get("url"),
                    row["source"],
                )
                for row in rows
            ],
        )


def read_raw_news(scenario_id: str, db_path: Path) -> list[RawNewsItem]:
    with connect(db_path) as conn:
        rows = conn.execute(
            """
            SELECT id, date, headline, content, url, source
            FROM raw_news
            WHERE scenario_id = ?
            ORDER BY date, id
            """,
            (scenario_id,),
        ).fetchall()
    return [_row_to_raw_item(row) for row in rows]


def parse_raw_item(item: dict[str, Any], index: int, default_source: str = "manual") -> RawNewsItem:
    if not isinstance(item, dict):
        raise ValueError(f"raw news item {index} must be an object")
    source = item.get("source", default_source)
    if not isinstance(source, str) or source not in VALID_SOURCES:
        raise ValueError(f"raw news item {index} source must be one of {sorted(VALID_SOURCES)}")

    row: RawNewsItem = {
        "id": _required_str(item, "id", index),
        "date": _required_str(item, "date", index),
        "headline": _required_str(item, "headline", index),
        "content": _required_str(item, "content", index),
        "source": source,
    }
    url = item.get("url")
    if url is not None:
        if not isinstance(url, str) or not url:
            raise ValueError(f"raw news item {index} url must be a non-empty string when set")
        row["url"] = url
    return row


def _row_to_raw_item(row: Any) -> RawNewsItem:
    item: RawNewsItem = {
        "id": str(row["id"]),
        "date": str(row["date"]),
        "headline": str(row["headline"]),
        "content": str(row["content"]),
        "source": str(row["source"]),
    }
    if row["url"] is not None:
        item["url"] = str(row["url"])
    return item


def _required_str(item: dict[str, Any], field: str, index: int) -> str:
    value = item.get(field)
    if not isinstance(value, str) or not value:
        raise ValueError(f"raw news item {index} {field} must be a non-empty string")
    return value
