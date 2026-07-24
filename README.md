# market-sleuth

A history-replay game about telling real market-moving events apart from noise.

Each level drops you into a real historical price move with only the news that was public at the time. You call a direction and pick the news you think actually caused the move — then the rest of the timeline unlocks so you can see how close you got.

## Status

Early planning. See [`.scratch/stock-game-mvp/spec.md`](.scratch/stock-game-mvp/spec.md) for the MVP spec and [`.scratch/stock-game-mvp/issues/`](.scratch/stock-game-mvp/issues/) for the ticket breakdown.

## Stack

- `frontend/` — React + Vite + TypeScript + Tailwind CSS + lightweight-charts, managed with `bun`
- `pipeline/` — Python data pipeline (yfinance + SQLite staging), managed with `uv`
- `data/` — generated scenario data, gitignored (not redistributable)

## License

MIT — see [LICENSE](LICENSE).
