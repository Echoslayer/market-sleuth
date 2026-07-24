# 05 — build-scenario --public 剝除 content

**What to build:** `build-scenario` 加 `--public` 旗標：帶了就把每則新聞的 `content` 置空、只留 headline/date/url 匯出，供未來公開通路（GitHub Pages）上架真實關卡而不散布原文。不帶旗標維持完整輸出（本機玩）。

**Blocked by:** 02（需要 url 欄位已貫通到匯出）

**Status:** deferred（公開上架真要做時再啟動）

- [ ] `build-scenario --public`：置空 content、只留 headline/date/url
- [ ] 不帶旗標維持完整輸出，行為不變
- [ ] 測試涵蓋 --public 有/無時的輸出差異
- [ ] content 被剝時前端 UI 已能優雅顯示（依賴 02/04 的空 content 行為）

## Comments

**為何 deferred：** `--public` 唯一消費者是「公開通路上架真實關卡」，而那在本 rollout 的 Out of Scope（初版完成前不做）。現在做就是替還沒排程的需求先寫程式（YAGNI）。等公開上架真的排上議程再啟動這張。私有性是發布通路政策、不是新聞屬性，所以放匯出點、db 保持乾淨這個設計不變。
