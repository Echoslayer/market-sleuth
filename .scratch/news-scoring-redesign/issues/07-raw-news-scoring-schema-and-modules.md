# 07 — raw_news/news_scores schema、深模組拆分、CLI 子命令

**What to build:** pipeline 內部改用 `raw_news`＋`news_scores` 兩張表取代舊的單一 `news` 表，讓「原始新聞」與「新聞評分」在資料庫層就是兩個獨立的東西，評分可以有多種 method 並存、互不覆蓋。程式碼依深模組原則拆成 `db`／`prices`／`raw_news`／`scoring`／`scenario`／`types` 模組，`cli.py` 只做子命令接線（不含商業邏輯）。用一個小型合成 fixture 場景跑過完整 CLI 流程（匯入原始新聞 → 人工評分 → 匯出）驗證整條路徑正確運作。

**Blocked by:** None — 可立即開始

**Status:** ready-for-agent

- [ ] `raw_news(scenario_id, id, date, headline, content)` 與 `news_scores(scenario_id, news_id, method, importance, is_key_event, scored_at)` 兩張表建立完成，舊的 `news` 表移除
- [ ] `resolve_news(raw_rows, score_rows) -> list[dict]` 是不碰 SQLite、不呼叫網路的純函式，負責合併 raw 與指定 method 的評分；有 pytest 覆蓋（單一 method 合併、多 method 並存時依 method 過濾、raw 存在但該 method 無評分的處理、score 引用不存在 raw id 的處理）
- [ ] `build_scenario`（`scenario.py`）簽名與行為完全不變，既有測試不用修改就能通過
- [ ] `parse_llm_score_response`（原 ticket 04 的 `parse_news_draft_response` 搬過來改名）純函式與既有測試案例保留，位置搬到 `scoring.py`
- [ ] `cli.py` 只做 argparse 子命令接線，不含商業邏輯；子命令為 `fetch-prices`／`import-raw-news`／`score-news --method <manual|llm-model>`／`build-scenario --score-method <method>`
- [ ] 沒人使用的 CSV 匯入路徑（`import_news_csv`／`_csv_bool`）與舊的 `pipeline-import-news`／`pipeline-draft-news` script 名稱移除
- [ ] 用一個合成 fixture 場景（非真實 TSMC 資料）實際跑過 `import-raw-news → score-news --method manual → build-scenario --score-method manual`，確認產出的 JSON 符合既有 scenario schema
- [ ] `uv run pytest` 全綠
