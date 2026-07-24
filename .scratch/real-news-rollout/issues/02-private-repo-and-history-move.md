# 02 — 建 private repo 與搬遷 history

**What to build:** 建立 private repo `market-sleuth-private` 作為未來私有文件（爬蟲來源筆記、含新聞原文的研究、評分分析報告）的家；把既有 `.scratch/history/`（review 報告）搬過去，主 repo 移除該目錄並更新 CLAUDE.md 的引用說明。不改寫 git 歷史。

**Blocked by:**（無）

**Status:** done（主 repo 變更待 commit）

- [x] `gh` 建 private repo `Echoslayer/market-sleuth-private`（private，已 push README + history）
- [x] `.scratch/history/2026-07-24-frontend-architecture-review.md` 移入 private repo `history/`，主 repo 刪除 `.scratch/history/`（已 stage 刪除）
- [x] CLAUDE.md 慣例改為「review 寫進 private repo `market-sleuth-private`」；spec/ticket 仍留公開 `.scratch/`
- [x] 主 repo `.gitignore` 不補：未來私有文件直接生在 private repo，不會出現在主 repo 樹裡，補 ignore 是替不存在的路徑寫規則
- [x] 明確不做：改寫 git 歷史移除已公開的 `.scratch/`（成本高、買不到真隱私，內容本身無害）

## Comments

資料檔（`pipeline/scenarios/`、`data/`）維持維護者手動雲端備份，不納入本 issue、不做工程。
