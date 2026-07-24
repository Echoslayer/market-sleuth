import pytest

from pipeline.scoring import parse_llm_score_response, resolve_news


RAW_ROWS = [
    {
        "id": "n1",
        "date": "2024-01-02",
        "headline": "Factory output rises",
        "content": "Output increased during the quarter.",
    },
    {
        "id": "n2",
        "date": "2024-01-03",
        "headline": "Analyst note",
        "content": "Analysts updated estimates.",
    },
]


def test_parse_llm_score_response_validates_rows() -> None:
    rows = parse_llm_score_response(
        """
        [
          {
            "news_id": "draft-001",
            "importance": 4,
            "is_key_event": true
          }
        ]
        """
    )

    assert rows == [{"news_id": "draft-001", "importance": 4, "is_key_event": True}]


@pytest.mark.parametrize(
    ("response", "message"),
    [
        ('[{"news_id":"n1","importance":6,"is_key_event":true}]', "importance"),
        ('[{"news_id":"n1","importance":3,"is_key_event":"true"}]', "is_key_event"),
    ],
)
def test_parse_llm_score_response_rejects_malformed_entries(response: str, message: str) -> None:
    with pytest.raises(ValueError, match=message):
        parse_llm_score_response(response)


def test_resolve_news_merges_raw_rows_with_scores() -> None:
    rows = resolve_news(
        RAW_ROWS,
        [
            {"news_id": "n1", "importance": 4, "is_key_event": True},
            {"news_id": "n2", "importance": 2, "is_key_event": False},
        ],
    )

    assert rows == [
        {**RAW_ROWS[0], "importance": 4, "is_key_event": True},
        {**RAW_ROWS[1], "importance": 2, "is_key_event": False},
    ]


def test_resolve_news_uses_rows_already_filtered_to_requested_method() -> None:
    manual_scores = [{"news_id": "n1", "importance": 4, "is_key_event": True}]
    llm_scores = [{"news_id": "n1", "importance": 1, "is_key_event": False}]

    assert resolve_news(RAW_ROWS, manual_scores) == [
        {**RAW_ROWS[0], "importance": 4, "is_key_event": True}
    ]
    assert resolve_news(RAW_ROWS, llm_scores) == [
        {**RAW_ROWS[0], "importance": 1, "is_key_event": False}
    ]


def test_resolve_news_excludes_raw_rows_without_scores() -> None:
    rows = resolve_news(RAW_ROWS, [{"news_id": "n1", "importance": 4, "is_key_event": True}])

    assert rows == [{**RAW_ROWS[0], "importance": 4, "is_key_event": True}]


def test_resolve_news_ignores_scores_for_missing_raw_rows() -> None:
    rows = resolve_news(
        RAW_ROWS,
        [
            {"news_id": "n1", "importance": 4, "is_key_event": True},
            {"news_id": "missing", "importance": 5, "is_key_event": True},
        ],
    )

    assert rows == [{**RAW_ROWS[0], "importance": 4, "is_key_event": True}]
