# 03 — Agent 蒐集第二關真實新聞

**What to build:** 優先叫 agy（yolo 模式）搜尋某 ticker 某歷史時段的真實新聞、驗證 URL 存在，產出符合 raw-news.json 形狀（含 issue 02 新增的 url/source=agent）的檔案，走既有 `import-raw-news` 匯入，成為第二關。零 pipeline 程式碼。

**Blocked by:** 02（需要 url/source 欄位）；建議在 01 有結論後做（決定要不要人工複核 agent 評分）

**Status:** ready-for-agent

- [ ] 挑一個因果清楚的事件（避免資料模糊性——一個漲跌對應可辨識的主因）
- [ ] agy yolo 模式搜尋該 ticker 該時段新聞、驗證每則 URL 存在，輸出 raw-news.json（source=agent，含 url）
- [ ] `import-raw-news` 匯入 → 評分（method 依 issue 01 結論：LLM 自動 or 人工複核）→ `build-scenario`
- [ ] 複製到 `frontend/public/data/`（gitignore，不 commit 真實內容），本機驗證可正常遊玩
- [ ] 不建 fetcher 抽象層——agent 就是「產一份 raw-news.json 的東西」，殊途同歸進 import-raw-news

## Comments

（待補）
