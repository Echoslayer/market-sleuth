# 02 — 前端遊戲迴圈 walking skeleton

**What to build:** 玩家打開瀏覽器，用 01 的 fixture scenario 完整玩一輪遊戲：看到揭露前的 K 線圖 → 選方向（買進/觀望/放空）→ 從新聞列表勾選認為關鍵的新聞 → 提交 → 看到分數、完整走勢揭露、每則新聞的重要度星等、時間軸摘要。遊戲邏輯與 UI 元件分離，`ScenarioDataProvider` 介面的 MVP 實作為讀取本地 JSON。

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] 開啟遊戲後，看到 fixture scenario 揭露前區間的 K 線圖（lightweight-charts），看不到揭露後的走勢
- [ ] 可選擇買進／觀望／放空其中一項
- [ ] 可從新聞列表複選新聞
- [ ] 提交後畫面顯示：完整走勢延伸、每則新聞的策展重要度星等、時間軸摘要文字
- [ ] `scoreRound(selection, scenario)` 為不依賴 React/DOM 的純函式，並有 Vitest 測試涵蓋：方向全對、方向全錯、新聞全選對、部分選對、選到低重要度新聞扣分等案例
- [ ] `ScenarioDataProvider` 定義為介面，MVP 實作讀取本地 JSON 檔案
- [ ] `bun run dev -- --host` 啟動後，同區網內的手機瀏覽器可連線並完整玩過一輪
