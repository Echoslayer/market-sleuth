# Dev settings panel

## Problem Statement

market-sleuth is still in developer mode. While iterating on a scenario, the
person running the game needs to change how the current round behaves —
which scenario is loaded, how much is revealed before submit, how harshly
wrong news picks are penalised, and whether the answers are visible for
inspection — without editing code, rebuilding, or juggling env vars. Today
the scenario is locked to a build-time `VITE_SCENARIO_ID`, the reveal
behaviour is fixed by the scenario's own `revealCutoffDate`, and the scoring
knobs are hardcoded constants. There is no runtime way to poke at any of it.

## Solution

A ⚙︎ button in the top-right of the header opens a native `<dialog>`
labelled "Settings (dev)". From it the operator can, at runtime:

- switch which **scenario** is loaded (overrides the env default);
- **reveal everything** before submit (ignore the cutoff);
- set a **manual cutoff date** to preview predictive mode at an arbitrary
  point in time;
- choose a **false-positive penalty weight** to tune how much wrong news
  picks cost;
- turn on a **debug overlay** that shows the correct answer (direction +
  which news items are key events) before submitting.

Settings persist across reloads via `localStorage`, so a chosen scenario or
tuning survives a refresh. All of this is dev-facing scaffolding; the panel
can be hidden wholesale before any player-facing release.

## User Stories

1. As a developer, I want a settings button in the top-right of the page, so that I can reach round settings from anywhere without scrolling.
2. As a developer, I want the settings to open in a modal dialog, so that I can adjust them without losing my place in the round.
3. As a developer, I want to close the settings dialog with the Close button or Escape, so that I can dismiss it quickly (native `<dialog>` behaviour).
4. As a developer, I want to pick the active scenario from a dropdown, so that I can switch scenarios at runtime instead of changing `VITE_SCENARIO_ID` and rebuilding.
5. As a developer, I want the chosen scenario to override the env default, so that my local selection wins over the build-time value.
6. As a developer, I want switching scenarios to reset the round (score, direction, news selection), so that stale picks from the previous scenario never carry over.
7. As a developer, I want a "reveal everything before submit" toggle, so that I can see all news and prices regardless of the cutoff while inspecting a scenario.
8. As a developer, I want a manual cutoff date input, so that I can preview predictive mode as it would look at any point in time.
9. As a developer, I want an empty manual cutoff to fall back to the scenario's own `revealCutoffDate`, so that I only override when I mean to.
10. As a developer, I want reveal-all to win over the manual cutoff, so that the two reveal controls have an unambiguous precedence.
11. As a developer, I want a false-positive penalty weight selector (0, 0.5, 1, 2×), so that I can tune how much wrong news picks cost — including turning the penalty off (0) — without editing code.
12. As a developer, I want the penalty weight to default to 1×, so that the existing scoring behaviour is unchanged unless I deliberately change it.
13. As a developer, I want a debug overlay toggle, so that I can see the correct answers before submitting while checking a scenario.
14. As a developer, I want the debug overlay to show the correct direction badge, so that I can confirm the scenario resolves to the direction I expect.
15. As a developer, I want the debug overlay to mark which news items are key events in list mode, so that I can verify the curated key-event set at a glance.
16. As a developer, I want a hint to switch to list mode when the debug overlay is on in swipe mode, so that I know where the key-event marks appear.
17. As a developer, I want the debug overlay to mark only currently-visible items, so that its behaviour is consistent with the active reveal/cutoff settings (and I can flip reveal-all to inspect hidden ones).
18. As a developer, I want all settings persisted to `localStorage`, so that my scenario choice and tuning survive a page reload.
19. As a developer, I want previously-stored settings to gain sensible defaults for newly-added fields, so that upgrading the panel never breaks a stored blob.
20. As a maintainer, I want the whole panel to be removable before a player-facing release, so that dev scaffolding does not leak into production play.

## Implementation Decisions

