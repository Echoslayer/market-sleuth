# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

market-sleuth: a history-replay game — the player sees a real historical price move plus the news that was public at the time, calls a direction, and picks which news actually caused the move. Specs and ticket breakdowns live in `.scratch/<feature>/` (`spec.md` + `issues/`); tickets are executed in order and marked done in commits.

## Commands

Frontend (`frontend/`, bun):

```sh
bun install
bun run dev              # Vite dev server
bun run build            # tsc -b && vite build
bun run test             # vitest run (all)
bunx vitest run src/game/scoreRound.test.ts   # single test file
```

Pipeline (`pipeline/`, uv):

```sh
uv run pytest                          # all tests
uv run pytest tests/test_scoring.py    # single test file
uv run pipeline <subcommand>           # CLI, see below
```

## Architecture

Two independent halves joined by one contract: the scenario JSON schema. `pipeline/src/pipeline/scenario.py` (`build_scenario`) produces it; `frontend/src/types/scenario.ts` (`Scenario`) consumes it. Changing either side means changing both.

### Data flow

1. `uv run pipeline fetch-prices` — yfinance → `pipeline/staging.db` (SQLite).
2. `uv run pipeline import-raw-news` — curated raw news (no judgments) → `raw_news` table.
3. `uv run pipeline score-news` — importance/is_key_event per news item → `news_scores` table. Multiple scoring methods coexist per item (PK includes `method`): `--method manual --scores-file ...`, or an LLM draft via `--raw-news-file ...` (Anthropic API, method recorded as the model name). Raw news vs. scores are deliberately separate tables so methods never overwrite each other — keep it that way.
4. `uv run pipeline build-scenario --score-method ...` — merges prices + raw news + the chosen method's scores into `data/<scenario-id>.json`.
5. Copy that JSON into `frontend/public/data/`; the frontend fetches `/data/<id>.json` at runtime (`scenarioDataProvider.ts`). Scenario is selected by `VITE_SCENARIO_ID` env var, defaulting to the checked-in toy fixture.

### Licensing constraint (important)

Real scenario data is **not redistributable**: `/data/`, `pipeline/scenarios/`, and `frontend/public/data/*` are gitignored — only `toy-chipmaker-rally.json` is allowlisted. Never commit real news content or generated scenario JSON. The deployed GitHub Pages build therefore only ships the toy fixture.

### Frontend game logic

Pure logic lives in `frontend/src/game/` with vitest tests (`scoreRound.ts`, `revealCutoff.ts`); React components in `src/components/` stay thin. Two modes driven by data, not code: a scenario with `revealCutoffDate` plays in predictive mode (news/prices after the cutoff hidden until submit), without it in detective mode. `scoreRound` always receives the full scenario regardless of what is displayed.

### Pipeline module layout

Deep-modules split (see `.scratch/news-scoring-redesign/spec.md`): `cli.py` is wiring only — argparse subcommands calling one function each, no business logic. Shared news row shapes are defined once in `types.py`; schema/DDL lives only in `db.py`. Follow this when extending: new logic goes in the domain module, `cli.py` just gains a subcommand.

## Conventions

- Prefer few deep modules over many shallow files; don't add abstractions ahead of need (spec explicitly removed speculative CSV paths).
- Architecture/code review write-ups are written primarily in Traditional Chinese, named `YYYY-MM-DD-<topic>.md`, and saved to the private companion repo `market-sleuth-private` (`history/`), **not** the public repo — they may reference non-redistributable material. Specs and tickets stay public in `.scratch/`. Specs mix Traditional Chinese prose with English identifiers.
- Deploy: push to `main` builds `frontend/` and publishes to GitHub Pages (`.github/workflows/deploy.yml`) at https://echoslayer.github.io/market-sleuth/.
