# 04 — Pipeline 新聞 LLM 草稿步驟

**What to build:** pipeline 新增一個步驟：給定原始新聞（標題／內文），呼叫 LLM 產出分群與重要度評分草稿，寫入 SQLite 供人工校對／修改，取代 03 原本純手動填寫重要度的方式。人工校對後的最終結果，走 03 既有的 `build_scenario` 匯出流程。

**Blocked by:** 03

**Status:** ready-for-agent

- [ ] 給定一批原始新聞（標題＋內文），呼叫 LLM API 產出：分群結果、每則新聞的重要度草稿評分
- [ ] LLM 草稿結果寫入 SQLite 的暫存欄位，與 03 的人工填寫結果為同一張表/相容格式，可直接編輯覆蓋
- [ ] 校對後的資料可直接用 03 的 `build_scenario` 匯出，不需額外轉換
- [ ] 此步驟為可選（optional）——沒有 LLM API key 或不想用時，03 的純手動流程仍可獨立運作
