# 02 — Move the swipe deck's state into the round module

**What to build:** 玩家在 swipe 與 list 兩種新聞檢視模式之間來回切換時，已經做過的判斷要留著。

目前切一次就全沒了，兩個方向都是：翻了 8 張牌、切到 list 看一眼、切回 swipe——回到 0/17，八次判斷不見；在 list 模式勾選幾則、切到 swipe，勾選同樣被清空。玩家沒有任何提示，也沒有 undo 可以救。

成因是牌組狀態住在 `NewsSwipeDeck` 自己的 component 裡：切換模式讓它卸載，狀態隨之消失，重新掛載時它的 mount effect 又把一副空牌組廣播回 round，順手覆蓋掉 round 裡原本存著的選擇。

修法是把牌組狀態提進 round module，讓它跟 round 的其他狀態一樣活過 component 的卸載。`NewsSwipeDeck` 變成受控的，只負責指標手勢與翻牌動畫。這同時收掉 ticket 01 明列的兩筆已知債：牌組是否翻完不再同時存在兩處，新聞選擇回呼也不再需要承重的 `useCallback`（它現在是防無限迴圈用的）。

介面形狀在烤問時已敲定：

```ts
type RoundState = {
  // ...既有欄位
  deck: SwipeDeckState<NewsItem>   // 取代 newsDeckComplete
}

decideNews(state, direction): RoundState   // 內部呼叫 swipeDeck.decide
undoNews(state): RoundState                // 內部呼叫 swipeDeck.undo
// canSubmit 改讀 isComplete(state.deck)
// updateNews 保留給 list 模式，或與 toggleNews 合併

// NewsSwipeDeck props: { deck, onDecide, onUndo }
```

已知的未知數：`makeDecision` 目前用 160ms 的 `setTimeout` 讓卡片飛出去之後才推進牌組。牌組狀態上移之後，這段動畫時序要重新接過，別讓它變成畫面閃動或吃掉點擊。

**Blocked by:** 01 — Extract the round into a pure module

**Status:** ready-for-agent

- [ ] swipe 翻過幾張後切到 list 再切回 swipe，進度與選擇都保持不變
- [ ] list 模式勾選後切到 swipe，勾選保持不變
- [ ] `swipeDeck` module 本身不修改，由 round module 呼叫
- [ ] `NewsSwipeDeck` 的兩個 `onChange` effect 全部移除
- [ ] `newsDeckComplete` 欄位移除，翻完與否只有一個來源
- [ ] `GameRound` 的新聞選擇 `useCallback` 移除，連同它的註解
- [ ] 翻牌動畫與現在等價：卡片飛出後才推進，不閃動、不吃掉點擊
- [ ] undo 行為不變，且切換模式後仍可 undo 切換前的判斷
- [ ] 測試：切換 newsMode 來回一趟後，牌組進度與選擇不變
- [ ] 測試：`decideNews` 向右加入選擇、向左不加入；`undoNews` 還原上一筆
- [ ] 測試：`canSubmit` 在牌組翻完前為 false、翻完後為 true
- [ ] 測試風格與 `swipeDeck` 一致：組合純函式呼叫再對回傳值斷言，不 render React、不引入 jsdom
- [ ] scenario JSON schema 與 pipeline 完全不動
- [ ] typecheck 通過，完整測試套件通過
