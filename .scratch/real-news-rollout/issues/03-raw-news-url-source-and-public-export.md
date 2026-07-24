# 03 — raw_news 加 url/source 與 build-scenario --public

**What to build:** `raw_news` 表加 `url`（可空）與 `source`（manual/agent/gdelt/crawler，NOT NULL）兩欄；`build-scenario` 加 `--public` 旗標，帶了就把 content 剝掉只留 headline/date/url 匯出（給未來公開通路）。前端 `Scenario` type 同步加可選 `url`（資料契約兩邊一起改）。

**Blocked by:**（無，但與 issue 04/05 相依——先於它們做）

**Status:** todo

- [ ] `raw_news` schema 加 `url TEXT`（可空）、`source TEXT NOT NULL`；`import-raw-news` 接收並寫入 source（預設或必填由實作決定）
- [ ] `types.py` 的新聞列型別加 url/source，維持「形狀只定義一次」
- [ ] `build-scenario --public`：置空 content、只留 headline/date/url；不帶旗標維持完整輸出（本機玩）
- [ ] `resolve_news` / `build_scenario` 既有測試涵蓋新欄位（url/source 有值與缺值）
- [ ] 前端 `frontend/src/types/scenario.ts` 的新聞項加可選 `url`；content 可為空字串時 UI 顯示「請點連結閱讀原文」（供 issue 05 使用）

## Comments

私有性不進 db——「能不能散布」是發布通路政策，由匯出點 `--public` 決定，資料只存一份。
