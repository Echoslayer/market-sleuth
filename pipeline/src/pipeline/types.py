from __future__ import annotations

from typing import NotRequired, TypedDict


class RawNewsItem(TypedDict):
    id: str
    date: str
    headline: str
    content: str
    url: NotRequired[str]
    source: str


class NewsScoreItem(TypedDict):
    news_id: str
    importance: int
    is_key_event: bool


class ScoreComparisonItem(TypedDict):
    news_id: str
    importance_a: int
    importance_b: int
    importance_diff: int
    is_key_event_a: bool
    is_key_event_b: bool
    key_event_agree: bool


class ScoreComparisonSummary(TypedDict):
    compared_count: int
    mean_abs_importance_diff: float
    key_event_disagreement_count: int
    key_event_disagreement_news_ids: list[str]
    only_in_a: int
    only_in_b: int


class ScoreComparison(TypedDict):
    rows: list[ScoreComparisonItem]
    summary: ScoreComparisonSummary


class ResolvedNewsItem(RawNewsItem):
    importance: int
    is_key_event: bool
