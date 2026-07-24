Status: ready-for-agent

# Pipeline 新聞資料重新設計：raw_news / news_scores 分離

## Problem Statement

目前 pipeline 把「新聞怎麼取得」跟「新聞有沒有價值（評分）」焊死在一起：不管是人工填寫 `news.json`、還是 LLM 草稿（ticket 04），寫入資料庫的當下就已經是「評分完成」的最終結果，沒有留下「還沒評分的原始新聞」這個中間狀態。這造成：無法拿同一批原始新聞換不同評分方式重跑比較；無法追溯一筆評分是誰（人工／哪個模型）在什麼時候給的；後評分的方法會直接覆蓋先評分的結果（`INSERT OR REPLACE` 到同一張 `news` 表）。Code review（b570525...HEAD）也在 Standards 軸指出兩個相關問題：新聞列的資料形狀（id/date/headline/content/importance/is_key_event）在 `scenario.py`／`staging.py`／`news_draft.py` 三處各自手刻（Duplicated Code）；`pipeline/cli.py` 塞了三個互不相關的 CLI 入口，變更理由各自獨立卻共用一個檔案（Divergent Change）。

## Solution

把「原始新聞」與「新聞評分」拆成資料庫層兩張獨立的表：`raw_news`（只代表新聞存在，不含任何判斷）與 `news_scores`（記錄每一種評分方式對每則新聞給出的 importance／is_key_event，附 provenance：method、評分時間，可多方法並存、互不覆蓋）。匯出 `scenario.json` 時用 `--score-method` 明確指定要用哪一種評分結果當最終答案。程式碼依「深模組」原則（John Ousterhout）拆成職責單一、介面簡單但內部邏輯完整的模組；`cli.py` 只做子命令接線、不含商業邏輯，解決既有的 Divergent Change 與 Duplicated Code。`build_scenario`（前端資料契約的產生者）與前端完全不受影響。

## User Stories

1. As a 維護者, I want 把原始新聞先存進 `raw_news` 表（不含任何評分）, so that 我之後可以用不同方法重複評分，不用重新蒐集新聞。
2. As a 維護者, I want 人工評分寫入 `news_scores` 並標記 `method="manual"`, so that 我的評分結果不會被之後跑的 LLM 評分覆蓋掉。
3. As a 維護者, I want LLM 評分寫入 `news_scores` 並標記實際用的模型名稱（例如 `llm-claude-sonnet-5`）, so that 我知道這筆評分是哪個模型給的，未來要比較不同模型的判斷差異時有資料可查。
4. As a 維護者, I want 同一則新聞可以同時存在多筆不同 method 的評分紀錄, so that 我可以比較「人工判斷」跟「AI判斷」在哪些新聞上不一致。
5. As a 維護者, I want 匯出 scenario.json 時明確指定 `--score-method`, so that 我清楚知道這一關最終用的是哪一種評分結果，不會被意外覆蓋或搞混。
6. As a 維護者, I want `raw_news`／`news_scores` 的合併邏輯是一個不碰資料庫的純函式, so that 我能用固定的 fixture 測試合併規則是否正確，不用每次都重新讀資料庫。
7. As a 開發者, I want pipeline 的程式碼依職責拆成 `db.py`／`prices.py`／`raw_news.py`／`scoring.py`／`scenario.py`／`types.py`／`cli.py`, so that 修改某一種評分方式的邏輯不會意外牽動到不相關的 CLI 入口或抓價格的邏輯。
8. As a 開發者, I want 新聞列的資料形狀只在 `types.py` 定義一次, so that 新增或修改欄位時只要改一個地方，不用同步改三個檔案。
9. As a 維護者, I want `cli.py` 只做子命令接線、不含商業邏輯, so that CLI 介面本身的變動不會跟評分邏輯的變動糾纏在同一次修改裡。
10. As a 維護者, I want 沒人使用的 CSV 匯入路徑被移除, so that 程式碼庫裡不會留著為了不存在的需求預先寫的程式碼。
11. As a 維護者, I want 既有 ticket 05 的真實 TSMC 新聞內容（目前手寫成單一 `news.json`）被拆成 raw + manual scores 兩份檔案並重新匯入, so that 既有的第一關資料在新架構下依然能正常匯出、遊戲依然能玩，且內容跟現況一致。
12. As a 維護者, I want 這次重新設計不影響 `build_scenario`（前端資料契約）與前端 `scoreRound`／`ScenarioDataProvider`, so that frontend 完全不用因為這次 pipeline 內部重構而改動。

## Implementation Decisions

**資料庫 schema**
- `raw_news(scenario_id, id, date, headline, content)` — PK `(scenario_id, id)`。
- `news_scores(scenario_id, news_id, method, importance, is_key_event, scored_at)` — PK `(scenario_id, news_id, method)`，`importance` 限制 1–5，`is_key_event` 限制 0/1。同一則新聞可有多筆不同 method 的紀錄。
- 舊的單一 `news` 表移除，由上述兩張表取代。

