import pytest

from pipeline.news_draft import parse_news_draft_response


def test_parse_news_draft_response_validates_rows() -> None:
    rows = parse_news_draft_response(
        """
        [
          {
            "id": "draft-001",
            "date": "2024-01-02",
            "headline": "Factory output rises",
            "content": "Output increased during the quarter.",
            "importance": 4,
            "is_key_event": true
          }
        ]
        """
    )

    assert rows == [
        {
            "id": "draft-001",
            "date": "2024-01-02",
            "headline": "Factory output rises",
            "content": "Output increased during the quarter.",
            "importance": 4,
            "is_key_event": True,
        }
    ]


@pytest.mark.parametrize(
    ("response", "message"),
    [
        ('[{"id":"n1","date":"2024-01-02","headline":"h","content":"c","importance":6,"is_key_event":true}]', "importance"),
        ('[{"id":"n1","date":"2024-01-02","headline":"h","content":"c","importance":3,"is_key_event":"true"}]', "is_key_event"),
    ],
)
def test_parse_news_draft_response_rejects_malformed_entries(response: str, message: str) -> None:
    with pytest.raises(ValueError, match=message):
        parse_news_draft_response(response)
