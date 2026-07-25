# Round module

## Problem Statement

一個 **round**——玩家從載入 scenario、判斷方向、歸因新聞，一路到 submit 看見結果的完整一輪——目前沒有任何一個地方可以讀懂它。它的規則散落在 `GameRound` 的八個 `useState`、兩個 `useEffect`、一個順序敏感的 `useMemo`，以及一百三十行 JSX 的條件式之間。

這造成三種具體的摩擦：

- **規則沒有家。** dev settings panel spec 明訂的行為——reveal-all 壓過 manual cutoff、空的 cutoff override 退回 scenario 自帶的 `revealCutoffDate`、切換 scenario 必須清掉前一場的選擇——全都寫在 JSX 的條件式或 effect 的前幾行裡。要確認其中任何一條，只能靠讀程式碼。

- **規則沒有測試面。** `GameRound` 沒有 interface，所以沒有 seam 可以下手。專案裡沒有 jsdom、沒有 testing library，既有測試全是純函式測試，因此這些規則目前的保護是零。其中最關鍵的一條——`scoreRound` 永遠接收**完整**的 scenario 而非玩家看得見的那份，否則 cutoff 之後的 key event 會靜靜消失而不是記為 missed——目前只由一段註解守著。

- **正確性依賴 hook 順序。** 那個計算可見範圍的 `useMemo` 必須待在 early return 之上，這個約束靠註解傳達；違反它已經造成過一次整頁空白。同一個 `useMemo` 還兼任另一個隱形職責：維持 `newsItems` 的陣列 identity，否則 news swipe deck 會被無關的 state 改動重設。這兩件事都不是 render 邏輯，卻只能靠 render 期的紀律維持。

`GameRound` 是最近二十五個 commit 裡改動最頻繁的檔案（九次），也就是說每一次改動都要重新承擔上述三種摩擦。

## Solution

把 round 的規則收進一個獨立的、與 React 無關的 module。

這個 module 持有一個 round 的完整狀態，並以一組具名純函式表達它可能發生的每一次轉換：載入 scenario、變更 settings、選擇方向、切換新聞檢視模式、更新新聞選擇、提交。它同時持有一個 derived 的「玩家目前看得見的 scenario」，讓 reveal 的優先序成為 module 內部的事，而不是 render 期推導出來的東西。

`GameRound` 因此退化成一個 I/O shell：持有 dialog 的開關、跑 fetch 與 localStorage 這兩件不純的事、把狀態畫成畫面。它不再持有任何規則。

規則搬進純函式之後，它們就落在一個可以直接用 vitest 呼叫的 seam 上，測試風格與 `swipeDeck`、`scoreRound`、`revealCutoff` 三個既有的純 module 完全一致。

## User Stories

### 玩家可見的行為（必須維持不變）

1. 身為一個玩家，我想要在切換 scenario 之後看到一場乾淨的新局，這樣我上一場的新聞選擇與方向判斷就不會被算進這一場。
2. 身為一個玩家，我想要在 predictive mode 下只看到 cutoff 之前的價格與新聞，這樣我的判斷才是真的在預測而不是在回顧。
3. 身為一個玩家，我想要 cutoff 之後那些我根本看不到的 key event 在提交後被記為「missed」，這樣我的分數才反映完整的真相，而不是只反映我看得到的那一小塊。
4. 身為一個玩家，我想要在 swipe 模式下把整副牌翻完才能提交，這樣我不會在還沒對每則新聞表態時就送出。
5. 身為一個玩家，我想要在 list 模式下隨時都能提交，這樣我不必為了送出而去逐一勾選。
6. 身為一個玩家，我想要提交之後看到完整的價格走勢與新聞列表，這樣我能檢討自己漏掉了什麼。
7. 身為一個玩家，我想要在翻牌、改變方向、切換檢視模式時，新聞牌組維持在原本的進度，這樣我的操作不會憑空被重設。

### 開發者對這些規則的掌握

8. 身為一個開發者，我想要在單一一個 module 裡讀完 round 的所有規則，這樣我不必在八個 `useState`、兩個 effect 和 JSX 條件式之間跳躍才能理解一輪怎麼運作。
9. 身為一個開發者，我想要 reveal-all 壓過 manual cutoff 這條優先序被寫成程式而非註解，這樣它不會在下一次改動時被無聲地違反。
10. 身為一個開發者，我想要空的 manual cutoff 退回 scenario 自帶 `revealCutoffDate` 這條 fallback 被寫成程式，這樣兩個 reveal 控制項的關係是明確的。
11. 身為一個開發者，我想要切換 scenario 時的 reset 規則脫離 fetch effect，這樣這條規則不再與「不純」綁在一起而變得測不到。
12. 身為一個開發者，我想要 submit gating 的條件脫離 JSX 的 `disabled` 屬性，這樣它是一條可以被詢問的規則而不是一個 render 細節。
13. 身為一個開發者，我想要舊的 settings blob 自動補上新欄位預設值這件事被寫成純函式，這樣升級 settings 面板時不會靜靜地讓某個舊使用者的儲存值失效。

