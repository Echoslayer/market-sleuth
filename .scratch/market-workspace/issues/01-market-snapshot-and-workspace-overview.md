# 01 — 市場快照與工作台總覽

**What to build:** 讓使用者打開前端時先看到台股市場工作台，從 pipeline 產生的 market snapshot 掌握一個主要指數與三個自選股的最新每日概況、資料更新時間，並能從獨立入口進入既有歷史回放遊戲。這張票建立 market snapshot 從資料產生端到前端首頁的完整路徑，但不交付走勢詳情或新聞操作。

**Blocked by:** None — can start immediately

**Status:** ready-for-agent

- [ ] market snapshot 使用獨立於遊戲 `Scenario` 的明確合約，包含 snapshot 識別資訊、`generatedAt`、`instruments`、各標的 `priceSeries` 與 `newsItems`
- [ ] instrument 明確包含 symbol、名稱、種類、exchange、currency 與 timezone；第一版資料為一個主要台股指數與三個自選股
- [ ] pipeline 提供不碰網路的純 builder，使用固定輸入可產生欄位完整、順序穩定的 market snapshot JSON
- [ ] pipeline 提供可從固定自選清單與現有每日價格能力產生本機 snapshot 的單一 CLI 路徑；前端不直接呼叫第三方 API
- [ ] pytest 驗證必要欄位、價格數值轉換、排序、`generatedAt`、新聞多分類與零個或多個 symbols
- [ ] 前端保留一份可再散布的 toy snapshot，且 production build 會以它驗證資料消費端型別
- [ ] 市場工作台成為預設首頁，顯示最後更新時間、主要指數與自選股的最新價格及漲跌
- [ ] 點選總覽中的標的會建立明確的目前選取狀態，供後續走勢與新聞切片使用
- [ ] 前端提供市場工作台與既有遊戲的簡單頂層導覽，不新增路由依賴
- [ ] 既有遊戲的 `Scenario`、round state、揭露與評分行為維持不變
- [ ] 真實 market snapshot 維持 gitignored，公開部署只包含 allowlisted toy snapshot
- [ ] `uv run pytest`、`bun run test` 與 `bun run build` 全部通過
