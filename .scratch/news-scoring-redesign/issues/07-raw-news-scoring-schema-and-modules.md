# 07 — raw_news/news_scores schema、深模組拆分、CLI 子命令

**What to build:** pipeline 內部改用 `raw_news`＋`news_scores` 兩張表取代舊的單一 `news` 表，讓「原始新聞」與「新聞評分」在資料庫層就是兩個獨立的東西，評分可以有多種 method 並存、互不覆蓋。程式碼依深模組原則拆成 `db`／`prices`／`raw_news`／`scoring`／`scenario`／`types` 模組，`cli.py` 只做子命令接線（不含商業邏輯）。用一個小型合成 fixture 場景跑過完整 CLI 流程（匯入原始新聞 → 人工評分 → 匯出）驗證整條路徑正確運作。

**Blocked by:** None — 可立即開始

**Status:** done

- [x] `raw_news(scenario_id, id, date, headline, content)` 與 `news_scores(scenario_id, news_id, method, importance, is_key_event, scored_at)` 兩張表建立完成，舊的 `news` 表移除
- [x] `resolve_news(raw_rows, score_rows) -> list[dict]` 是不碰 SQLite、不呼叫網路的純函式，負責合併 raw 與指定 method 的評分；有 pytest 覆蓋（單一 method 合併、多 method 並存時依 method 過濾、raw 存在但該 method 無評分的處理、score 引用不存在 raw id 的處理）
- [x] `build_scenario`（`scenario.py`）簽名與行為完全不變，既有測試不用修改就能通過
- [x] `parse_llm_score_response`（原 ticket 04 的 `parse_news_draft_response` 搬過來改名）純函式與既有測試案例保留，位置搬到 `scoring.py`
- [x] `cli.py` 只做 argparse 子命令接線，不含商業邏輯；子命令為 `fetch-prices`／`import-raw-news`／`score-news --method <manual|llm-model>`／`build-scenario --score-method <method>`
- [x] 沒人使用的 CSV 匯入路徑（`import_news_csv`／`_csv_bool`）與舊的 `pipeline-import-news`／`pipeline-draft-news` script 名稱移除
- [x] 用一個合成 fixture 場景（非真實 TSMC 資料）實際跑過 `import-raw-news → score-news --method manual → build-scenario --score-method manual`，確認產出的 JSON 符合既有 scenario schema
- [x] `uv run pytest` 全綠

## Comments（續）

Claude Code 驗證與收尾：codex 交付後發現 `_raw_item`／`_required_str` 這組驗證邏輯在 `raw_news.py` 跟 `scoring.py` 各自重複了一份（正是這次重構要解決的 Duplicated Code 味道，只是換了個地方發生）——把 `raw_news.py` 的版本改名成公開的 `parse_raw_news_item`... 實際命名為 `parse_raw_item`，`scoring.py` 改成 import 它，刪掉自己那份重複的。

真的跑過 `uv sync`（裝進真實套件）、`uv run pytest`（12/12 通過）。額外做了兩個 codex 沙盒做不到的驗證：(1) 用真實網路對 2330.TW 跑過 `import-raw-news → score-news --method manual → build-scenario --score-method manual` 全流程，確認輸出 JSON 形狀正確（`isKeyEvent` camelCase、importance 正確）；(2) 故意不設 `ANTHROPIC_API_KEY` 呼叫 `score-news --method llm`，確認會明確報錯（exit code 1）、不會靜默 fallback，符合原 ticket 04 的設計精神。

## Comments

- `score-news` uses one subcommand with a mutually exclusive input source:
  - Manual path: `pipeline score-news --scenario-id <id> --method manual --scores-file <scores.json> --db <db>`.
  - LLM path: `pipeline score-news --scenario-id <id> --method llm --raw-news-file <raw-news.json> --db <db>`. `--method` is kept for a stable command shape, but the stored method is the actual Anthropic model name from `ANTHROPIC_MODEL` or the default model, and the command prints that model after writing scores.
