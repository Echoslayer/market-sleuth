from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from pipeline.news_draft import draft_news
from pipeline.scenario import build_scenario
from pipeline.staging import (
    fetch_prices_to_sqlite,
    import_news,
    read_news_rows,
    read_price_rows,
)


DEFAULT_DB = Path(__file__).resolve().parents[2] / "staging.db"
DEFAULT_DATA_DIR = Path(__file__).resolve().parents[3] / "data"


def main() -> None:
    parser = argparse.ArgumentParser(description="Build a market-sleuth scenario JSON file.")
    parser.add_argument("--scenario-id", required=True)
    parser.add_argument("--ticker", required=True)
    parser.add_argument("--stock-name", required=True)
    parser.add_argument("--start", required=True)
    parser.add_argument("--end", required=True)
    parser.add_argument("--db", type=Path, default=DEFAULT_DB)
    parser.add_argument("--out-dir", type=Path, default=DEFAULT_DATA_DIR)
    parser.add_argument("--timeline-summary-file", type=Path, default=None)
    args = parser.parse_args()

    fetch_prices_to_sqlite(args.ticker, args.start, args.end, args.db)
    timeline_summary = (
        json.loads(args.timeline_summary_file.read_text()) if args.timeline_summary_file else []
    )
    scenario = build_scenario(
        scenario_id=args.scenario_id,
        stock_ticker=args.ticker,
        stock_name=args.stock_name,
        price_rows=read_price_rows(args.ticker, args.db),
        news_rows=read_news_rows(args.scenario_id, args.db),
        timeline_summary=timeline_summary,
    )

    args.out_dir.mkdir(parents=True, exist_ok=True)
    out_path = args.out_dir / f"{args.scenario_id}.json"
    out_path.write_text(json.dumps(scenario, indent=2) + "\n")
    print(out_path)


def import_news_main() -> None:
    parser = argparse.ArgumentParser(description="Import manual scenario news into staging SQLite.")
    parser.add_argument("--scenario-id", required=True)
    parser.add_argument("--news-file", type=Path, required=True)
    parser.add_argument("--db", type=Path, default=DEFAULT_DB)
    args = parser.parse_args()

    import_news(args.scenario_id, args.news_file, args.db)


def draft_news_main() -> None:
    parser = argparse.ArgumentParser(description="Draft scenario news metadata with Anthropic.")
    parser.add_argument("--scenario-id", required=True)
    parser.add_argument("--raw-news-file", type=Path, required=True)
    parser.add_argument("--db", type=Path, default=DEFAULT_DB)
    args = parser.parse_args()

    try:
        draft_news(args.scenario_id, args.raw_news_file, args.db)
    except (RuntimeError, ValueError) as exc:
        print(f"error: {exc}", file=sys.stderr)
        raise SystemExit(1) from exc
