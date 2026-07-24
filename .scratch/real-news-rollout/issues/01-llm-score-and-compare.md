# 01 — LLM 評分 + manual/LLM 比較

**What to build:** 用 codex/agy 的 yolo 模式對既有 TSMC 2023 的 17 則新聞跑一次 claude-sonnet-5 評分寫入 `news_scores`（method 記為模型名稱），加一個唯讀 `compare-scores` CLI 子命令印出 manual vs LLM 的逐則對照表，最後人工寫一份繁中分析報告判斷「LLM 評分能否取代人工評分」。

**Blocked by:**（無，可立即開始）

**Status:** done

- [x] 用 codex 或 agy yolo 模式（不由 Claude 直呼 API）對 `tsmc-2023-ai-rally` 的 raw news 跑 sonnet 評分，寫入 `news_scores`，method = `llm-claude-sonnet-5`，與既有 `manual` 並存不覆蓋
- [x] `pipeline compare-scores --scenario <id> --methods manual,llm-claude-sonnet-5`：逐則列 importance 差距與 is_key_event 是否一致，結尾彙總（平均差距、不一致則數）
- [x] 對照計算抽成不碰 DB 的純函式，pytest 覆蓋（兩組 score rows → 差距與不一致標記正確）
- [x] 繁中分析報告寫進 private repo（不再進 `.scratch/history/`，見 issue 00）：逐則看分歧在哪、結論「LLM 能否取代人工」——此結論決定 issue 03 爬來的新聞要不要人工複核

## Comments

**模型偏差**：ticket 原假設 `claude-sonnet-5`，但本機 env 無 `ANTHROPIC_API_KEY`（pipeline 無法直呼 Anthropic），且 `agy` 的 print 模式無法穩定接收非互動 prompt。故改用 `codex`（yolo，實際模型 **gpt-5**）當 scorer，method 誠實標記為 `llm-gpt-5`。評分方法論不變（LLM 只看 raw news 獨立判斷）。

**結果**：is_key_event 零分歧（manual 與 llm 選出的 5 則關鍵事件完全相同）；importance 平均絕對差 0.65，且分歧全為 LLM 系統性評高 1（背景雜訊項），不影響關鍵事件辨識。結論：LLM 可取代人工做 is_key_event；importance 若影響玩法再輕度校準。完整分析見 private repo `history/2026-07-25-manual-vs-llm-scoring.md`。

`compare-scores` CLI + 純函式 `compare_scores` + `ScoreComparison` 型別由 codex 實作，18 測試通過，獨立重跑驗證。
