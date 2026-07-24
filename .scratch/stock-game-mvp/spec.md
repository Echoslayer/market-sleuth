Status: ready-for-agent

# 股票事件歸因推理遊戲 — MVP

## Problem Statement

玩家（投資學習者）在回顧歷史股價走勢時，很難分辨「這波漲跌真正的原因」是什麼。市場上多數金融資訊工具不是只做情緒分析、就是事後諸葛式地解讀漲跌，沒有工具能讓人在「不知道結果」的情況下練習判斷哪些消息才是真正推動股價的關鍵事件。這導致投資人容易陷入後見之明，把新聞雜訊誤認為因果。

## Solution

建立一個以真實歷史股價與新聞為素材的推理型遊戲。玩家被放回一個完全還原的歷史時間點，只看到當時已公開的股價走勢與一批（重要度不一、真假摻雜）新聞，需要做兩個判斷：

1. 這段期間的股價方向（買進／觀望／放空）
2. 從新聞列表中選出真正推動這波行情的關鍵新聞

作答後立即公佈真實股價走勢延伸、策展者標註的新聞重要度，以及整理好的事件時間軸摘要，讓玩家對照自己的判斷與實際情況的落差，藉此訓練辨別真正利多與雜訊的能力。

MVP 先做一關（2330 台積電，2023/04～2023/07 的 +35% 行情），驗證核心遊戲迴圈；資料層／遊戲邏輯層／UI 層嚴格分離，讓未來擴充其他玩法模式（分階段解鎖、資金部位管理等）不需要重寫底層。

## User Stories

1. As a 玩家, I want 在遊戲開始時看到某一段歷史期間的 K 線圖（不含未來走勢）, so that 我能在不知道結果的情況下做出判斷。
2. As a 玩家, I want 看到該期間內所有已公開的新聞列表（標題與內容）, so that 我可以評估哪些新聞可能影響股價。
3. As a 玩家, I want 從「買進／觀望／放空」三個選項中選一個方向, so that 我可以表達我對這波行情方向的判斷。
4. As a 玩家, I want 從新聞列表中勾選我認為真正推動這波行情的關鍵新聞（可複選）, so that 我可以練習分辨真正利多與雜訊。
5. As a 玩家, I want 在提交答案後立即看到真實的股價走勢延伸（完整區間）, so that 我能知道市場實際上怎麼走。
6. As a 玩家, I want 看到每則新聞的策展重要度評分（星等）, so that 我能知道自己選對了幾則、漏掉哪些關鍵新聞。
7. As a 玩家, I want 看到我的方向判斷得分與新聞選擇得分, so that 我能量化自己這關表現得如何。
8. As a 玩家, I want 看到策展者整理的事件時間軸摘要（例如「這波上漲主因：① AI需求超預期 ② CoWoS產能不足…」）, so that 我能理解完整的因果脈絡，而不只是看到分數。
9. As a 玩家, I want 我的遊戲可以在手機瀏覽器上透過區網連線遊玩, so that 我可以邀請朋友在同一個空間用自己的手機一起玩。
10. As a 維護者（我自己）, I want 用一套獨立的 Python pipeline 抓取歷史股價資料（yfinance）, so that 我不用手動整理 OHLCV 資料。
11. As a 維護者, I want pipeline 能對新聞資料做初步的 LLM 分群與重要度評分草稿, so that 我不用從零開始手動判讀每一則新聞。
12. As a 維護者, I want 在 LLM 產生草稿後，能人工校對／修改每則新聞的重要度與分群結果, so that 最終呈現給玩家的答案品質有人把關，不會因為 LLM 誤判而誤導玩家。
13. As a 維護者, I want pipeline 使用 SQLite 做內部前處理階段的資料暫存與查詢, so that 我可以方便地做關聯查詢、去重、標記，而不用維護一個常駐資料庫服務。
14. As a 維護者, I want pipeline 最終輸出一份符合固定 schema 的靜態 scenario JSON 檔案, so that 前端可以直接讀取，不需要任何後端 API。
15. As a 維護者, I want 這份 scenario JSON（含新聞內容與股價資料）不會被提交進 git 歷史, so that 我不會因為新聞內容或資料授權問題而違反著作權／使用條款。
16. As a 維護者, I want 遊戲程式碼（前端＋pipeline 腳本）可以公開在 GitHub 並以 MIT 授權開源, so that 其他開發者可以參考、貢獻，或基於這個框架自己策展其他關卡。
17. As a 開發者（未來的我或貢獻者）, I want 「遊戲模式」與「交易機制」被設計成可抽換的模組介面, so that 未來可以新增分階段揭露模式、資金部位管理模式，而不需要重寫既有的資料層或核心邏輯。
18. As a 開發者, I want 資料取得方式被抽象成統一介面（目前用讀本地 JSON 實作）, so that 未來要換成即時 API 抓取動態資料時，只需要替換實作，不用改動遊戲邏輯或 UI 層。
19. As a 玩家, I want 遊戲用純靜態網站（React + Vite build）的方式運作, so that 遊戲載入快、不需要等待伺服器回應。
20. As a 維護者, I want 前端有一個不依賴 UI 的純函式（`scoreRound`）可以獨立測試分數計算邏輯, so that 我能在不啟動瀏覽器的情況下驗證計分規則是否正確。
21. As a 維護者, I want pipeline 有一個不依賴網路／LLM 呼叫的純函式（`build_scenario`）可以獨立測試資料轉換邏輯, so that 我能驗證輸出的 JSON 格式是否符合前端要的 schema，而不用每次都重新抓資料或呼叫 LLM。

