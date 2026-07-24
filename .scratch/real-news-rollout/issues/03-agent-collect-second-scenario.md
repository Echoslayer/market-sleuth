# 03 — Agent 蒐集第二關真實新聞

**What to build:** 優先叫 agy（yolo 模式）搜尋某 ticker 某歷史時段的真實新聞、驗證 URL 存在，產出符合 raw-news.json 形狀（含 issue 02 新增的 url/source=agent）的檔案，走既有 `import-raw-news` 匯入，成為第二關。零 pipeline 程式碼。

**Blocked by:** 02（需要 url/source 欄位）；建議在 01 有結論後做（決定要不要人工複核 agent 評分）

**Status:** done

- [x] 挑一個因果清楚的事件：**Netflix (NFLX) 2022 Q1 訂閱數暴雷**——2022-04-19 盤後公布十年來首次訂閱數下滑，隔日股價崩 −35%，主因單一明確
- [x] codex（yolo，實際 gpt-5，非 agy）全網路權限搜尋，`curl` 驗證每則 URL，只留 HTTP 200，輸出 13 則 raw-news.json（source=agent，含 url）
- [x] `import-raw-news --source agent` → codex LLM 評分（method=`llm-gpt-5`，依 issue 01 結論 is_key_event 可信自動採用）→ `build-scenario`
- [x] 複製到 `frontend/public/data/nflx-2022-subscriber-shock.json`（gitignore，不 commit 真實內容）；`VITE_SCENARIO_ID=nflx-2022-subscriber-shock bun run build` 通過，schema 與 TSMC 關卡逐鍵一致，可玩
- [x] 不建 fetcher 抽象層——codex/agy 就是「產一份 raw-news.json 的東西」，殊途同歸進 import-raw-news

## Comments

**Scenario id**：`nflx-2022-subscriber-shock`，價格窗口 2022-03-14～2022-05-13（含 −35% 崩盤日），13 則新聞、8 則關鍵事件（財報/訂閱/裁員與密碼共享回應），5 則背景雜訊（CPI 8.5%、生產者物價、亞股、Nasdaq 最慘月）當干擾項。detective 模式（無 reveal cutoff）；未來可加 `--reveal-cutoff-date 2022-04-18` 改 predictive 模式（讓玩家在財報前預測）。

**工具偏差**：ticket 原寫優先用 agy，但 agy 的 print 模式無法穩定接非互動 prompt，改用 codex（有網路）蒐集 + 驗 URL；評分沿用 issue 01 的 `llm-gpt-5`。

**資料持久化**：蒐集輸入存於 `pipeline/scenarios/nflx-2022-subscriber-shock/`（raw-news.json / llm-scores.json / url-validation.txt，皆 gitignored），供手動雲端備份；`staging.db`、`data/`、`frontend/public/data/` 內的產物皆 gitignored，不入公開 repo。

**品質**：13/13 URL 驗證 HTTP 200，來源含 Netflix IR 股東信 PDF、AP、The Verge、TechCrunch、LA Times、Guardian、Fox。品質足以當第二關；未來量產更多關卡時再評估 GDELT（issue 06）/爬蟲（issue 07）。
