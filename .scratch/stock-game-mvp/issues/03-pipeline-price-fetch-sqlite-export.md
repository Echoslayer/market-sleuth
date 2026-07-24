# 03 — Pipeline 骨架：股價抓取 + SQLite 暫存 + JSON 匯出

**What to build:** 給定股票代號與日期區間，pipeline 可用 yfinance 抓歷史股價存進 SQLite；新聞用手動填寫的格式（CSV 或 JSON）匯入 SQLite 並與股價資料關聯；`build_scenario` 函式把 SQLite 中已整理好的資料匯出成符合 01 資料契約的 `scenario.json`，寫入 `/data`。

**Blocked by:** 01

**Status:** done

- [x] 給定 ticker + 日期區間，可用 yfinance 抓到 OHLCV 資料並寫入 SQLite 暫存表
- [x] 有一個手動填寫新聞的固定格式（CSV 或 JSON），可匯入 SQLite 並與對應股價期間關聯
- [x] `build_scenario(...)` 為不觸發網路呼叫的純函式，輸入已經在 SQLite/記憶體中的資料，輸出符合 01 schema 的 scenario 物件
- [x] `build_scenario` 有 pytest 測試，使用固定 fixture 輸入（不呼叫 yfinance、不呼叫 LLM），驗證輸出欄位齊全、型別正確、`isKeyEvent` 與 `importance` 一致
- [x] 執行 pipeline 後，`/data` 底下產生一份可被 02 的前端讀取的 `scenario.json`

## Comments

第一次交給 `agy` 執行，卡在 0% CPU 14 分鐘沒有任何檔案變化，判定為 hang，已 kill 改用 `codex exec` 重跑，這次順利完成。Claude Code 驗證時發現 `build_scenario` 沒有接收 `timelineSummary` 的管道（永遠輸出 `[]`），補上 `timeline_summary` 參數與 CLI 的 `--timeline-summary-file` 選項，並補兩個對應的 pytest 案例。真正跑過 `uv sync`（裝進 yfinance/pytest 等真實套件）、`uv run pytest`（5/5 通過）、以及端到端 smoke test：實際用 `pipeline-import-news` + `pipeline-build-scenario` 對 2330.TW 抓了 2023/04/06～2023/07/28 的真實股價（79 筆交易日，收盤從 530 到 567，約 +7%），確認整條 pipeline 真的能吐出前端能讀的 JSON，smoke test 產生的檔案已清除。