- **Single settings blob.** One `Settings` object — `{ scenarioId, revealAll, falsePositiveWeight, cutoffOverride, debug }` — held in `GameRound` state, seeded from `localStorage` merged over defaults (`{ scenarioId: VITE_SCENARIO_ID ?? "toy-chipmaker-rally", revealAll: false, falsePositiveWeight: 1, cutoffOverride: "", debug: false }`), and written back to `localStorage` on every change. Merging over defaults means an older stored blob transparently gains new fields.
- **SettingsDialog component.** A thin native-`<dialog>` component (mirrors `NewsDetailDialog`): props `{ open, settings, onChange, onClose }`. Renders the scenario `<select>`, the reveal-all checkbox, the penalty-weight `<select>`, a `<input type="date">` for the cutoff override, and the debug checkbox. Scenario id list is a hardcoded `SCENARIO_IDS` array (public deploys ship only the toy fixture, so a filesystem scan would 404 in prod anyway).
- **scoreRound gains optional config.** New signature `scoreRound(selection, scenario, config?: { falsePositiveWeight?: number })`. Penalty becomes `sumImportance(falsePositives) * (config?.falsePositiveWeight ?? 1)`, still clamped to `[0, newsScoreMax]`. `newsScoreMax` and `earned` are unchanged. Default `1` preserves current behaviour. This is pure frontend logic in `src/game/` — it does **not** touch the pipeline↔frontend Scenario JSON contract.
- **Cutoff override reuses `visibleBeforeSubmit`.** The displayed scenario is computed as: if `score` or `revealAll` → full scenario; else let `cutoff = cutoffOverride || scenario.revealCutoffDate` and, when set, pass `visibleBeforeSubmit({ ...scenario, revealCutoffDate: cutoff })`. No new filtering logic — the override just substitutes the cutoff date into the existing pure function.
- **Debug overlay is display-only.** When `debug` is on and there is no score yet: `GameRound` computes `deriveCorrectDirection(scenario)` and renders a correct-direction badge near the DirectionPicker; `NewsList` gains an optional `debugKeyEvents` boolean that marks `isKeyEvent` items pre-submit. In swipe mode a one-line hint tells the operator to switch to list mode to see the marks. No scoring path is affected.
- **Scenario switch effect.** The scenario-loading `useEffect` keys on `settings.scenarioId`; on change it clears scenario, score, news selection, deck-complete, and direction before fetching, so no cross-scenario state leaks.
- **`scoreRound` call site** passes `{ falsePositiveWeight: settings.falsePositiveWeight }`; it always scores the full scenario (unchanged), independent of what the reveal/cutoff/debug settings display.

## Testing Decisions

- A good test here exercises **external behaviour of the scoring function**, not React wiring or `localStorage` internals. The single seam is the pure `scoreRound` function, which already has vitest coverage in `scoreRound.test.ts` — prior art for the exact style.
- Add cases to `scoreRound.test.ts` for the new `falsePositiveWeight` config: weight `0` (penalty disabled → false positives cost nothing, score equals earned importance), and weight `2` (penalty doubled → larger deduction, still clamped at `0`). A case confirming the omitted-config default equals `1×` is already covered by the existing tests, which pass no config.
- `visibleBeforeSubmit` is already tested; the cutoff override introduces no new logic (it substitutes a date into that tested function), so it needs no new test.
- The SettingsDialog, the debug overlay marks, and `localStorage` persistence are thin display/glue per project convention (components stay thin, logic lives in `src/game/`) and are not unit-tested.

## Out of Scope

- **Direction threshold tuning** (the ±5% in `deriveCorrectDirection`) — considered and deliberately deselected during grilling.
- **Auto-switching news mode** when the debug overlay is enabled — a hint is shown instead.
- Marking key events in **swipe** mode (only list mode gets debug marks).
- Any **player-facing** settings, difficulty selection, or theming — this panel is dev scaffolding only.
- Enumerating scenarios from the filesystem/manifest — the id list is hardcoded.
- Pipeline changes — everything here is frontend-only; the Scenario JSON schema is untouched.

## Further Notes

- The ⚙︎ button, reveal-all toggle, and scenario switch already exist from an earlier increment; this spec adds the penalty weight, manual cutoff, and debug overlay, plus the persistence/merge behaviour for the expanded blob.
- Reveal-all vs. manual cutoff precedence is fixed: reveal-all always wins.
- Since real scenario data is gitignored for licensing, the hardcoded `SCENARIO_IDS` will only fully resolve locally; on the public GitHub Pages build only `toy-chipmaker-rally` loads and the others 404 — acceptable for a dev-only panel.
- The matt-pocock issue tracker / triage vocabulary is not configured in this repo, so this spec is filed under the project's own `.scratch/<feature>/` convention rather than the issue tracker.
