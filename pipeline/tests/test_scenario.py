from pipeline.scenario import build_scenario


PRICE_ROWS = [
    {"date": "2024-01-03", "open": 102, "high": 108, "low": 101, "close": 107, "volume": 3000},
    {"date": "2024-01-02", "open": 100, "high": 105, "low": 99, "close": 102, "volume": 2000},
]

NEWS_ROWS = [
    {
        "id": "n1",
        "date": "2024-01-02",
        "headline": "Factory output rises",
        "content": "Output increased during the quarter.",
        "importance": 4,
        "is_key_event": True,
    },
    {
        "id": "n2",
        "date": "2024-01-03",
        "headline": "Analyst note",
        "content": "Analysts updated estimates.",
        "importance": 2,
        "is_key_event": False,
    },
]


def test_build_scenario_computes_date_range() -> None:
    scenario = build_scenario(
        scenario_id="chip-rally",
        stock_ticker="2330.TW",
        stock_name="TSMC",
        price_rows=PRICE_ROWS,
        news_rows=NEWS_ROWS,
    )

    assert scenario["dateRange"] == {"start": "2024-01-02", "end": "2024-01-03"}


def test_build_scenario_passes_through_news_fields() -> None:
    scenario = build_scenario(
        scenario_id="chip-rally",
        stock_ticker="2330.TW",
        stock_name="TSMC",
        price_rows=PRICE_ROWS,
        news_rows=NEWS_ROWS,
    )

    assert scenario["newsItems"] == [
        {
            "id": "n1",
            "date": "2024-01-02",
            "headline": "Factory output rises",
            "content": "Output increased during the quarter.",
            "importance": 4,
            "isKeyEvent": True,
        },
        {
            "id": "n2",
            "date": "2024-01-03",
            "headline": "Analyst note",
            "content": "Analysts updated estimates.",
            "importance": 2,
            "isKeyEvent": False,
        },
    ]


def test_build_scenario_passes_through_timeline_summary() -> None:
    scenario = build_scenario(
        scenario_id="chip-rally",
        stock_ticker="2330.TW",
        stock_name="TSMC",
        price_rows=PRICE_ROWS,
        news_rows=NEWS_ROWS,
        timeline_summary=["Demand surprised to the upside.", "Supply was tighter than expected."],
    )

    assert scenario["timelineSummary"] == [
        "Demand surprised to the upside.",
        "Supply was tighter than expected.",
    ]


def test_build_scenario_defaults_timeline_summary_to_empty_list() -> None:
    scenario = build_scenario(
        scenario_id="chip-rally",
        stock_ticker="2330.TW",
        stock_name="TSMC",
        price_rows=PRICE_ROWS,
        news_rows=NEWS_ROWS,
    )

    assert scenario["timelineSummary"] == []


def test_build_scenario_shape_matches_frontend_contract() -> None:
    scenario = build_scenario(
        scenario_id="chip-rally",
        stock_ticker="2330.TW",
        stock_name="TSMC",
        price_rows=PRICE_ROWS,
        news_rows=NEWS_ROWS,
    )

    assert set(scenario) == {
        "id",
        "stockTicker",
        "stockName",
        "dateRange",
        "priceSeries",
        "newsItems",
        "timelineSummary",
    }
    assert isinstance(scenario["id"], str)
    assert isinstance(scenario["stockTicker"], str)
    assert isinstance(scenario["stockName"], str)
    assert set(scenario["dateRange"]) == {"start", "end"}
    assert all(set(row) == {"date", "open", "high", "low", "close", "volume"} for row in scenario["priceSeries"])
    assert all(isinstance(row["close"], float) for row in scenario["priceSeries"])
    assert all(isinstance(row["volume"], int) for row in scenario["priceSeries"])
    assert all(
        set(row) == {"id", "date", "headline", "content", "importance", "isKeyEvent"}
        for row in scenario["newsItems"]
    )
    assert isinstance(scenario["timelineSummary"], list)
