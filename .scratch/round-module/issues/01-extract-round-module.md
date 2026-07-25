# 01 — Extract the round into a pure module

**What to build:** 一個 round 的所有規則——載入 scenario、變更 settings、選方向、切換新聞檢視、更新新聞選擇、提交——住進一個與 React 無關的 module，讓開發者能在單一處讀懂並測試它們。玩家看到的行為完全不變：切 scenario 仍會清空前一場、predictive mode 仍只顯示 cutoff 之前、cutoff 之後沒選到的 key event 仍記為 missed、swipe 未翻完仍不能提交、提交後仍全部現形、翻牌與改方向仍不會重設牌組。

`GameRound` 退化成 I/O shell：只剩 dialog 開關、fetch effect、localStorage effect 與 JSX，不再持有任何規則。

狀態形狀與轉換清單來自烤問過程逐項敲定的結果，比散文更精確：

```ts
type RoundState = {
  settings: Settings
  scenario: Scenario | null          // 完整，scoreRound 只吃這個
  visibleScenario: Scenario | null   // derived，identity 是介面契約的一部分
  direction: Direction
  selectedNewsIds: string[]
  newsDeckComplete: boolean
  newsMode: "swipe" | "list"
  score: RoundScore | null
}

startRound(stored: unknown, defaultScenarioId: string): RoundState

loadScenario(state, scenario): RoundState      // ┐
changeSettings(state, next): RoundState        // ├ 重算 visibleScenario
submit(state): RoundState                      // ┘

chooseDirection(state, direction): RoundState  // ┐
chooseNewsMode(state, mode): RoundState        // ├ 原封帶過 visibleScenario
updateNews(state, ids, complete): RoundState   // ┘

canSubmit(state): boolean
```

**Blocked by:** None — can start immediately.

**Status:** done

- [x] round module 不 import 任何 React 的東西
- [x] `Settings` 型別與預設值住在 round module，`SettingsDialog` 改為 import；`SCENARIO_IDS` 留在 dialog
- [x] 只有 `loadScenario`、`changeSettings`、`submit` 重算 `visibleScenario`；其餘三個轉換原封帶過該欄位
- [x] reveal 優先序在 module 內：reveal-all 最優先，其次 manual cutoff override，最後 scenario 自帶的 `revealCutoffDate`；已有 score 時全部顯示
- [x] `changeSettings` 偵測 scenario id 改變並清掉 scenario、score、新聞選擇、牌組完成旗標與方向
- [x] `GameRound` 的 `useMemo` 與 fetch effect 裡那五行 reset 全部刪除
- [x] 新聞選擇回呼的 `useCallback` 保留——`NewsSwipeDeck` 把 `onChange` 放在 effect deps 裡，不穩定的識別會造成無限迴圈；它在牌組狀態搬進 round module 之前是承重的，並附註說明
- [x] scenario data provider 與 localStorage 留在 component，不注入 module
- [x] `scoreRound`、`revealCutoff`、`swipeDeck` 三個既有 module 不修改，由 round module 呼叫
- [x] news swipe deck 的狀態不搬動，仍以 `updateNews` 回報結果
- [x] scenario JSON schema 與 pipeline 完全不動
- [x] 測試：`scoreRound` 接收完整 scenario——cutoff 之後的 key event 提交後出現在 missed
- [x] 測試：`chooseDirection` 前後 `visibleScenario` 參考相等（`toBe`）
- [x] 測試：reveal-all 壓過 manual cutoff override
- [x] 測試：空的 manual cutoff override 退回 scenario 自帶的 `revealCutoffDate`
- [x] 測試：切換 scenario id 清掉 score、新聞選擇與方向
- [x] 測試：缺少新欄位的舊 settings blob 被補上預設值
- [x] 測試：提交後可見範圍變成完整 scenario
- [x] 測試：swipe 模式未翻完不可提交，list 模式可以
- [x] 測試風格與 `swipeDeck` 一致：組合純函式呼叫再對回傳值斷言，不 render React、不引入 jsdom
- [x] typecheck 通過，完整測試套件通過
