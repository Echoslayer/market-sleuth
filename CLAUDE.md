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
uv run pipeline build-market-snapshot --help
```

## Architecture

The pipeline and frontend share two independent JSON contracts:

- Game scenarios: `pipeline/src/pipeline/scenario.py` (`build_scenario`) produces them; `frontend/src/types/scenario.ts` (`Scenario`) consumes them.
- Daily market snapshots: `pipeline/src/pipeline/market.py` (`build_market_snapshot`) produces them; `frontend/src/types/market.ts` (`MarketSnapshot`) consumes them.

Changing a contract means changing both its producer and consumer. Keep `MarketSnapshot` separate from `Scenario`: games select market data and build their own interaction contract rather than inheriting a growing market schema.

### Data flow

1. `uv run pipeline fetch-prices` — yfinance → `pipeline/staging.db` (SQLite).
2. `uv run pipeline import-raw-news` — curated raw news (no judgments) → `raw_news` table. Rows carry `url` (optional original link) and `source` (`manual`/`agent`/`gdelt`/`crawler`, set via `--source`, default `manual`). Real news is typically collected by a CLI agent (codex/agy) that emits a `raw-news.json` — there is deliberately **no** fetcher abstraction; every source just produces that one file shape.
3. `uv run pipeline score-news` — importance/is_key_event per news item → `news_scores` table. Multiple scoring methods coexist per item (PK includes `method`): `--method manual --scores-file ...`; an LLM draft via `--raw-news-file ...` (in-process Anthropic API, needs `ANTHROPIC_API_KEY`); or — when no key is available — let a CLI agent (codex/agy) score the raw news into a JSON file and import it with `--method <label> --scores-file ...` (label it by the model, e.g. `llm-gpt-5`). Raw news vs. scores are deliberately separate tables so methods never overwrite each other — keep it that way.
4. `uv run pipeline compare-scores --scenario-id <id> --methods a,b` — read-only per-item diff of two scoring methods (importance delta, is_key_event agreement, summary). Used to decide whether an LLM method can replace manual scoring. Comparison logic is a pure function in `scoring.py`; `cli.py` only formats output.
5. `uv run pipeline build-scenario --score-method ...` — merges prices + raw news + the chosen method's scores into `data/<scenario-id>.json` (news items include `url` when present).
6. Copy that JSON into `frontend/public/data/`; the frontend fetches `/data/<id>.json` at runtime (`scenarioDataProvider.ts`). Scenario is selected by `VITE_SCENARIO_ID` env var, defaulting to the checked-in toy fixture.

The separate market path is `uv run pipeline build-market-snapshot`: it combines configured instruments, staged daily prices, and optional news into one daily JSON file. The frontend loads `VITE_MARKET_SNAPSHOT_ID` through `marketDataProvider.ts`, defaulting to the checked-in `toy-market-snapshot`.

### Licensing constraint (important)

Real scenario and market snapshot data is **not redistributable**: `/data/`, `pipeline/scenarios/`, and `frontend/public/data/*` are gitignored — only `toy-chipmaker-rally.json` is allowlisted. Never commit real news content or generated JSON. The deployed GitHub Pages build therefore only ships checked-in toy data.

### Market workspace

`App.tsx` opens the market workspace by default and keeps the game as a separate top-level view without a router. `MarketWorkspace` loads one immutable daily `MarketSnapshot`, owns the selected instrument, and passes snapshot data to the price and news views.

Pure market logic lives in `frontend/src/market/`: `filterPriceSeries` selects chart periods, while `selectMarketNews` applies market/instrument scope, inclusive Taipei date bounds, multi-category matching, and newest-first sorting. Keep these rules out of React components. Market news never contains or derives the game's hindsight-only `isKeyEvent`.

### Frontend game logic

Pure logic lives in `frontend/src/game/` with vitest tests (`round.ts`, `scoreRound.ts`, `revealCutoff.ts`, `swipeDeck.ts`); React components in `src/components/` stay thin. Two modes driven by data, not code: a scenario with `revealCutoffDate` plays in predictive mode (news/prices after the cutoff hidden until submit), without it in detective mode. `scoreRound` always receives the full scenario regardless of what is displayed.

`round.ts` owns the whole round as one `RoundState` plus named transitions (`startRound`, `loadScenario`, `changeSettings`, `chooseDirection`, `chooseNewsMode`, `decideNews`, `undoNews`, `toggleNews`, `submit`, `canSubmit`); `GameRound.tsx` is a shell that calls them and persists `settings` to `localStorage`. It holds both the full `scenario` and the derived `visibleScenario` — reveal precedence (submitted > revealAll > `cutoffOverride` > scenario cutoff) lives in one place. The swipe deck is controlled by this state, so progress and answers survive switching between swipe and list modes. New round behaviour goes here, not into the component.

News input is a Tinder-style swipe deck (`NewsSwipeDeck`, native pointer events, no gesture library) over the pure reducer in `swipeDeck.ts` (right = key event, left = not, undo pops the history stack), with a list mode as fallback; tapping a card opens `NewsDetailDialog` (native `<dialog>`) with the full text and a "閱讀原文" link when the item has a `url`. `RoundState.deck` is the single source of swipe progress and `selectedNewsIds`; the `scoreRound` contract is unchanged. After submit, `NewsList` renders the same items with per-item verdicts.

The ⚙︎ dev settings panel (`SettingsDialog`, `Settings` in `round.ts`) switches scenario (IDs hardcoded in `SCENARIO_IDS`), reveals everything, sets `falsePositiveWeight` for scoring, overrides the cutoff, and toggles a pre-submit debug overlay. It is dev-only and meant to stay deletable in one file plus its `Settings` fields.

### Pipeline module layout

Deep-modules split (see `.scratch/news-scoring-redesign/spec.md`): `cli.py` is wiring only — argparse subcommands calling one function each, no business logic. Shared news row shapes are defined once in `types.py`; schema/DDL lives only in `db.py`. Follow this when extending: new logic goes in the domain module, `cli.py` just gains a subcommand.

## Conventions

- Prefer few deep modules over many shallow files; don't add abstractions ahead of need (spec explicitly removed speculative CSV paths).
- Write-ups go to the private companion repo `market-sleuth-private` (`history/`), **not** the public repo — they may reference non-redistributable material. This covers code review output, `improve-codebase-architecture-zh` architecture reports, and miss-capture notes. All are written primarily in Traditional Chinese and named `YYYY-MM-DD-<topic>.md`. Specs and tickets stay public in `.scratch/`; specs mix Traditional Chinese prose with English identifiers.
- `AGENTS.md` (Codex) and `.agents/AGENTS.md` (Antigravity) only point back to this file plus tool-specific routing — project rules live here, never duplicated there.
- Deploy: push to `main` builds `frontend/` and publishes to GitHub Pages (`.github/workflows/deploy.yml`) at https://echoslayer.github.io/market-sleuth/.
