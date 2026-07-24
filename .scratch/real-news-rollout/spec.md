Status: ready-for-agent

# Real News Rollout：從 toy demo 走向真實新聞 + 互動改造

## Problem Statement

目前 market-sleuth 只有一關真實資料（TSMC 2023），其餘皆為 toy fixture；而且評分只有人工一種、還沒驗證過 LLM 能不能取代人工評分。維護者想把專案往「真實世界新聞驅動」推進，但有幾個尚未兌現或未實作的環節：(1) news-scoring-redesign 特地設計了多 method 並存（manual / LLM），卻從來沒有工具去比較兩者差在哪，這個設計的價值還沒被驗證；(2) 真實新聞的蒐集目前純靠人工，想改成多來源（agent 搜尋、GDELT、headless 爬蟲）綜合取得，但不希望為此預先蓋一層抽象；(3) 前端目前用列表勾選判斷關鍵新聞，維護者想改成 Tinder 式左右滑卡 + 點開看全文/原文連結；(4) 爬蟲取得的資料屬私有，公私邊界與備份策略要先講清楚，免得私有內容誤入公開 repo。

## Solution

分五個近期工作項 + 兩個候補來源，依序推進：

1. **評分比較**：先用 codex/agy 的 yolo 模式對既有 17 則 TSMC 新聞跑一次 LLM（claude-sonnet-5）評分寫入 `news_scores`，再加一個極簡 `compare-scores` CLI 子命令印出逐則對照表，最後人工寫一份繁中分析報告（放 private repo）判斷「LLM 評分能否取代人工」——這個結論決定後續爬來的新聞要不要人工複核。
2. **公私邊界與備份**：建 private repo `market-sleuth-private`，把 `.scratch/history/`（review 報告）搬過去、主 repo 移除該目錄並更新 CLAUDE.md 引用；未來爬蟲/含原文的資料文件直接生在 private repo。資料檔（`pipeline/scenarios/`、`data/`）維持手動雲端備份，不做工程。GitHub Pages 維持現狀（只上 toy fixture）。
3. **來源區分 schema**：`raw_news` 加 `url`（可空）與 `source`（manual/agent/gdelt/crawler）兩欄；「能不能公開散布」不進 db，而是由 `build-scenario --public` 匯出時剝掉 `content`、只留 headline/date/url。前端 `Scenario` type 同步加可選 `url`（契約兩邊一起改）。
4. **Agent 蒐集第二關**：優先叫 agy（yolo 模式）搜尋某 ticker 某歷史時段的真實新聞、驗證 URL 存在，產出符合 raw-news.json 形狀的檔案，走既有 `import-raw-news` 匯入——零 pipeline 程式碼。
5. **前端滑卡 + 彈窗**：把「新聞互動」重做成卡片堆疊，左右滑判定關鍵/非關鍵（右滑=關鍵）、可撤回、點卡片開原生 `<dialog>` 看全文與「閱讀原文」外連；桌面端同時給 ✓/✗ 按鈕。

候補來源（backlog）：GDELT fetcher、dresspage headless 爬蟲，等 agent 蒐集品質/量不足時再上。

## 核心設計原則（貫穿所有 issue）

- **不建 fetcher 抽象層**：多來源的共同介面就是「產出符合 raw-news.json 形狀的一份檔案」，殊途同歸進 `import-raw-news`。三個來源＝三個獨立的產 JSON 的東西，哪天真的有共用邏輯再抽，現在抽是替不存在的需求寫程式。
- **私有性是發布通路的政策，不是新聞的屬性**：同一則新聞本機玩用全文、公開版用連結，資料只有一份，剝不剝在匯出點決定（`--public`），db 保持乾淨。
- **擴充性靠「可選欄位驅動模式」慣例，不預先佔 schema 位**：延續 `revealCutoffDate`（有就 predictive、沒有就 detective）的先例。未來題型（如濃縮漲跌原因選項）要做時再加可選欄位，現在不寫、不佔位——沒有實作驗證的 schema 必然是錯的。
- **資料模糊性是出題品質問題，不是程式問題**：挑因果清楚的事件，寫進未來出題指南，不寫程式。

## Implementation Decisions

- **評分執行方式**：不由 Claude 直接呼叫 Anthropic API，改用 codex 或 agy 的 yolo（`-p` 類似）模式跑 LLM 評分，寫入既有 `news_scores` 表、method 記為模型名稱（如 `llm-claude-sonnet-5`）。
- **`compare-scores` 是唯讀查詢**：讀 `news_scores` 兩個 method，逐則對照 importance 差距與 is_key_event 是否一致，結尾給彙總（平均差距、不一致則數）。不做統計花招（17 則沒有統計意義，重點是逐則看分歧）。純轉換部分抽成可測純函式。
- **schema 擴充**：`raw_news(scenario_id, id, date, headline, content, url, source)`；`source NOT NULL`，`url` 可空。`build-scenario` 加 `--public`：帶了就把 content 置空只留連結。前端 `Scenario` 的新聞項加可選 `url`；content 可為空字串時 UI 顯示「請點連結閱讀原文」。
- **前端互動**：手勢用原生 pointer events + CSS transform，不裝滑卡套件；撤回＝history stack pop；過閾值飛出、未過彈回，不追求物理擬真。底層答案集合不變（哪些新聞被標為關鍵＝`is_key_event`），只換輸入方式，計分 `scoreRound` 不受影響。
- **公私邊界**：不改寫 git 歷史（`.scratch/` 已公開且無害，改寫成本高、買不到真隱私）；只做「從今以後」的區隔——`history/` 搬走、未來私有文件生在 private repo。

## Testing Decisions

- 延續專案慣例：碰 DB/網路/LLM 的函式不測，純轉換函式才測（pytest fixture + 純函式）。
- `compare-scores` 的對照計算抽成純函式測試（給兩組 score rows，驗證差距與不一致標記正確）。
- schema 擴充後 `resolve_news` / `build_scenario` 既有測試需涵蓋新欄位（url/source 有值與缺值）。
- 前端滑卡：判定邏輯（過閾值方向、撤回還原）抽成可測純函式，vitest 覆蓋；手勢動畫本身不測。

## Out of Scope

- 濃縮漲跌原因選項題型（Q9：不做、不佔 schema 位）。
- 改寫 git 歷史以移除已公開的 `.scratch/`。
- GitHub Pages 上架真實關卡（初版完成、且授權方案確定前不做）。
- 評分比較跑多個模型三方對照（先單 sonnet）。
- 資料檔的自動化備份工程（維護者手動雲端備份）。
