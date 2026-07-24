# 06 — 開源發佈設定

**What to build:** repo 公開在 GitHub、MIT LICENSE、`.gitignore` 正確排除真實資料（皆已在 01～05 過程中完成）。剩下的：build 後部署到 GitHub Pages，能用網址打開遊戲外殼並實際玩過一輪。由於真實 TSMC 資料因版權因素不進 git，公開部署版預設使用 01 的 toy fixture，本機開發則透過環境變數切換成真實 scenario，兩者用同一份程式碼、不用兩套維護。

**Blocked by:** None（01 已完成；依使用者指示等關卡能玩後才建票，現在條件已滿足）

**Status:** ready-for-agent

- [ ] `GameRound` 讀取的 scenario id 可透過建置環境變數覆蓋，預設為 toy fixture；本機 `.env.local`（gitignored）設定為真實 scenario id 以利日常開發
- [ ] `vite.config.ts` 設定正確的 `base`，確保 GitHub Pages 專案頁（`/market-sleuth/` 子路徑）資源路徑不會 404
- [ ] GitHub Actions workflow：push 到 `main` 時自動 build 前端並部署到 GitHub Pages
- [ ] repo 的 GitHub Pages 設定來源為 GitHub Actions
- [ ] 實際觸發一次部署，確認公開網址可以打開、玩過一輪（用 toy fixture 資料），無 console 錯誤或 404
