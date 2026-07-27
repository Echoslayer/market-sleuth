from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from pipeline.prices import fetch_prices_to_sqlite, read_price_rows


NEWS_CATEGORIES = {"總經", "產業", "公司", "財報", "政策法規", "其他"}


def build_market_snapshot(
    *,
    snapshot_id: str,
    generated_at: str,
    instruments: list[dict[str, Any]],
    price_rows_by_symbol: dict[str, list[dict[str, Any]]],
    news_rows: list[dict[str, Any]],
) -> dict[str, Any]:
    news_items = []
    for row in sorted(news_rows, key=lambda item: (item["date"], item["id"])):
        categories = [str(category) for category in row["categories"]]
        unknown = set(categories) - NEWS_CATEGORIES
        if unknown:
            raise ValueError(f"unknown news category: {sorted(unknown)[0]}")
        item = {
            "id": str(row["id"]),
            "date": str(row["date"]),
            "headline": str(row["headline"]),
            "content": str(row["content"]),
            "symbols": [str(symbol) for symbol in row.get("symbols", [])],
            "categories": categories,
        }
        for optional in ("url", "summaryZh"):
            if row.get(optional) is not None:
                item[optional] = str(row[optional])
        news_items.append(item)

    return {
        "id": snapshot_id,
        "generatedAt": generated_at,
        "instruments": sorted(instruments, key=lambda item: (item["kind"] != "index", item["symbol"])),
        "priceSeries": {
            instrument["symbol"]: [_price_point(row) for row in sorted(price_rows_by_symbol[instrument["symbol"]], key=lambda row: row["date"])]
            for instrument in instruments
        },
        "newsItems": news_items,
    }


def build_market_snapshot_file(
    *,
    config_path: Path,
    start: str,
    end: str,
    generated_at: str,
    db_path: Path,
    out_path: Path,
    news_path: Path | None = None,
) -> Path:
    config = json.loads(config_path.read_text())
    instruments = config["instruments"]
    for instrument in instruments:
        fetch_prices_to_sqlite(instrument["symbol"], start, end, db_path)
    news_rows = json.loads(news_path.read_text()) if news_path else []
    snapshot = build_market_snapshot(
        snapshot_id=config["id"],
        generated_at=generated_at,
        instruments=instruments,
        price_rows_by_symbol={
            item["symbol"]: read_price_rows(item["symbol"], db_path, start=start, end=end) for item in instruments
        },
        news_rows=news_rows,
    )
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(snapshot, ensure_ascii=False, indent=2) + "\n")
    return out_path


def _price_point(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "date": str(row["date"]),
        "open": float(row["open"]),
        "high": float(row["high"]),
        "low": float(row["low"]),
        "close": float(row["close"]),
        "volume": int(row["volume"]),
    }
