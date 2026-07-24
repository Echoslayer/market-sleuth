from __future__ import annotations

from typing import Any


def build_scenario(
    *,
    scenario_id: str,
    stock_ticker: str,
    stock_name: str,
    price_rows: list[dict[str, Any]],
    news_rows: list[dict[str, Any]],
    timeline_summary: list[str] | None = None,
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
    news_items = [
        {
            "id": str(row["id"]),
            "date": str(row["date"]),
            "headline": str(row["headline"]),
            "content": str(row["content"]),
            "importance": int(row["importance"]),
            "isKeyEvent": bool(row["is_key_event"]),
        }
        for row in sorted(news_rows, key=lambda row: (row["date"], row["id"]))
    ]

    return {
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
