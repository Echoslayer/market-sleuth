# 06 — 開源發佈設定

**What to build:** repo 公開在 GitHub、MIT LICENSE、`.gitignore` 正確排除真實資料（皆已在 01～05 過程中完成）。剩下的：build 後部署到 GitHub Pages，能用網址打開遊戲外殼並實際玩過一輪。由於真實 TSMC 資料因版權因素不進 git，公開部署版預設使用 01 的 toy fixture，本機開發則透過環境變數切換成真實 scenario，兩者用同一份程式碼、不用兩套維護。

**Blocked by:** None（01 已完成；依使用者指示等關卡能玩後才建票，現在條件已滿足）

**Status:** done

- [x] `GameRound` 讀取的 scenario id 可透過建置環境變數覆蓋，預設為 toy fixture；本機 `.env.local`（gitignored）設定為真實 scenario id 以利日常開發
- [x] `base` path 確保 GitHub Pages 專案頁（`/market-sleuth/` 子路徑）資源路徑不會 404（用 `bun run build -- --base=/market-sleuth/` CLI flag，而非寫死進 `vite.config.ts`，避免 `process.env` 在 TS strict 模式下需要額外裝 `@types/node`）
- [x] GitHub Actions workflow（`.github/workflows/deploy.yml`）：push 到 `main` 時自動 build 前端並部署到 GitHub Pages
- [x] repo 的 GitHub Pages 設定來源為 GitHub Actions（透過 API 啟用：`build_type=workflow`）
- [x] 實際觸發一次部署，確認公開網址可以打開、玩過一輪（用 toy fixture 資料），無 404

## Comments

全部由 Claude Code 直接完成（未委派 codex/agy，純設定/CI 工作直接做比較快）。實測：`.env.local` 存在時 build 出來的 bundle 內含 `tsmc-2023-ai-rally`；移除 `.env.local` 模擬 CI 環境後重新 build，確認 fallback 到 `toy-chipmaker-rally`（用 `grep` 檢查 build 後的 JS bundle 內容驗證，兩種情況都各自 build 一次比對過）。

Push 後用 `gh run watch` 即時看完整個 GitHub Actions workflow 跑完（build 17s + deploy 10s，全綠），再用 `curl` 實際打公開網址 https://echoslayer.github.io/market-sleuth/ 確認 index、JS、CSS、`/data/toy-chipmaker-rally.json` 皆回 200，base path 正確沒有 404。

**MVP 全部 6 張票（01～06）到此全部完成。**
