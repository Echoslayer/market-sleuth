# 04 — 前端滑卡 + 新聞彈窗

**What to build:** 把「新聞互動」從列表勾選重做成 Tinder 式卡片堆疊：左右滑判定關鍵/非關鍵（右滑=關鍵）、可撤回、點卡片開原生 `<dialog>` 看全文與「閱讀原文」外連；桌面端同時給 ✓/✗ 按鈕（無障礙基本盤）。底層答案集合與 `scoreRound` 不變。

**Blocked by:** 02（`Scenario` 需有 url 欄位；content 可空的 UI 行為）

**Status:** done

- [x] 卡片堆疊 UI 顯示新聞，一張一張處理
- [x] 左右滑（原生 pointer events + CSS transform，不裝套件）：右滑=關鍵、左滑=非關鍵；過閾值飛出、未過彈回，不追求物理擬真
- [x] 撤回鍵：history stack pop，還原上一張
- [x] 桌面端 ✓/✗ 按鈕，與滑動等效
- [x] 點卡片開原生 `<dialog>`：headline/date/content +（有 url 才顯示）「閱讀原文」外連；content 為空時顯示「請點連結閱讀原文」
- [x] 判定/撤回邏輯抽成純函式，vitest 覆蓋；手勢動畫本身不測
- [x] `scoreRound` 不受影響（輸入方式變、答案集合不變）

## Comments

不做新聞內嵌 iframe（多數新聞站擋 iframe）。與 Q9 一致：不加濃縮原因選項題型。
