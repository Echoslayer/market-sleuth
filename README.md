# market-sleuth

A history-replay game about telling real market-moving events apart from noise.

Each level drops you into a real historical price move with only the news that was public at the time. You call a direction and pick the news you think actually caused the move — then the rest of the timeline unlocks so you can see how close you got.

Play it at <https://echoslayer.github.io/market-sleuth/>.

## Status

MVP playable. The game loop works end to end, with news judged by swiping cards Tinder-style (right = key event, left = noise) and a native-dialog detail view. Two real scenarios are built and playable locally — TSMC 2330 (2023 AI rally) and Netflix (2022 Q1 subscriber shock) — but their news is not redistributable, so the GitHub Pages build (deployed on every push to `main`) ships only the toy fixture. Two modes: detective (default) and an opt-in predictive reveal mode.

Specs and ticket breakdowns live under [`.scratch/`](.scratch/) — [`stock-game-mvp/`](.scratch/stock-game-mvp/) for the MVP, [`news-scoring-redesign/`](.scratch/news-scoring-redesign/) for the pipeline rework, [`real-news-rollout/`](.scratch/real-news-rollout/) for real-news collection, scoring comparison, and the swipe UI.

## Stack

- `frontend/` — React + Vite + TypeScript + Tailwind CSS + lightweight-charts, managed with `bun`
- `pipeline/` — Python data pipeline (yfinance + SQLite staging), managed with `uv`
- `data/` — generated scenario data, gitignored (not redistributable)

## License

MIT — see [LICENSE](LICENSE).
