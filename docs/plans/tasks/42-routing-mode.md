---
id: 42-routing-mode
phase: P2
status: todo
depends_on: [30-ui-board, 31-ui-numberpad, 32-ui-controlpanel, 33-ui-hint-overlay, 40-store-game]
assignee: null
estimated_complexity: M
acceptance:
  - "三條路由：/play、/observe、/analyze"
  - "/play 為 MVP 完整遊戲頁面（整合棋盤 + 數字盤 + 控制 + 提示）"
  - "其他兩條先放佔位（P3/P4 填）"
  - "可從首頁切換模式"
  - "整合測試：完整玩一局簡單題到完成"
deliverables:
  - "src/router/index.ts"
  - "src/views/HomeView.vue"
  - "src/views/PlayView.vue"
  - "src/views/ObserveView.vue"
  - "src/views/AnalyzeView.vue"
  - "tests/integration/play-flow.test.ts"
---

# 42 — 路由與模式切換（MVP 整合點）

## 目標
這是 P2 的整合任務：把所有 UI + store 組起來，做成可玩的遊戲模式。

## 路由表

| Path | View | 階段 |
|---|---|---|
| `/` | HomeView | P2 |
| `/play` | PlayView | P2 |
| `/observe` | ObserveView | P3（先放佔位） |
| `/analyze` | AnalyzeView | P4（先放佔位） |

## HomeView
- 標題、簡介
- 三大模式按鈕：「玩」「觀摩學習」「分析盤面」
- 點擊跳對應路由

## PlayView（MVP 核心整合頁）
布局：

```
┌─────────────────────────┐
│ Header: 難度 + 新局      │
├──────────────┬──────────┤
│              │ Hint     │
│ SudokuBoard  │ Overlay  │
│              │          │
├──────────────┴──────────┤
│ NumberPad               │
├─────────────────────────┤
│ ControlPanel            │
└─────────────────────────┘
```

整合邏輯：
- `gameStore.board` → SudokuBoard.board
- `gameStore.selectedIndex` → SudokuBoard.selectedIndex
- `gameStore.conflicts` → SudokuBoard.conflicts
- SudokuBoard emit `selectCell` → gameStore.selectCell
- NumberPad emit `number` → gameStore.inputNumber
- ControlPanel emit `hint` → gameStore.requestHint → currentHint 變化
- 提示產生時 → 將 step.targets/related 傳給 SudokuBoard 做高亮（額外 prop `hintHighlight`，需 30 元件擴充支援）
- 解完 → 彈出「恭喜」+「再來一局」

> 注意：若 SudokuBoard 已完成但未支援 hintHighlight prop，本任務可協調修改 30 的元件 API（需更新 plan 與型別）。

## 測試（整合測試）
`tests/integration/play-flow.test.ts`：
- 啟動 → 開新局（easy）
- 模擬點擊填數字 → 棋盤更新
- 點提示 → currentHint 有值，棋盤對應格高亮
- 套用提示 → 棋盤更新
- 連續套用提示直到解完 → 顯示成功狀態

## 完工條件
- 全部 P2 整合驗收項通過（見主 plan §九）
