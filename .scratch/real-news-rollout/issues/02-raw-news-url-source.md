# 02 — raw_news 加 url/source 資料貫通

**What to build:** `raw_news` 表加 `url`（可空）與 `source`（manual/agent/gdelt/crawler，NOT NULL）兩欄，一路貫通 import-raw-news 寫入、`types.py` 型別、`build-scenario` 匯出，到前端 `Scenario` 的新聞項加可選 `url`。這是 03（agent 蒐集）與 04（滑卡彈窗）的共同前置：讓每則新聞能帶原文連結與出處。**不含** `--public` 剝除邏輯（切到 issue 05）。

**Blocked by:** None — can start immediately

**Status:** done

- [x] `raw_news` schema 加 `url TEXT`（可空）、`source TEXT NOT NULL`；`import-raw-news` 接收並寫入 source（既有 manual 匯入 source=manual）
- [x] `types.py` 的新聞列型別加 url/source，維持「形狀只定義一次」
- [x] `build-scenario` 把 url 帶進輸出 JSON（完整輸出，不剝任何內容）
- [x] `resolve_news` / `build_scenario` 既有測試涵蓋新欄位（url/source 有值與缺值）
- [x] 前端 `frontend/src/types/scenario.ts` 的新聞項加可選 `url`；content 可為空字串（供 04 的 UI 顯示「請點連結閱讀原文」）
- [x] 既有 TSMC 關卡重跑匯出仍可玩（url/source 缺值時行為不變）

## Comments

私有性不進 db——「能不能散布」是發布通路政策，由匯出點決定（見 issue 05），資料只存一份。