**模組拆分（深模組原則：介面簡單、內部邏輯完整；只在「這個檔案存在的理由」改變時才新增檔案）**
- `db.py`：`connect(db_path)`，內含 schema 定義與建表，供其他模組共用。
- `prices.py`：`fetch_prices_to_sqlite(...)`、`read_price_rows(...)`（從既有 `staging.py` 搬過來，邏輯不變）。
- `raw_news.py`：`import_raw_news(scenario_id, items, db_path)`、`read_raw_news(scenario_id, db_path)`。
- `scoring.py`：`write_scores(scenario_id, method, scored_items, db_path)`（manual 與 llm 共用同一個寫入函式）、`draft_scores_with_llm(scenario_id, raw_items, db_path)`（呼叫 Anthropic API，內部呼叫 `write_scores`）、`parse_llm_score_response(text) -> list[...]`（純函式，沿用 ticket 04 既有邏輯搬過來）、`read_scores(scenario_id, method, db_path)`、`resolve_news(raw_rows, score_rows) -> list[dict]`（新的純函式測試接縫，見 Testing Decisions）。
- `scenario.py`：`build_scenario(...)` 完全不變。
- `types.py`：共用的新聞列型別（原始新聞、已評分新聞的形狀），供 `raw_news.py`／`scoring.py`／`scenario.py` 共用，型別用 TypedDict 或 dataclass（實作時擇一）。
- `cli.py`：單一檔案，argparse 子命令：`fetch-prices`、`import-raw-news`、`score-news`（`--method manual --scores-file ...` 或 `--method <llm-model> --raw-news-file ...` 呼叫 LLM）、`build-scenario`（新增 `--score-method` 參數）。只做參數解析與呼叫對應模組函式，不含商業邏輯。

**移除**：舊的 `news` 表、`import_news_csv`／`_csv_bool`／CSV 分支、舊的 `pipeline-import-news`／`pipeline-draft-news` 這兩個 script 名稱（被新的子命令取代）。

**既有 ticket 05 內容遷移**：`pipeline/scenarios/tsmc-2023-ai-rally/news.json`（17 則，已含 importance/is_key_event）拆成兩份：`raw-news.json`（date/headline/content only）與 `manual-scores.json`（news_id/importance/is_key_event）。重新跑過 `import-raw-news` → `score-news --method manual` → `build-scenario --score-method manual`，確認產出的 `data/tsmc-2023-ai-rally.json` 與現有版本內容一致（新聞內容、重要度、isKeyEvent、timelineSummary 皆不變）。

**前端不受影響**：`Scenario` TS type、`scoreRound`、`ScenarioDataProvider` 皆不需要改動，因為 `build_scenario` 輸出的 JSON schema 不變。

## Testing Decisions

- 好的測試只驗證外部行為（輸入輸出），不驗證實作細節；延續 ticket 03/04 建立的「DB/網路 touching 的函式不測，純轉換函式才測」原則。
- **新的測試接縫**：`resolve_news(raw_rows, score_rows) -> list[dict]`。Fixture 涵蓋：單一 method 正常合併；多個 method 並存時依指定 method 正確過濾；`raw_news` 存在但該 method 沒有評分紀錄的項目應如何處理（實作時決定一致行為並寫測試涵蓋，例如排除或報錯）；`score_rows` 引用不存在的 raw news id 時的行為。
- `parse_llm_score_response`：沿用既有 ticket 04 的測試案例（合法格式、importance 超出 1–5、is_key_event 非布林），搬到 `scoring.py` 底下對應調整檔案位置。
- `build_scenario`：既有測試不變，不需修改（輸入介面沒變）。
- 不測試：`db.py`、`prices.py`、`raw_news.py`／`scoring.py` 中實際碰 SQLite 或呼叫網路/LLM API 的函式。
- Prior art：延續 ticket 03/04 的 pytest 慣例（fixture 資料 + 純函式），測試框架不變（pytest）。

## Out of Scope

- 模糊資訊（NLP 模糊年份／公司名稱）功能 — 使用者明確表示晚一點做，這次只確保架構不擋路。
- 新聞蒐集的廣度／深度與分類系統 — 晚一點做。
- 使用者可搜尋真實資料 + NLP 模糊處理的功能 — 晚一點做。
- Labeling API／GUI（供人工標注用的網頁介面與後端）— 使用者明確表示晚一點做，這次先把 `raw_news`／`news_scores` 的資料模型做穩，之後才疊 API/GUI。
- 前端「新聞互動邏輯」的改版（使用者提到有初步構想但尚未講清楚）— 不在這次重新設計範圍內，之後另外討論。
- rule-based（規則式）評分方法的實際實作 — schema 設計上支援任意 method 字串，但這次只需要 manual 跟 llm 兩種方法真的被實作。

## Further Notes

- 這次重新設計是對 ticket 03/04/05 既有實作的重構，不是全新功能；定案後建議拆成 1～2 張 ticket（比照先前 01～06 的模式）執行，例如「07 — raw_news/news_scores schema 與模組拆分」「08 — 遷移既有 TSMC 內容到新架構」，兩者是否合併成一張視實作時判斷。
- 「深模組」（deep module）原則出自 John Ousterhout《A Philosophy of Software Design》：介面越簡單、內部藏的實質邏輯越多，模組品質越好。這次 `cli.py` 保持單一檔案但只做接線、`scoring.py` 把 manual 與 llm 共用的寫入邏輯合併在同一個模組，都是依此原則做的取捨；日後新增模組時應延續同一標準檢視，預設不是「拆越細越好」。
- 這次重新設計直接回應 code review（b570525...HEAD diff）Standards 軸的兩個發現：Duplicated Code（新聞列形狀三處手刻）與 Divergent Change（`cli.py` 塞三個入口）。修正後下次 review 這兩點應該會消失。
