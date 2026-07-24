# 03 — Pipeline 骨架：股價抓取 + SQLite 暫存 + JSON 匯出

**What to build:** 給定股票代號與日期區間，pipeline 可用 yfinance 抓歷史股價存進 SQLite；新聞用手動填寫的格式（CSV 或 JSON）匯入 SQLite 並與股價資料關聯；`build_scenario` 函式把 SQLite 中已整理好的資料匯出成符合 01 資料契約的 `scenario.json`，寫入 `/data`。

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] 給定 ticker + 日期區間，可用 yfinance 抓到 OHLCV 資料並寫入 SQLite 暫存表
- [ ] 有一個手動填寫新聞的固定格式（CSV 或 JSON），可匯入 SQLite 並與對應股價期間關聯
- [ ] `build_scenario(...)` 為不觸發網路呼叫的純函式，輸入已經在 SQLite/記憶體中的資料，輸出符合 01 schema 的 scenario 物件
- [ ] `build_scenario` 有 pytest 測試，使用固定 fixture 輸入（不呼叫 yfinance、不呼叫 LLM），驗證輸出欄位齊全、型別正確、`isKeyEvent` 與 `importance` 一致
- [ ] 執行 pipeline 後，`/data` 底下產生一份可被 02 的前端讀取的 `scenario.json`