### 可測試性

14. 身為一個開發者，我想要用一個純函式的 seam 測試 round 的規則，這樣我不需要為此引入 jsdom 或 testing library。
15. 身為一個開發者，我想要 round 的測試讀起來跟 `swipeDeck` 的測試一樣——組合幾次呼叫再對回傳值做斷言——這樣專案裡只有一種測試風格。
16. 身為一個開發者，我想要「`scoreRound` 拿到的是完整 scenario」這條不變式有一個會失敗的測試，這樣它不再只由一段註解保護。
17. 身為一個開發者，我想要「無關的轉換不改變可見 scenario 的 identity」這條不變式有一個會失敗的測試，這樣造成過整頁空白的那類 bug 有了回歸防線。

### 維護者關心的結構

18. 身為一個維護者，我想要 hook 的順序不再是正確性的條件，這樣早期 return 的位置變成單純的可讀性問題而非 bug 來源。
19. 身為一個維護者，我想要可見範圍的推導離開 render 期，這樣 component 不再需要靠 `useMemo` 維持另一個 component 的正確性。
20. 身為一個維護者，我想要 `Settings` 的型別住在邏輯側而非呈現側，這樣遊戲邏輯不會反向依賴 UI component。
21. 身為一個維護者，我想要新增一條 round 規則時只改一個 module，這樣改動的影響範圍是可預期的。
22. 身為一個維護者，我想要 `scoreRound`、`revealCutoff`、`swipeDeck` 三個既有的純 module 維持原狀被呼叫，這樣這次重構不會連帶動到已經穩定且已有測試的部分。
23. 身為一個維護者，我想要這次重構不改變 scenario JSON 的 schema，這樣 pipeline 那一半完全不受影響。
24. 身為一個維護者，我想要 dev settings panel 的每一項行為在重構後保持不變，這樣這是一次純粹的結構改動而非行為改動。

## Implementation Decisions

### 新增的 module 與它的 interface

新增一個 round module，放在既有純遊戲邏輯所在的位置，與 `scoreRound`、`revealCutoff`、`swipeDeck` 同層。它不 import 任何 React 的東西。

以下的狀態形狀與轉換清單來自烤問過程中逐項敲定的結果，比散文更精確地編碼了這些決策：

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

### 轉換採具名純函式，不採 reducer 與 action union

與 `swipeDeck` 的既有寫法一致（`decide(state, direction)`、`undo(state)`）。component 端以 `useState<RoundState>` 搭配 `setRound(previous => transition(previous))` 使用，不使用 `useReducer`。action 型別的那一層儀式不換來任何東西，且會讓專案出現第二種轉換風格。

### `visibleScenario` 是儲存的 derived 欄位，不是 selector

`visibleScenario` 存在 state 裡，只在能夠改變它的三個轉換中重算。這讓它的 identity 只在真的該變的時候才變，因此 `GameRound` 的 `useMemo` 與 `useCallback` 可以完全刪除，而 news swipe deck 不會因為無關的狀態改動而重設。

**只有 `loadScenario`、`changeSettings`、`submit` 會重算它。** `chooseDirection`、`chooseNewsMode`、`updateNews` 必須原封帶過該欄位——若對它們也套用重算，就會重新製造出這次重構要根除的 identity 抖動。這是一條由 news swipe deck 的依賴形狀逼出來的硬約束，不是風格選擇。

重算的邏輯本身不新寫：把優先序算出來的 cutoff 代入既有的 `revealCutoff` module。優先序為 reveal-all 最優先，其次 manual cutoff override，最後 scenario 自帶的 `revealCutoffDate`；已有 score 時一律全部顯示。

### 切換 scenario 的 reset 由 `changeSettings` 自己偵測

`changeSettings` 比對新舊 settings 的 scenario id，不同時順手清掉 scenario、score、新聞選擇、牌組完成旗標與方向。這讓 reset 成為一條純規則。fetch effect 因此只剩下取資料與回報結果兩件事。

替代方案（獨立的 switch 轉換）被否決：`SettingsDialog` 的變更回呼拿到的是整包 settings，比對欄位的責任會退回 component，規則又漏回 JSX 層。

### `Settings` 型別與預設值搬到 round module

目前 `Settings` 由 `SettingsDialog` export。若 round module 持有 settings 狀態卻從 component import 型別，就會形成遊戲邏輯反向依賴呈現層。型別與預設值搬進 round module，`SettingsDialog` 改為 import。

`SCENARIO_IDS` 是一份 UI 下拉選單的清單，留在 `SettingsDialog` 不動。

### 不純的部分留在 component

`GameRound` 保留三件事：dialog 開關狀態（純 UI chrome，零 round 規則）、scenario 的 fetch effect、settings 的 localStorage 讀寫 effect。scenario data provider **不**注入 module——注入會讓 module 不再是純的，測試就得 stub provider 與 localStorage，與專案既有的純函式測試風格衝突。