## Implementation Decisions

**架構**：模組化 monolith，單一 git repo，非微服務。

**模組**
- `frontend/`：React（穩定版）+ Vite + TypeScript + Tailwind CSS + `lightweight-charts`。純前端，無後端 API，build 後為純靜態檔案。套件管理用 `bun`。
- `pipeline/`：Python（`uv` 管理環境與依賴）。
  - 股價抓取：yfinance
  - 新聞策展：LLM 初步分群／評分草稿 + 人工校對（校對方式為直接編輯資料檔案，不另外做校對用 UI）
  - SQLite：僅作為 pipeline 內部前處理階段的暫存資料庫，不對外暴露、不與前端互動
  - 輸出：將已校對完成的資料，轉換匯出成符合前端 schema 的靜態 `scenario.json`
- `data/`：pipeline 產出的 scenario JSON 存放處，加入 `.gitignore`、不進版本控制；前端直接讀取此資料夾。

**資料流**：原始資料（yfinance 股價 + 策展新聞）→ pipeline 前處理（SQLite 暫存，LLM 草稿 + 人工校對）→ 匯出 `scenario.json`（不進 git）→ 前端讀取渲染。

**Scenario JSON schema（概念性，實作時再細化）**
- `id`, `stockTicker`, `stockName`, `dateRange { start, end }`
- `priceSeries`：OHLCV 陣列（日期、開高低收量）
- `newsItems`：陣列，每則含 `date`、`headline`、`content`、`importance`（1～5 星，策展標註的真實重要度）、`isKeyEvent`（是否列入「真正關鍵事件」清單）
- `timelineSummary`：策展者整理的事件時間軸摘要文字列表（依重要度排序）

**遊戲邏輯層**（前端內部，與 UI 元件分離）
- `scoreRound(selection: { direction, selectedNewsIds }, scenario) -> { directionScore, newsScore, breakdown }`：純函式，不依賴 React state 或 DOM。
- 計分規則初版：方向判斷對／錯二元計分；新聞選擇依「選中新聞的 importance 加總」與「漏選高重要度新聞的扣分」計算，細節於實作階段依遊戲測試手感微調。

**前端資料存取層**：定義 `ScenarioDataProvider` 介面（`getScenario(id) -> Scenario`）。MVP 實作為讀取 `data/` 資料夾下對應的靜態 JSON；未來若要接即時 API，只需新增另一個實作，不動遊戲邏輯與 UI 層。

