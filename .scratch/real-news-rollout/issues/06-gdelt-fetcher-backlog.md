# 06 — GDELT fetcher（候補 / backlog）

**What to build:** `pipeline fetch-gdelt` 子命令，從 GDELT 查某 ticker/主題某歷史時段的新聞，輸出符合 raw-news.json 形狀（source=gdelt）的候選檔，供人工篩選後 `import-raw-news`。GDELT 免費、可查歷史、量大，但雜訊高、只給 URL+標題（原文需再處理）、舊 URL 常失效。

**Blocked by:** 03（url/source 欄位）；僅在 issue 04 的 agent 蒐集品質或量不足時才啟動

**Status:** icebox

- [ ] 待 agent 蒐集（issue 04）證實不夠用再評估
- [ ] 若做：確定性、可重跑；處理死連結與雜訊過濾
- [ ] 不建抽象層——GDELT 就是另一個「產 raw-news.json 的東西」

## Comments

歷史 URL 半數失效是已知風險；GDELT 適合量大初篩，不適合直接當最終資料。
