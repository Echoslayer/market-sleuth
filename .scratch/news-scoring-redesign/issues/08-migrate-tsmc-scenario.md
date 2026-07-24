# 08 — 遷移既有 TSMC 內容到新架構

**What to build:** 把 ticket 05 手寫的 `pipeline/scenarios/tsmc-2023-ai-rally/news.json`（17 則，已含 importance/is_key_event）拆成兩份原始輸入檔（原始新聞、人工評分），透過 07 新建的 CLI 流程重新匯入與匯出，確認產出的真實 scenario JSON 跟現有版本內容一致，前端讀取後仍可正常遊玩。

**Blocked by:** 07

**Status:** done

- [x] `pipeline/scenarios/tsmc-2023-ai-rally/news.json` 拆成 `raw-news.json`（date/headline/content）與 `manual-scores.json`（news_id/importance/is_key_event），17 則新聞內容不變
- [x] 跑過 `import-raw-news → score-news --method manual → build-scenario --score-method manual`，產出的 `data/tsmc-2023-ai-rally.json` 與遷移前版本比對：股價資料、新聞內容、重要度、isKeyEvent、timelineSummary 完全一致（`diff` 逐位元組相同）
- [x] `frontend/public/data/tsmc-2023-ai-rally.json` 也逐位元組相同（本來就已存在，不用重新複製）；`bun run build`／`bun run test` 皆通過，資料內容未變代表遊戲行為必然與遷移前一致
- [x] 舊格式的 `news.json`（合併版）已刪除——內容已完全由 `raw-news.json` + `manual-scores.json` 取代，留著容易讓人誤用過期格式

## Comments

全程用 Python 腳本從舊 `news.json` 程式化拆分成兩份新檔案（避免手動謄寫 17 則新聞內容時打錯字），不假手 codex——這步純粹是資料格式轉換，不需要程式碼生成能力。用 `diff` 直接比對新舊兩次 pipeline 產出的 JSON，確認完全一致（包含向 yfinance 重新抓一次股價，歷史資料不會變動，結果相同）。
