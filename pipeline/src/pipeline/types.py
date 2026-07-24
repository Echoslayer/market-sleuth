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


class ResolvedNewsItem(RawNewsItem):
    importance: int
    is_key_event: bool
