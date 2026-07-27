# market-sleuth

A Taiwan-market workspace and history-replay game about telling real market-moving events apart from noise.

The default workspace shows a daily market snapshot with watchlist prices, candlestick and volume charts, and market or instrument news filters. The game drops you into a historical price move with only the news that was public at the time: call a direction, pick the news that caused the move, then reveal the rest of the timeline.

Play it at <https://echoslayer.github.io/market-sleuth/>.

## Status

The market workspace and game MVP are playable. The workspace supports a pipeline-managed watchlist, daily candlestick and volume charts, period selection, and news filtering by scope, date, and category. The game judges news with Tinder-style cards (right = key event, left = noise) and supports detective and predictive reveal modes.

Real market snapshots and scenarios are local-only because their source data is not redistributable. The public build ships toy data; two real game scenarios are also playable locally.

Specs and ticket breakdowns live under [`.scratch/`](.scratch/), including [`market-workspace/`](.scratch/market-workspace/), [`stock-game-mvp/`](.scratch/stock-game-mvp/), [`news-scoring-redesign/`](.scratch/news-scoring-redesign/), and [`real-news-rollout/`](.scratch/real-news-rollout/).

## Stack

- `frontend/` — React + Vite + TypeScript + Tailwind CSS + lightweight-charts, managed with `bun`
- `pipeline/` — Python data pipeline (yfinance + SQLite staging), managed with `uv`
- `data/` — generated scenario data, gitignored (not redistributable)

## License

MIT — see [LICENSE](LICENSE).
