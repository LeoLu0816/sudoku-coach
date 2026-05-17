---
id: 40-store-game
phase: P2
status: todo
depends_on: [10-board-core, 11-validator, 21-solver-orchestrator, 22-puzzle-generator]
assignee: null
estimated_complexity: M
acceptance:
  - "Pinia store 提供完整遊戲狀態與 actions"
  - "支援 undo/redo（歷史堆疊）"
  - "可呼叫 orchestrator 取得提示"
  - "store test 通過"
deliverables:
  - "src/stores/game.ts"
  - "src/stores/game.test.ts"
---

# 40 — 遊戲狀態 store

## 目標
集中管理遊戲狀態：當前盤面、選中格、模式、歷史、提示等。

## State

```ts
interface GameState {
  puzzle: Puzzle | null;
  board: Board | null;
  selectedIndex: CellIndex | null;
  pencilMode: boolean;
  autoCandidates: boolean;
  history: Board[];        // undo 堆疊
  future: Board[];         // redo 堆疊
  currentHint: TechniqueStep | null;
}
```

## Getters

```ts
conflicts: Conflict[]
isSolved: boolean
canUndo: boolean
canRedo: boolean
remainingCounts: number[]  // 各數字剩餘可填數量
```

## Actions

```ts
async newGame(difficulty: Difficulty): void
selectCell(index: CellIndex): void
inputNumber(value: number): void   // 依 pencilMode 處理：填值 or 切換候選
clearCell(): void
undo(): void
redo(): void
togglePencil(): void
toggleAutoCandidates(): void
requestHint(): void                // 呼 orchestrator.nextHintStep
applyHint(): void                  // 套用 currentHint 到 board
clearHint(): void
```

## 設計要點
- 每次改 board → push 舊 board 到 history，清空 future
- undo：history pop → 推到 future
- redo：future pop → 推到 history
- 給定 cell 不可被編輯（input 與 clear 都檢查 isGiven）
- `autoCandidates=true` 時，inputNumber 後自動 recomputeAllCandidates
- `inputNumber` 與既有同值衝突時：可選擇拒絕或允許（建議：允許，由衝突顯示告知玩家）

## 測試
- newGame → puzzle 與 board 載入正確
- inputNumber 在非鉛筆模式 → 填值；鉛筆模式 → toggle 候選
- undo / redo 序列正確
- isGiven 格嘗試清除 → 不變
- requestHint 後 currentHint 有值；applyHint 後 board 改變

## 完工條件
- store + 測試完成
