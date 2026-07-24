from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any

from pipeline.db import connect
from pipeline.raw_news import parse_raw_item
from pipeline.types import NewsScoreItem, RawNewsItem, ResolvedNewsItem, ScoreComparison


DEFAULT_MODEL = "claude-sonnet-5"


def write_scores(
    scenario_id: str,
    method: str,
    scored_items: list[dict[str, Any]],
    db_path: Path,
) -> None:
    if not method:
        raise ValueError("method must be a non-empty string")
    rows = [_score_item(item, index) for index, item in enumerate(scored_items, start=1)]
    with connect(db_path) as conn:
        conn.executemany(
            """
            INSERT OR REPLACE INTO news_scores
                (scenario_id, news_id, method, importance, is_key_event)
            VALUES (?, ?, ?, ?, ?)
            """,
            [
                (
                    scenario_id,
                    row["news_id"],
                    method,
                    row["importance"],
                    int(row["is_key_event"]),
                )
                for row in rows
            ],
        )


def draft_scores_with_llm(
    scenario_id: str,
    raw_items: list[dict[str, Any]],
    db_path: Path,
) -> str:
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        raise RuntimeError("ANTHROPIC_API_KEY is not set; cannot draft news scores with Anthropic")

    rows = [parse_raw_item(item, index) for index, item in enumerate(raw_items, start=1)]
    model = os.environ.get("ANTHROPIC_MODEL", DEFAULT_MODEL)

    try:
        import anthropic

        client = anthropic.Anthropic(api_key=api_key)
        response = client.messages.create(
            model=model,
            max_tokens=4000,
            temperature=0,
            messages=[{"role": "user", "content": _build_prompt(rows)}],
        )
    except Exception as exc:
        raise RuntimeError(f"Anthropic API call failed: {exc}") from exc

    write_scores(scenario_id, model, parse_llm_score_response(_response_text(response)), db_path)
    return model


def parse_llm_score_response(text: str) -> list[NewsScoreItem]:
    try:
        data = json.loads(_json_text(text))
    except json.JSONDecodeError as exc:
        raise ValueError(f"LLM response was not valid JSON: {exc}") from exc
    if isinstance(data, dict) and isinstance(data.get("items"), list):
        data = data["items"]
    if not isinstance(data, list):
        raise ValueError("LLM response must be a JSON list or an object with an items list")

    return [_score_item(item, index, source="draft item") for index, item in enumerate(data, start=1)]


def read_scores(scenario_id: str, method: str, db_path: Path) -> list[NewsScoreItem]:
    with connect(db_path) as conn:
        rows = conn.execute(
            """
            SELECT news_id, importance, is_key_event
            FROM news_scores
            WHERE scenario_id = ? AND method = ?
            ORDER BY news_id
            """,
            (scenario_id, method),
        ).fetchall()
    return [
        {
            "news_id": str(row["news_id"]),
            "importance": int(row["importance"]),
            "is_key_event": bool(row["is_key_event"]),
        }
        for row in rows
    ]


def compare_scores(rows_a: list[NewsScoreItem], rows_b: list[NewsScoreItem]) -> ScoreComparison:
    scores_a = {row["news_id"]: row for row in rows_a}
    scores_b = {row["news_id"]: row for row in rows_b}
    shared_news_ids = sorted(scores_a.keys() & scores_b.keys())

    rows = []
    abs_importance_diff_total = 0
    key_event_disagreement_news_ids: list[str] = []
    for news_id in shared_news_ids:
        score_a = scores_a[news_id]
        score_b = scores_b[news_id]
        importance_diff = score_a["importance"] - score_b["importance"]
        key_event_agree = score_a["is_key_event"] == score_b["is_key_event"]
        abs_importance_diff_total += abs(importance_diff)
        if not key_event_agree:
            key_event_disagreement_news_ids.append(news_id)
        rows.append(
            {
                "news_id": news_id,
                "importance_a": score_a["importance"],
                "importance_b": score_b["importance"],
                "importance_diff": importance_diff,
                "is_key_event_a": score_a["is_key_event"],
                "is_key_event_b": score_b["is_key_event"],
                "key_event_agree": key_event_agree,
            }
        )

    compared_count = len(rows)
    mean_abs_importance_diff = (
        abs_importance_diff_total / compared_count if compared_count else 0.0
    )
    return {
        "rows": rows,
        "summary": {
            "compared_count": compared_count,
            "mean_abs_importance_diff": mean_abs_importance_diff,
            "key_event_disagreement_count": len(key_event_disagreement_news_ids),
            "key_event_disagreement_news_ids": key_event_disagreement_news_ids,
            "only_in_a": len(scores_a.keys() - scores_b.keys()),
            "only_in_b": len(scores_b.keys() - scores_a.keys()),
        },
    }


def resolve_news(
    raw_rows: list[dict[str, Any]],
    score_rows: list[dict[str, Any]],
) -> list[ResolvedNewsItem]:
    """Merge raw rows with score rows already filtered to one method.

    Raw rows without a score are excluded. Score rows whose news_id does not
    exist in raw rows are ignored.
    """
    score_items = [_score_item(row, index) for index, row in enumerate(score_rows, start=1)]
    scores = {row["news_id"]: row for row in score_items}
    resolved: list[ResolvedNewsItem] = []
    for index, raw_row in enumerate(raw_rows, start=1):
        raw = parse_raw_item(raw_row, index)
        score = scores.get(raw["id"])
        if not score:
            continue
        resolved.append({**raw, "importance": score["importance"], "is_key_event": score["is_key_event"]})
    return resolved


def _score_item(item: dict[str, Any], index: int, source: str = "score item") -> NewsScoreItem:
    if not isinstance(item, dict):
        raise ValueError(f"{source} {index} must be an object")
    importance = item.get("importance")
    is_key_event = item.get("is_key_event")
    if not isinstance(importance, int) or isinstance(importance, bool) or not 1 <= importance <= 5:
        raise ValueError(f"{source} {index} importance must be an integer from 1 to 5")
    if not isinstance(is_key_event, bool):
        raise ValueError(f"{source} {index} is_key_event must be a boolean")
    news_id = item.get("news_id", item.get("id"))
    if not isinstance(news_id, str) or not news_id:
        raise ValueError(f"{source} {index} news_id must be a non-empty string")
    return {"news_id": news_id, "importance": importance, "is_key_event": is_key_event}


def _build_prompt(items: list[RawNewsItem]) -> str:
    return (
        "You are scoring stock-market scenario news for human review.\n"
        "For each raw news item, decide how likely it is to have driven the stock price move.\n"
        "Return only JSON: an array of objects with exactly these fields: "
        "news_id, importance, is_key_event.\n"
        "news_id must match the input id. importance must be an integer 1-5. "
        "is_key_event must be a JSON boolean.\n\n"
        f"Raw news:\n{json.dumps(items, ensure_ascii=False, indent=2)}"
    )


def _response_text(response: Any) -> str:
    text = "\n".join(
        block.text
        for block in response.content
        if getattr(block, "type", None) == "text" and isinstance(getattr(block, "text", None), str)
    )
    if not text:
        raise ValueError("Anthropic response did not contain text")
    return text


def _json_text(text: str) -> str:
    stripped = text.strip()
    if stripped.startswith("```"):
        lines = stripped.splitlines()
        if lines and lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].startswith("```"):
            lines = lines[:-1]
        stripped = "\n".join(lines).strip()
    return stripped

