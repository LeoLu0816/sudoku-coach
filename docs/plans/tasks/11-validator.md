---
id: 11-validator
phase: P1
status: todo
depends_on: [01-shared-types, 10-board-core]
assignee: null
estimated_complexity: S
acceptance:
  - "可偵測 row/col/box 衝突"
  - "可計算所有空格的合法候選數"
  - "可判斷盤面是否合法（解出）"
  - "test coverage > 90%"
deliverables:
  - "src/core/validator.ts"
  - "src/core/validator.test.ts"
---

# 11 — 規則驗證

## 目標
數獨規則檢查與候選數計算，是所有解題技巧的基礎工具。

## API 規格

```ts
/** 取得單格的合法候選（排除同 peer 中已存在的值） */
getLegalCandidates(board: Board, index: CellIndex): Set<number>;

/** 重新計算所有空格的候選數，回傳新 Board */
recomputeAllCandidates(board: Board): Board;

/** 偵測所有衝突 */
findConflicts(board: Board): Conflict[];

/** 是否有任何衝突 */
hasConflicts(board: Board): boolean;

/** 盤面是否完成且合法（贏的條件） */
isSolved(board: Board): boolean;

/** 單格放某值是否合法 */
isPlacementLegal(board: Board, index: CellIndex, value: number): boolean;
```

## 實作要點
- `getLegalCandidates`：對 cell 的 peers（同行+同列+同宮）取出所有 value > 0 的值，從 {1..9} 扣掉
- `findConflicts`：對每個 unit（9 行 + 9 列 + 9 宮）檢查同值出現 > 1 次的格
- `recomputeAllCandidates`：對每個空格呼叫 `getLegalCandidates`，回傳新 Board

## 測試項目
- 空盤所有格候選 = {1..9}
- 一格填 5 → 同 peer 候選不含 5
- 同行有兩個 5 → `findConflicts` 回兩格
- 已知合法完整解 → `isSolved` = true、`hasConflicts` = false
- 完整但含衝突 → `isSolved` = false

## 完工條件
- API 完成、註解齊備、`pnpm test` 全綠
