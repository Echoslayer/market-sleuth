# 07 — dresspage headless 爬蟲（候補 / backlog）

**What to build:** 用 dresspage（headless 瀏覽器爬蟲）抓 agent/GDELT 只給連結、但需要原文內容的新聞頁面，輸出符合 raw-news.json 形狀（source=crawler，含原文 content）的檔。爬來的內容屬私有，僅本機／private repo 使用，公開匯出時由 `--public` 剝除（見 issue 03）。

**Blocked by:** 03（url/source 欄位）；最貴、最脆，僅在 agent（04）與 GDELT（06）都不足時才上

**Status:** icebox

- [ ] 待前兩個來源證實不夠再評估
- [ ] source=crawler；產物視為私有，不進公開 repo，公開版靠 `--public` 只留連結
- [ ] 不建抽象層——爬蟲就是另一個「產 raw-news.json 的東西」

## Comments

爬蟲脆弱且維護成本高，是前兩者都不夠時的最後手段。
