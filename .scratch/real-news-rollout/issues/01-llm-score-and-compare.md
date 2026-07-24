# 01 — LLM 評分 + manual/LLM 比較

**What to build:** 用 codex/agy 的 yolo 模式對既有 TSMC 2023 的 17 則新聞跑一次 claude-sonnet-5 評分寫入 `news_scores`（method 記為模型名稱），加一個唯讀 `compare-scores` CLI 子命令印出 manual vs LLM 的逐則對照表，最後人工寫一份繁中分析報告判斷「LLM 評分能否取代人工評分」。

**Blocked by:**（無，可立即開始）

**Status:** todo

- [ ] 用 codex 或 agy yolo 模式（不由 Claude 直呼 API）對 `tsmc-2023-ai-rally` 的 raw news 跑 sonnet 評分，寫入 `news_scores`，method = `llm-claude-sonnet-5`，與既有 `manual` 並存不覆蓋
- [ ] `pipeline compare-scores --scenario <id> --methods manual,llm-claude-sonnet-5`：逐則列 importance 差距與 is_key_event 是否一致，結尾彙總（平均差距、不一致則數）
- [ ] 對照計算抽成不碰 DB 的純函式，pytest 覆蓋（兩組 score rows → 差距與不一致標記正確）
- [ ] 繁中分析報告寫進 private repo（不再進 `.scratch/history/`，見 issue 02）：逐則看分歧在哪、結論「LLM 能否取代人工」——此結論決定 issue 04 爬來的新聞要不要人工複核

## Comments

（待補）
