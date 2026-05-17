---
id: 30-ui-board
phase: P2
status: todo
depends_on: [01-shared-types, 10-board-core]
assignee: null
estimated_complexity: M
acceptance:
  - "9x9 棋盤可正確渲染"
  - "支援點擊選格、鍵盤方向鍵移動"
  - "同數字 / 同行列宮高亮"
  - "衝突顯示（紅色）"
  - "候選數小字顯示"
  - "Vue Test Utils 元件測試通過"
deliverables:
  - "src/ui/SudokuBoard.vue"
  - "src/ui/SudokuBoard.test.ts"
---

# 30 — 棋盤 UI 元件

## 目標
9x9 數獨棋盤元件，純展示 + 互動，不含遊戲邏輯（邏輯由 store 處理）。

## Props

```ts
interface Props {
  board: Board;
  selectedIndex: CellIndex | null;
  conflicts: Conflict[];
  /** 是否顯示候選數 */
  showCandidates: boolean;
}
```

## Emits

```ts
emit('selectCell', index: CellIndex)
emit('keyInput', { index: CellIndex, key: string })  // 鍵盤輸入時轉發給上層
```

## 視覺規格
- 9x9 grid，每 3x3 宮有粗框分隔
- 格子尺寸：固定 50px 或自適應視窗（以較小者）
- 給定數字：粗體黑色
- 玩家填入：藍色
- 候選數：小字（11px）佈於格內 3x3 微網格
- 高亮：
  - 選中格：藍色背景
  - 同行/列/宮：淺藍背景
  - 與選中格同值的其他格：黃色背景
  - 衝突格：紅色背景 + 紅字
- 響應式：手機螢幕自適應

## 互動
- 點擊格子 → emit `selectCell`
- 鍵盤方向鍵：移動選中格（上層接 emit 處理）
- 數字鍵 1-9 / 退格：emit `keyInput`，由父元件決定填入 / 鉛筆

## 測試項目（Vue Test Utils）
- mount 元件 → 9x9 = 81 個格子 DOM
- 給定 board.given 的格有 `.is-given` class
- 點選格 → emit `selectCell` 正確 index
- 衝突格有 `.is-conflict` class
- 選中格高亮對應 peer 格

## 完工條件
- 元件 + 測試完成
- 不依賴任何 store（純 prop-driven）
