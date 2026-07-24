# 01 — 專案骨架與資料契約

**What to build:** 建立 `/frontend`（bun + vite + react + typescript + tailwind，`bun run dev` 可跑出空白頁）、`/pipeline`（`uv` 初始化，`uv run` 可執行一支空腳本）、`/data`（已加入 `.gitignore`）三個資料夾。定義 scenario JSON 的資料契約（TS type，並文件化欄位說明），並在 repo 中放一份手寫的小型 fixture scenario（假資料，2～3 則新聞即可，供後續票證的測試與開發使用，可進 git，與 `/data` 底下的真實資料分開存放）。

**Blocked by:** None — 可立即開始

**Status:** ready-for-agent

- [ ] `frontend/` 可用 `bun install && bun run dev` 啟動，畫面顯示任意佔位內容
- [ ] `pipeline/` 可用 `uv run <script>` 執行一支印出訊息的空腳本
- [ ] `data/` 存在且被 `.gitignore` 排除
- [ ] Scenario JSON 的 TypeScript type 定義完成，欄位涵蓋：`id`、`stockTicker`、`stockName`、`dateRange`、`priceSeries`（OHLCV）、`newsItems`（含 `date`/`headline`/`content`/`importance`/`isKeyEvent`）、`timelineSummary`
- [ ] 一份符合上述 schema 的手寫 fixture scenario 檔案存在於 repo 中（非 `/data`），內容為假資料
