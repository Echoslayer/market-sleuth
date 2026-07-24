from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any

from pipeline.staging import write_news_rows


DEFAULT_MODEL = "claude-sonnet-5"


def draft_news(scenario_id: str, raw_news_path: Path, db_path: Path) -> None:
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        raise RuntimeError("ANTHROPIC_API_KEY is not set; cannot draft news with Anthropic")

    raw_items = _load_raw_news(raw_news_path)
    prompt = _build_prompt(raw_items)

    try:
        import anthropic

        client = anthropic.Anthropic(api_key=api_key)
        response = client.messages.create(
            model=os.environ.get("ANTHROPIC_MODEL", DEFAULT_MODEL),
            max_tokens=4000,
            temperature=0,
            messages=[{"role": "user", "content": prompt}],
        )
    except Exception as exc:
        raise RuntimeError(f"Anthropic API call failed: {exc}") from exc

    rows = parse_news_draft_response(_response_text(response))
    write_news_rows(scenario_id, rows, db_path)


def parse_news_draft_response(text: str) -> list[dict[str, Any]]:
    try:
        data = json.loads(_json_text(text))
    except json.JSONDecodeError as exc:
        raise ValueError(f"LLM response was not valid JSON: {exc}") from exc
    if isinstance(data, dict) and isinstance(data.get("items"), list):
        data = data["items"]
    if not isinstance(data, list):
        raise ValueError("LLM response must be a JSON list or an object with an items list")

    rows: list[dict[str, Any]] = []
    for index, item in enumerate(data, start=1):
        if not isinstance(item, dict):
            raise ValueError(f"draft item {index} must be an object")
        importance = item.get("importance")
        is_key_event = item.get("is_key_event")
        if not isinstance(importance, int) or isinstance(importance, bool) or not 1 <= importance <= 5:
            raise ValueError(f"draft item {index} importance must be an integer from 1 to 5")
        if not isinstance(is_key_event, bool):
            raise ValueError(f"draft item {index} is_key_event must be a boolean")
        rows.append(
            {
                "id": _required_str(item, "id", index),
                "date": _required_str(item, "date", index),
                "headline": _required_str(item, "headline", index),
                "content": _required_str(item, "content", index),
                "importance": importance,
                "is_key_event": is_key_event,
            }
        )
    return rows


def _load_raw_news(path: Path) -> list[dict[str, str]]:
    items = json.loads(path.read_text())
    if not isinstance(items, list):
        raise ValueError("raw news JSON must be a list of objects")
    rows = []
    for index, item in enumerate(items, start=1):
        if not isinstance(item, dict):
            raise ValueError(f"raw news item {index} must be an object")
        rows.append(
            {
                "id": f"draft-{index:03d}",
                "date": _required_str(item, "date", index),
                "headline": _required_str(item, "headline", index),
                "content": _required_str(item, "content", index),
            }
        )
    return rows


def _build_prompt(items: list[dict[str, str]]) -> str:
    return (
        "You are drafting stock-market scenario news metadata for human review.\n"
        "For each raw news item, decide how likely it is to have driven the stock price move.\n"
        "Return only JSON: an array of objects with exactly these fields: "
        "id, date, headline, content, importance, is_key_event.\n"
        "importance must be an integer 1-5. is_key_event must be a JSON boolean.\n"
        "Keep id/date/headline/content unchanged from the input.\n\n"
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


def _required_str(item: dict[str, Any], field: str, index: int) -> str:
    value = item.get(field)
    if not isinstance(value, str) or not value:
        raise ValueError(f"draft item {index} {field} must be a non-empty string")
    return value
