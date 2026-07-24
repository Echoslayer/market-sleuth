from __future__ import annotations

import json
from pathlib import Path
from typing import Any


def build_scenario(
    *,
    scenario_id: str,
    stock_ticker: str,
    stock_name: str,
    price_rows: list[dict[str, Any]],
    news_rows: list[dict[str, Any]],
    timeline_summary: list[str] | None = None,
    reveal_cutoff_date: str | None = None,
) -> dict[str, Any]:
    if not price_rows:
        raise ValueError("price_rows must not be empty")

    price_series = [
        {
            "date": str(row["date"]),
            "open": float(row["open"]),
            "high": float(row["high"]),
            "low": float(row["low"]),
            "close": float(row["close"]),
            "volume": int(row["volume"]),
        }
        for row in sorted(price_rows, key=lambda row: row["date"])
    ]
    news_items = []
    for row in sorted(news_rows, key=lambda row: (row["date"], row["id"])):
        item = {
            "id": str(row["id"]),
            "date": str(row["date"]),
            "headline": str(row["headline"]),
            "content": str(row["content"]),
            "importance": int(row["importance"]),
            "isKeyEvent": bool(row["is_key_event"]),
        }
        if row.get("url") is not None:
            item["url"] = str(row["url"])
        news_items.append(item)

    scenario: dict[str, Any] = {
        "id": scenario_id,
        "stockTicker": stock_ticker,
        "stockName": stock_name,
        "dateRange": {
            "start": price_series[0]["date"],
            "end": price_series[-1]["date"],
        },
        "priceSeries": price_series,
        "newsItems": news_items,
        "timelineSummary": list(timeline_summary) if timeline_summary else [],
    }
    if reveal_cutoff_date:
        scenario["revealCutoffDate"] = reveal_cutoff_date
    return scenario


def build_scenario_file(
    *,
    scenario_id: str,
    ticker: str,
    stock_name: str,
    start: str,
    end: str,
    db_path: Path,
    out_dir: Path,
    score_method: str,
    timeline_summary: list[str] | None = None,
    reveal_cutoff_date: str | None = None,
) -> Path:
    from pipeline.prices import fetch_prices_to_sqlite, read_price_rows
    from pipeline.raw_news import read_raw_news
    from pipeline.scoring import read_scores, resolve_news

    fetch_prices_to_sqlite(ticker, start, end, db_path)
    scenario = build_scenario(
        scenario_id=scenario_id,
        stock_ticker=ticker,
        stock_name=stock_name,
        price_rows=read_price_rows(ticker, db_path),
        news_rows=resolve_news(
            read_raw_news(scenario_id, db_path),
            read_scores(scenario_id, score_method, db_path),
        ),
        timeline_summary=timeline_summary,
        reveal_cutoff_date=reveal_cutoff_date,
    )
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / f"{scenario_id}.json"
    out_path.write_text(json.dumps(scenario, indent=2) + "\n")
    return out_path