**遊戲模式／交易機制**：以可抽換模組設計。MVP 僅實作「一次性揭露＋方向性選擇」這一種組合，不預先寫其他模式的程式碼；但介面設計需讓未來新增模式（分階段揭露、資金部位管理）時不用改動資料層。

**工具鏈**：Python 用 `uv`；前端用 `bun`。不使用 Docker（SQLite 本身即為零伺服器方案，專案目前也不需要跨環境部署一致性）。不引入 Go（沒有需要常駐後端服務或單一執行檔 CLI 發佈的場景）。

**部署**：前端程式碼公開於 GitHub（MIT 授權），build 後以 GitHub Pages 部署（僅程式碼與可公開資料，若含版權疑慮的資料則不納入公開部署）。玩家可本機執行，或透過 Vite 開發伺服器綁定 `0.0.0.0` 供同區網裝置連線遊玩。遠端開放給區網外的使用者不在此規格範圍內，留待未來評估。

## Testing Decisions

- 好的測試只驗證外部行為（輸入輸出），不驗證實作細節（不測 React 內部 state 更新次數，不測 SQLite 中間 query 結果）。
- **前端測試模組**：`scoreRound` 純函式 — 給定不同的 `selection` 與 `scenario` fixture，驗證回傳分數與 breakdown 是否符合預期規則，涵蓋：全對、全錯、部分正確、選到雜訊新聞扣分等案例。
- **Pipeline 測試模組**：`build_scenario` 轉換函式 — 給定固定的股價 fixture（小型 CSV/DataFrame）與已校對好的新聞 fixture（不觸發真正的 yfinance 網路呼叫或 LLM API），驗證輸出 JSON 是否符合前端期待的 schema（欄位齊全、型別正確、`isKeyEvent` 與 `importance` 一致）。
- **不測試**：yfinance 實際網路呼叫、LLM API 呼叫結果的品質（這些是 I/O 邊界與非決定性內容，由人工校對把關，不適合寫自動化測試）。
- **Prior art**：全新 greenfield 專案，無既有測試可參考。測試框架：前端用 Vitest（與 Vite 生態一致，設定成本最低），Pipeline 用 pytest（Python 生態標準選擇）。

## Out of Scope

- 分階段揭露模式、資金部位管理交易模式及兩者混合模式 — 僅在架構上預留可抽換空間，不在本次 MVP 實作。
- 即時／動態資料串接（任意股票代碼查詢）— MVP 僅支援手動策展的固定關卡。
- 遠端多人連線、帳號系統、雲端進度儲存、排行榜 — 目前僅本機／同區網單人使用，無使用者驗證機制。
- 台灣證交所 OpenAPI、FinMind 等其他資料來源整合 — MVP 僅用 yfinance。
- Docker 化部署、Go 語言服務 — 經評估目前無需求。
- 新聞自動化爬蟲 — 舊新聞抓取困難且有版權風險，MVP 採人工蒐集／策展方式。

## Further Notes

- 這是從零開始的 greenfield 專案，目前工作目錄是空的，沒有既有程式碼、ADR 或 domain glossary 可參考。本規格中的模組命名（`ScenarioDataProvider`、`scoreRound`、`build_scenario`）為設計階段的暫定介面命名，實作時可依實際情況調整，不視為必須逐字遵守的最終命名。
- 新聞資料與部分股價資料因授權疑慮不會進入公開 git 歷史。這代表若此專案未來要接受外部貢獻者（PR），貢獻者本機需要自行策展或取得測試用的替代資料才能完整跑動遊戲，這點需要在後續撰寫 CONTRIBUTING 文件時特別說明。
- 計分公式、UI 視覺呈現細節（卡片樣式、動畫效果）刻意未在本規格鎖死，留給實作階段依實際遊戲測試手感決定，避免規格過度規範這些容易反覆調整的細節。
