from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

from pipeline.prices import fetch_prices_to_sqlite
from pipeline.raw_news import import_raw_news
from pipeline.scenario import build_scenario_file
from pipeline.scoring import compare_scores, draft_scores_with_llm, read_scores, write_scores
from pipeline.types import ScoreComparison


DEFAULT_DB = Path(__file__).resolve().parents[2] / "staging.db"
DEFAULT_DATA_DIR = Path(__file__).resolve().parents[3] / "data"


def main() -> None:
    parser = argparse.ArgumentParser(description="Market Sleuth pipeline tools.")
    subparsers = parser.add_subparsers(dest="command", required=True)

    fetch = subparsers.add_parser("fetch-prices", help="Fetch ticker prices into SQLite.")
    fetch.add_argument("--ticker", required=True)
    fetch.add_argument("--start", required=True)
    fetch.add_argument("--end", required=True)
    fetch.add_argument("--db", type=Path, default=DEFAULT_DB)
    fetch.set_defaults(func=_fetch_prices)

    raw = subparsers.add_parser("import-raw-news", help="Import raw scenario news into SQLite.")
    raw.add_argument("--scenario-id", required=True)
    raw.add_argument("--raw-news-file", type=Path, required=True)
    raw.add_argument("--source", default="manual")
    raw.add_argument("--db", type=Path, default=DEFAULT_DB)
    raw.set_defaults(func=_import_raw_news)

    score = subparsers.add_parser("score-news", help="Write manual scores or draft LLM scores.")
    score.add_argument("--scenario-id", required=True)
    score.add_argument("--method", required=True)
    score.add_argument("--db", type=Path, default=DEFAULT_DB)
    source = score.add_mutually_exclusive_group(required=True)
    source.add_argument("--scores-file", type=Path)
    source.add_argument("--raw-news-file", type=Path)
    score.set_defaults(func=_score_news)

    compare = subparsers.add_parser("compare-scores", help="Compare two scoring methods.")
    compare.add_argument("--scenario-id", required=True)
    compare.add_argument("--methods", required=True)
    compare.add_argument("--db", type=Path, default=DEFAULT_DB)
    compare.set_defaults(func=_compare_scores)

    build = subparsers.add_parser("build-scenario", help="Build a scenario JSON file.")
    build.add_argument("--scenario-id", required=True)
    build.add_argument("--ticker", required=True)
    build.add_argument("--stock-name", required=True)
    build.add_argument("--start", required=True)
    build.add_argument("--end", required=True)
    build.add_argument("--db", type=Path, default=DEFAULT_DB)
    build.add_argument("--out-dir", type=Path, default=DEFAULT_DATA_DIR)
    build.add_argument("--timeline-summary-file", type=Path, default=None)
    build.add_argument("--score-method", required=True)
    build.add_argument("--reveal-cutoff-date", default=None)
    build.set_defaults(func=_build_scenario_file)

    args = parser.parse_args()
    try:
        args.func(args)
    except (RuntimeError, ValueError) as exc:
        print(f"error: {exc}", file=sys.stderr)
        raise SystemExit(1) from exc


def _fetch_prices(args: argparse.Namespace) -> None:
    fetch_prices_to_sqlite(args.ticker, args.start, args.end, args.db)


def _import_raw_news(args: argparse.Namespace) -> None:
    import_raw_news(args.scenario_id, _read_json_list(args.raw_news_file), args.db, source=args.source)


def _score_news(args: argparse.Namespace) -> None:
    if args.scores_file:
        write_scores(args.scenario_id, args.method, _read_json_list(args.scores_file), args.db)
        return
    model = draft_scores_with_llm(args.scenario_id, _read_json_list(args.raw_news_file), args.db)
    print(model)


def _compare_scores(args: argparse.Namespace) -> None:
    methods = _parse_two_methods(args.methods)
    comparison = compare_scores(
        read_scores(args.scenario_id, methods[0], args.db),
        read_scores(args.scenario_id, methods[1], args.db),
    )
    _print_score_comparison(methods[0], methods[1], comparison)


def _build_scenario_file(args: argparse.Namespace) -> None:
    out_path = build_scenario_file(
        scenario_id=args.scenario_id,
        ticker=args.ticker,
        stock_name=args.stock_name,
        start=args.start,
        end=args.end,
        db_path=args.db,
        out_dir=args.out_dir,
        score_method=args.score_method,
        timeline_summary=_read_json_list(args.timeline_summary_file) if args.timeline_summary_file else [],
        reveal_cutoff_date=args.reveal_cutoff_date,
    )
    print(out_path)


def _read_json_list(path: Path) -> list[dict[str, Any]] | list[str]:
    data = json.loads(path.read_text())
    if not isinstance(data, list):
        raise ValueError(f"{path} must contain a JSON list")
    return data


def _parse_two_methods(value: str) -> tuple[str, str]:
    methods = tuple(method.strip() for method in value.split(","))
    if len(methods) != 2 or not all(methods):
        raise ValueError("--methods must contain exactly two comma-separated method names")
    return methods


def _print_score_comparison(method_a: str, method_b: str, comparison: ScoreComparison) -> None:
    news_id_width = max([len("news_id"), *(len(row["news_id"]) for row in comparison["rows"])])
    print(f"Comparing {method_a} vs {method_b}")
    print(
        f"{'news_id':<{news_id_width}} "
        f"{'imp_a':>5} "
        f"{'imp_b':>5} "
        f"{'diff':>5} "
        f"{'key_a':>5} "
        f"{'key_b':>5} "
        f"{'agree':>5}"
    )
    for row in comparison["rows"]:
        print(
            f"{row['news_id']:<{news_id_width}} "
            f"{row['importance_a']:>5} "
            f"{row['importance_b']:>5} "
            f"{row['importance_diff']:>5} "
            f"{str(row['is_key_event_a']):>5} "
            f"{str(row['is_key_event_b']):>5} "
            f"{str(row['key_event_agree']):>5}"
        )

    summary = comparison["summary"]
    print()
    print(f"Compared: {summary['compared_count']}")
    print(f"Mean absolute importance diff: {summary['mean_abs_importance_diff']:.2f}")
    print(f"Key event disagreements: {summary['key_event_disagreement_count']}")
    print(f"Key event disagreement news_ids: {', '.join(summary['key_event_disagreement_news_ids']) or '(none)'}")
    print(f"Only in {method_a}: {summary['only_in_a']}")
    print(f"Only in {method_b}: {summary['only_in_b']}")
