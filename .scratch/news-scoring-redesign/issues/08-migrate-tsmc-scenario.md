# 08 — 遷移既有 TSMC 內容到新架構

**What to build:** 把 ticket 05 手寫的 `pipeline/scenarios/tsmc-2023-ai-rally/news.json`（17 則，已含 importance/is_key_event）拆成兩份原始輸入檔（原始新聞、人工評分），透過 07 新建的 CLI 流程重新匯入與匯出，確認產出的真實 scenario JSON 跟現有版本內容一致，前端讀取後仍可正常遊玩。

**Blocked by:** 07

**Status:** ready-for-agent

- [ ] `pipeline/scenarios/tsmc-2023-ai-rally/news.json` 拆成 `raw-news.json`（date/headline/content）與 `manual-scores.json`（news_id/importance/is_key_event），17 則新聞內容不變
- [ ] 跑過 `import-raw-news → score-news --method manual → build-scenario --score-method manual`，產出的 `data/tsmc-2023-ai-rally.json` 與遷移前版本比對：股價資料、新聞內容、重要度、isKeyEvent、timelineSummary 完全一致
- [ ] 複製到 `frontend/public/data/tsmc-2023-ai-rally.json`，本機用 `.env.local` 指向這個 scenario 實際玩過一輪，確認遊戲行為與遷移前一致
- [ ] 舊格式的 `news.json`（合併版）確認可以刪除或保留僅供參考（實作時決定，不影響上述驗收）
