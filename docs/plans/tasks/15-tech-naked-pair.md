---
id: 15-tech-naked-pair
phase: P3
status: todo
depends_on: [10-board-core, 11-validator, 02-test-fixtures]
assignee: null
estimated_complexity: M
acceptance:
  - "實作 TechniqueSolver 介面"
  - "通過 fixtures 中 naked-pair 場景"
  - "可在 row/col/box 三種 unit 偵測"
  - "在 21-orchestrator 註冊清單加入此 solver"
deliverables:
  - "src/techniques/nakedPair.ts"
  - "src/techniques/nakedPair.test.ts"
  - "src/solver/orchestrator.ts (更新)"
---

# 15 — Naked Pair（裸對）

## 技巧說明
若某 unit 中有兩格的候選都恰好是同樣的兩個數字 {a, b}，那麼該 unit 其他格不可能填 a 或 b（可從候選中消除）。

## Step 輸出
- action: 'eliminate'
- targets：被消除候選的格
- related：那兩格 naked pair
- eliminations：[{ index, values: [a, b] }, ...]

## 演算法
1. 對每個 unit（27 個）：
2. 收集 unit 中所有「候選恰好 2 個」的格
3. 兩兩配對檢查：兩格候選相同？
4. 若是 → 對 unit 其他格中含 a 或 b 的候選消除，產生 step

## 中文說明範例
> 在第 5 宮中，R5C4 與 R6C5 的候選都只剩 {2, 8}，因此這兩個位置之一必為 2，另一必為 8。同宮其他格的候選可消去 2 與 8。

## 測試
- fixtures naked-pair-01/02/03 → 輸出與 expectedStep 一致
- 同 unit 三格候選都是 {a,b} → 仍可偵測（取前兩）

## 註冊
更新 `src/solver/orchestrator.ts` 註冊清單，於 hidden-single 之後加入。

## 完工條件
- `pnpm test` 全綠
- orchestrator 測試也通過（含 P3 fixture 一題用 naked-pair 解出）
