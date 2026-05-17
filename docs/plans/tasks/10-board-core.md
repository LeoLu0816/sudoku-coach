---
id: 10-board-core
phase: P1
status: todo
depends_on: [01-shared-types]
assignee: null
estimated_complexity: M
acceptance:
  - "提供 Board 建立、複製、查詢、操作的純函式 API"
  - "所有操作不就地修改原 Board（immutable）"
  - "test coverage > 90%"
deliverables:
  - "src/core/board.ts"
  - "src/core/board.test.ts"
---

# 10 — 棋盤資料結構

## 目標
提供 `Board` 的建立與基本操作純函式，所有其他模組對 Board 的操作都走這個 API。

## API 規格

```ts
// 建立
createEmptyBoard(): Board
createBoardFromGiven(given: CellValue[]): Board  // length 必須 81
cloneBoard(board: Board): Board

// 查詢（純函式）
getCell(board: Board, index: CellIndex): Cell
getRowCells(board: Board, row: number): Cell[]   // 9 格
getColCells(board: Board, col: number): Cell[]   // 9 格
getBoxCells(board: Board, box: number): Cell[]   // 9 格
getUnitCells(board: Board, unit: UnitType, index: number): Cell[]
getPeers(board: Board, index: CellIndex): Cell[] // 同行+同列+同宮共 20 格（去重）
getEmptyCells(board: Board): Cell[]
isComplete(board: Board): boolean                // 所有格都填了

// 操作（回傳新 Board）
setCellValue(board: Board, index: CellIndex, value: CellValue): Board
toggleCandidate(board: Board, index: CellIndex, value: number): Board
setCandidates(board: Board, index: CellIndex, candidates: Set<number>): Board
clearCell(board: Board, index: CellIndex): Board

// 工具
indexToRowCol(index: CellIndex): { row: number; col: number }
rowColToIndex(row: number, col: number): CellIndex
indexToBox(index: CellIndex): number
```

## 設計原則
- **Immutable**：所有 setter 回傳新 Board；不修改入參
- **Box 編號**：`box = floor(row/3)*3 + floor(col/3)`（row-major：上→下、左→右，0..8）
- **isGiven**：`createBoardFromGiven` 中非 0 格全標為 `isGiven=true`
- **效能**：clone 用淺複製 cells 陣列 + 對改動的 cell 做深複製（避免每次全 81 格深 copy）

## 測試項目
- 從 81 字串建 Board → 每格 row/col/box 正確
- `getPeers(40)` 回傳 20 個正確 index（4列4行 + 中間宮 4 格，去重）
- `setCellValue` 不影響原 Board
- `toggleCandidate` 切換邏輯正確
- `isComplete` 全填回 true，留空回 false

## 完工條件
- 全部 API 實作完成、註解齊備
- `pnpm test src/core/board.test.ts` 全綠
- coverage > 90%