settings 的 defaults merge 本身是純的，由 `startRound` 接收 localStorage 讀出來的未知形狀值並套上預設；component 只負責讀寫字串。build-time 的 scenario id 預設值由 component 從環境變數讀出後傳入。

### 既有的純 module 一律不動

`scoreRound`、`revealCutoff`、`swipeDeck` 維持獨立，由 round module 呼叫。三者都已有測試，且深度足夠；吸收進 round module 只會讓它變成一個什麼都做的 module，並讓既有測試失去對象。

### news swipe deck 的狀態這次不搬

deck 狀態留在它自己的 component，round module 以 `updateNews(state, ids, complete)` 接收結果。這保留了「牌組把整份選擇回吐給 parent」這個介面形狀——它本身是個已知的缺點，但拆掉它需要一併重新接上翻牌動畫的時序，屬於另一次改動。

已知代價：牌組是否翻完這件事會同時存在於 deck 與 round 兩處。

### 不影響的範圍

scenario JSON 的 schema、pipeline 的任何部分、dev settings panel 的所有既有行為，都不因這次改動而變化。這是一次純結構重構。

## Testing Decisions

好的測試在這裡的定義：呼叫 round module 的公開轉換函式，對回傳的 state 做斷言。不 render React、不碰 localStorage、不 stub fetch。專案沒有 jsdom 也不會為此引入。

既有範例即風格範本：`swipeDeck` 的測試組合數次轉換呼叫再斷言最終狀態，`scoreRound` 的測試對回傳的分數與 breakdown 做斷言。新的測試檔照抄這個形狀。

被測的 module 只有一個：新的 round module。

要寫的斷言分兩類。

**不變式**——這兩條是這次重構的核心理由，各自對應一個真實發生過或可能發生的故障：

1. `scoreRound` 接收的是完整 scenario 而非可見的那份。做法是設定一個帶 cutoff 的 scenario，其中一則 cutoff 之後的新聞是 key event，提交後斷言它出現在 missed 而不是從結果中消失。
2. 不改變可見範圍的轉換不改變 `visibleScenario` 的 identity。做法是對 `chooseDirection` 前後的 `visibleScenario` 做參考相等斷言（`toBe`，不是 `toEqual`）。

**規則**——六條目前零保護的行為，各自對應 dev settings panel spec 裡一條已明訂但無測試的決策：

3. reveal-all 壓過 manual cutoff override。
4. 空的 manual cutoff override 退回 scenario 自帶的 `revealCutoffDate`。
5. 切換 scenario id 清掉 score、新聞選擇與方向。
6. 缺少新欄位的舊 settings blob 被補上預設值。
7. 提交後可見範圍變成完整 scenario。
8. swipe 模式未翻完不可提交，list 模式可以。

不測的部分：`GameRound` 的 JSX、`SettingsDialog`、localStorage 的實際讀寫、fetch effect。這些是 I/O 與呈現，依專案慣例（component 保持輕薄、邏輯住在遊戲邏輯層）不做單元測試。

`scoreRound`、`revealCutoff`、`swipeDeck` 的既有測試不需修改。

## Out of Scope

- **把 news swipe deck 的狀態提到 round module**——已知的下一步，需要一併處理翻牌動畫的時序，另案處理。
- **架構檢視中的其他候選方案**——scenario 合約的 parse seam、pipeline 的 staging 讀取 seam、把比較結果的排版移出 CLI wiring，三者與本案互不相干。
- **`deriveCorrectDirection` 的方向門檻調整**——dev settings panel spec 已明確排除，此處沿用。
- **注入 scenario data provider**——會讓 module 失去純度，且目前只有一個實作。
- **dialog 開關狀態進入 module**——零 round 規則，是純粹的 UI chrome。
- **任何行為變更**——本案不新增、不移除、不修改任何玩家或開發者可見的行為。
- **pipeline 側的任何改動**——scenario JSON schema 完全不動。

## Further Notes

- **derived 欄位的已知代價。** `visibleScenario` 只由三個轉換重算。若日後新增第四個會影響 cutoff 或 scenario 的轉換而忘了重算，畫面會靜靜停在舊的可見集。identity 那條測試抓得到「多算」，抓不到「少算」。這是換掉 `useMemo` 的價格，接受它。
- **重複的事實。** 牌組是否翻完會同時存在於 deck 與 round，直到 deck 狀態被提上來為止。
- **這次重構的證據基礎。** `GameRound` 在最近二十五個 commit 中被改動九次，是全 repo 最高；整頁空白那次修復（hooks 順序違規）是這個 module 形狀直接造成的故障。
- **domain 詞彙。** 這次替一個既有但未命名的概念定了名——**round**。專案目前沒有 `CONTEXT.md`；是否建立並收錄 round、reveal precedence、visible scenario 這幾個詞，是一個尚未決定的獨立問題。
- **歸檔位置。** 這個 repo 沒有設定 issue tracker 與 triage 詞彙，因此本 spec 依專案自身慣例歸檔於 `.scratch/<feature>/`，而非發佈為 issue。
