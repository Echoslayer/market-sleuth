# Frontend architecture review — 2026-07-24

Ran `/improve-codebase-architecture` scoped to `frontend/src` (pipeline was already deepened in tickets 07–08, so this pass skipped it). Full HTML report with before/after diagrams was generated to a temp file for review; this note is the durable record of what came out of it.

## Candidates surfaced

1. **Give verdict classification one seam** (Strong) — `NewsList`'s `NewsResult` re-derives the hit/miss/false-positive classification from `item.isKeyEvent`/`selected` instead of reading it from `score.breakdown`, which `scoreRound()` already computes. Two places encode the same rule; they only agree because no one has changed it since. **Not yet done.**
2. **Route `GameRound` through the `ScenarioDataProvider` seam** (Worth exploring) — `GameRound` imports the concrete `localJsonScenarioDataProvider` directly instead of taking the provider as a parameter, so the round state machine (`toggleNews`, submit-gating) has no test seam. **Not yet done.**
3. **Collapse ad hoc conditional classNames into a `cn()` module** (Strong) — `DirectionPicker`, `GameRound`'s `DirectionResult`, and `NewsList`'s `NewsResult` each hand-rolled their own `` `base ${cond ? a : b}` `` template-literal join. **Done** (this session): added `clsx` + `tailwind-merge` deps, `frontend/src/lib/cn.ts` exporting `cn(...) = twMerge(clsx(inputs))`, and switched all three call sites to it.

## Why only #3 landed (2026-07-24)

User asked specifically to implement the `tw-cn` (clsx + tailwind-merge) candidate this round. #1 and #2 remained open at that point.

## Follow-up session (2026-07-25)

Grilling session picked the scope: **#1 + #4 + #2's `response.ok` check only**. All green (tsc clean, frontend 11 tests, pipeline 7 tests).

- **#1 done** — `NewsList.NewsResult` now reads the verdict from `score.breakdown` via a `verdictFor()` lookup; the `isKeyEvent === selected` re-derivation is deleted. Noise stays as the complement of the three breakdown sets (breakdown structurally never lists it).
- **#2 partial** — added the `response.ok` guard in `scenarioDataProvider.ts` (was casting a 404 body straight to `Scenario`). **Provider injection + round-state-machine test deferred** — no `GameRound` test exists yet, so the seam waits until the test that needs it does.
- **#4 done** — extended `test_build_scenario_shape_matches_frontend_contract` to build with a cutoff and assert `revealCutoffDate` in the key set (the mirror silently omitted it), plus pointer comments in `scenario.ts` ↔ `test_scenario.py`.
- **#3 (reveal deep module) and #5 (`cn.ts` deletion) untouched** — #3 is locality-only, #5 the report itself said leave alone.
