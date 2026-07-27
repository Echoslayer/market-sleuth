from pipeline.market import build_market_snapshot


INSTRUMENTS = [
    {
        "symbol": "2330.TW",
        "name": "台積電",
        "kind": "stock",
        "exchange": "TWSE",
        "currency": "TWD",
        "timezone": "Asia/Taipei",
    },
    {
        "symbol": "^TWII",
        "name": "加權指數",
        "kind": "index",
        "exchange": "TWSE",
        "currency": "TWD",
        "timezone": "Asia/Taipei",
    },
]

PRICE_ROWS = {
    "2330.TW": [
        {"date": "2026-01-03", "open": 102, "high": 108, "low": 101, "close": 107, "volume": 3000},
        {"date": "2026-01-02", "open": 100, "high": 105, "low": 99, "close": 102, "volume": 2000},
    ],
    "^TWII": [
        {"date": "2026-01-02", "open": 22000, "high": 22200, "low": 21900, "close": 22100, "volume": 5000}
    ],
}

NEWS_ROWS = [
    {
        "id": "n1",
        "date": "2026-01-02T09:00:00+08:00",
        "headline": "Chip demand rises",
        "content": "Demand increased.",
        "summaryZh": "晶片需求增加。",
        "url": "https://example.com/chips",
        "symbols": ["2330.TW"],
        "categories": ["產業", "公司"],
    },
    {
        "id": "n2",
        "date": "2026-01-03T09:00:00+08:00",
        "headline": "Policy update",
        "content": "A policy changed.",
        "symbols": [],
        "categories": ["政策法規"],
    },
]


def test_build_market_snapshot_matches_contract() -> None:
    snapshot = build_market_snapshot(
        snapshot_id="taiwan-watchlist",
        generated_at="2026-01-04T18:00:00+08:00",
        instruments=INSTRUMENTS,
        price_rows_by_symbol=PRICE_ROWS,
        news_rows=NEWS_ROWS,
    )

    assert set(snapshot) == {"id", "generatedAt", "instruments", "priceSeries", "newsItems"}
    assert [item["symbol"] for item in snapshot["instruments"]] == ["^TWII", "2330.TW"]
    assert [point["date"] for point in snapshot["priceSeries"]["2330.TW"]] == ["2026-01-02", "2026-01-03"]
    assert isinstance(snapshot["priceSeries"]["2330.TW"][0]["close"], float)
    assert isinstance(snapshot["priceSeries"]["2330.TW"][0]["volume"], int)
    assert [item["id"] for item in snapshot["newsItems"]] == ["n1", "n2"]
    assert snapshot["newsItems"][0]["categories"] == ["產業", "公司"]
    assert snapshot["newsItems"][1]["symbols"] == []
    assert snapshot["generatedAt"] == "2026-01-04T18:00:00+08:00"


def test_build_market_snapshot_rejects_unknown_news_category() -> None:
    news = [{**NEWS_ROWS[0], "categories": ["傳聞"]}]

    try:
        build_market_snapshot(
            snapshot_id="taiwan-watchlist",
            generated_at="2026-01-04T18:00:00+08:00",
            instruments=INSTRUMENTS,
            price_rows_by_symbol=PRICE_ROWS,
            news_rows=news,
        )
    except ValueError as exc:
        assert str(exc) == "unknown news category: 傳聞"
    else:
        raise AssertionError("expected invalid category to fail")
