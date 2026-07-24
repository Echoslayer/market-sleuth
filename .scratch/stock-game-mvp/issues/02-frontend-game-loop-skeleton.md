# 02 — 前端遊戲迴圈 walking skeleton

**What to build:** 玩家打開瀏覽器，用 01 的 fixture scenario 完整玩一輪遊戲：看到揭露前的 K 線圖 → 選方向（買進/觀望/放空）→ 從新聞列表勾選認為關鍵的新聞 → 提交 → 看到分數、完整走勢揭露、每則新聞的重要度星等、時間軸摘要。遊戲邏輯與 UI 元件分離，`ScenarioDataProvider` 介面的 MVP 實作為讀取本地 JSON。

**Blocked by:** 01

**Status:** done

- [x] 開啟遊戲後，看到 fixture scenario 揭露前區間的 K 線圖（lightweight-charts），看不到揭露後的走勢
- [x] 可選擇買進／觀望／放空其中一項
- [x] 可從新聞列表複選新聞
- [x] 提交後畫面顯示：完整走勢延伸、每則新聞的策展重要度星等、時間軸摘要文字
- [x] `scoreRound(selection, scenario)` 為不依賴 React/DOM 的純函式，並有 Vitest 測試涵蓋：方向全對、方向全錯、新聞全選對、部分選對、選到低重要度新聞扣分等案例
- [x] `ScenarioDataProvider` 定義為介面，MVP 實作讀取本地 JSON 檔案（`fetch('/data/<id>.json')`，served from `frontend/public/data/`）
- [x] `bun run dev -- --host` 啟動後，同區網內的手機瀏覽器可連線並完整玩過一輪（驗證 dev server 對外提供 index 與 `/data/*.json`）

## Comments

實作由 `codex exec`（workspace-write sandbox）完成骨架，但 sandbox 無法連網，`bun add lightweight-charts`/`vitest` 失敗，程式碼含一個「動態 import + canvas fallback」的防禦性寫法。Claude Code 驗證時：實際 `bun install` 成功裝進真實套件後，把 `PriceChart.tsx` 簡化成直接 static import `lightweight-charts`（拿掉不會發生的 fallback 分支）；並把 `ScenarioDataProvider` 從同步回傳記憶體中的 fixture 改成非同步 `fetch` 本地 JSON 檔（`frontend/public/data/toy-chipmaker-rally.json`），符合 ticket 原本「讀取本地 JSON 檔案」的驗收條件，也讓 ticket 05 之後接真實資料時介面不用再改。`bun run build`、`bun run test`（8/8 通過）、dev server + curl 都驗證過。
