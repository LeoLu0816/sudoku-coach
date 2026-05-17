---
id: 20-solver-backtrack
phase: P1
status: done
depends_on: [10-board-core, 11-validator]
assignee: claude-code
completed_at: 2026-05-17
estimated_complexity: M
acceptance:
  - "可解任何有解的數獨（在合理時間內，<100ms 簡單級 / <1s 困難級）"
  - "可偵測題目是否唯一解（多解 / 無解）"
  - "test 覆蓋唯一解、多解、無解三種情境"
deliverables:
  - "src/solver/backtrack.ts"
  - "src/solver/backtrack.test.ts"
---

# 20 — 暴力回溯解題器（Fallback Solver）

## 目標
保底解題：當技巧層解不出時，用 DFS + 回溯找答案。也用於生成器驗證題目唯一解。

## API

```ts
/** 回傳一個解（找到第一個就停） */
solve(board: Board): Board | null;

/** 計數解的數量，最多計到 limit；用於唯一性檢查 */
countSolutions(board: Board, limit?: number): number;
```

## 演算法
- 經典 DFS + 回溯：
  1. 找候選最少的空格（MRV：Minimum Remaining Values 啟發式，效能關鍵）
  2. 對每個候選嘗試填入 → 遞迴
  3. 若衝突 / 無候選 → 回溯
- `countSolutions(board, 2)`：找到 2 個解就停（判唯一解夠用）

## 注意
- 此 solver **不產生** TechniqueStep，因為對學習無意義
- 在 orchestrator 中，這是最後 fallback
- 不可使用此 solver 計算難度（難度由技巧分布決定）

## 測試項目
- 解 fixture 中所有 puzzle（含專家級）→ 結果與 fixture.solution 一致
- 對「有解的空盤 + 1 格給定」→ `countSolutions(_, 2) >= 2`
- 對含矛盾的盤 → `solve` 回 null、`countSolutions` 回 0
- 對 fixture 唯一解題目 → `countSolutions(_, 2) === 1`

## 效能基準
- 簡單 / 中等：< 100ms
- 困難 / 專家：< 1000ms

## 完工條件
- `pnpm test` 全綠且效能基準達標
