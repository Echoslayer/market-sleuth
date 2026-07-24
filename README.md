# market-sleuth

A history-replay game about telling real market-moving events apart from noise.

Each level drops you into a real historical price move with only the news that was public at the time. You call a direction and pick the news you think actually caused the move — then the rest of the timeline unlocks so you can see how close you got.

Play it at <https://echoslayer.github.io/market-sleuth/>.

## Status

MVP playable. The game loop works end to end with the first real scenario (TSMC 2330, 2023 AI rally), deployed to GitHub Pages on every push to `main`. Two modes: detective (default) and an opt-in predictive reveal mode.

Specs and ticket breakdowns live under [`.scratch/`](.scratch/) — [`stock-game-mvp/`](.scratch/stock-game-mvp/) for the MVP, [`news-scoring-redesign/`](.scratch/news-scoring-redesign/) for the current pipeline rework.

## Stack

- `frontend/` — React + Vite + TypeScript + Tailwind CSS + lightweight-charts, managed with `bun`
- `pipeline/` — Python data pipeline (yfinance + SQLite staging), managed with `uv`
- `data/` — generated scenario data, gitignored (not redistributable)

## License

MIT — see [LICENSE](LICENSE).
