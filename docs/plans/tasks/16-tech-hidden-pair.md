---
id: 16-tech-hidden-pair
phase: P3
status: todo
depends_on: [10-board-core, 11-validator, 02-test-fixtures]
assignee: null
estimated_complexity: M
acceptance:
  - "實作 TechniqueSolver 介面"
  - "通過 fixtures 中 hidden-pair 場景"
  - "在 orchestrator 註冊清單加入此 solver"
deliverables:
  - "src/techniques/hiddenPair.ts"
  - "src/techniques/hiddenPair.test.ts"
  - "src/solver/orchestrator.ts (更新)"
---

# 16 — Hidden Pair（隱對）

## 技巧說明
若某 unit 中有兩個數字 {a, b} 只能填在同樣的兩格，那兩格的其他候選可消除（只保留 a, b）。

## Step 輸出
- action: 'eliminate'
- targets：那兩格
- related：unit 其他格（推理出 a/b 只能在這兩格的依據）
- eliminations：targets 中除了 a, b 外的所有候選

## 演算法
1. 對每個 unit：
2. 對每個數字組合 (a, b)：
3. 找出 unit 中候選含 a 的格集合 S_a、含 b 的格集合 S_b
4. 若 S_a === S_b 且大小 === 2，且這兩格還有除 a, b 以外的候選 → 產生 step

## 中文說明範例
> 在 R3 行中，5 與 7 只能填在 R3C2 與 R3C8 兩格。因此這兩格只可能是 5 或 7，可消去其他候選。

## 測試
- fixture hidden-pair-01/02/03 通過
- row、col、box 各至少 1 個測試

## 註冊
更新 orchestrator 註冊清單，於 naked-pair 之後加入。

## 完工條件
- `pnpm test` 全綠
