# 04 — Pipeline 新聞 LLM 草稿步驟

**What to build:** pipeline 新增一個步驟：給定原始新聞（標題／內文），呼叫 LLM 產出分群與重要度評分草稿，寫入 SQLite 供人工校對／修改，取代 03 原本純手動填寫重要度的方式。人工校對後的最終結果，走 03 既有的 `build_scenario` 匯出流程。

**Blocked by:** 03

**Status:** done

- [x] 給定一批原始新聞（標題＋內文），呼叫 LLM API 產出每則新聞的重要度草稿評分與 `isKeyEvent` 判斷（「分群」在 01 定案的 schema 裡從未落地成獨立欄位，前端也不消費，故簡化為只產出 importance + isKeyEvent，與最終資料契約一致）
- [x] LLM 草稿結果寫入 SQLite 的 `news` 表，與 03 的人工填寫結果同一張表/相容格式，可直接編輯覆蓋（`pipeline-import-news` 用 `INSERT OR REPLACE` 即可覆蓋校對後的值）
- [x] 校對後的資料可直接用 03 的 `build_scenario` 匯出，不需額外轉換
- [x] 此步驟為可選（optional）——`ANTHROPIC_API_KEY` 未設定或呼叫失敗會直接拋出明確錯誤，不靜默 fallback；03 的純手動流程完全不受影響

## Comments

`codex exec` 完成，新增 `pipeline-draft-news` CLI、`news_draft.py`（`parse_news_draft_response` 為可獨立測試的純函式，負責驗證 LLM 回傳的 JSON 格式並拒絕不合法的 importance/is_key_event）。Claude Code 驗證：把預設模型從 codex 寫的過時 `claude-sonnet-4-20250514` 改成 `claude-sonnet-5`；真的跑了 `uv add anthropic`（裝進真實套件）與 `uv run pytest`，8/8 通過。未實際打真正的 Anthropic API（會產生費用且非決定性，如 ticket 所述不需要）。
