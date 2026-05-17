---
id: 18-tech-box-line-reduction
phase: P3
status: todo
depends_on: [10-board-core, 11-validator, 02-test-fixtures]
assignee: null
estimated_complexity: M
acceptance:
  - "實作 TechniqueSolver 介面"
  - "通過 fixtures 中 box-line-reduction 場景"
  - "在 orchestrator 註冊清單加入此 solver"
deliverables:
  - "src/techniques/boxLineReduction.ts"
  - "src/techniques/boxLineReduction.test.ts"
  - "src/solver/orchestrator.ts (更新)"
---

# 18 — Box / Line Reduction（區塊行列消除）

## 技巧說明
與 pointing pair 相反方向：若某數字 v 在某行（或列）的候選只出現在同一宮的格子中，則該宮其他格（不在該行 / 列）不可能填 v。

## Step 輸出
- action: 'eliminate'
- targets：被消除的格（宮內、不在該行 / 列）
- related：行 / 列中候選 v 的那些格
- eliminations：[{ index, values: [v] }, ...]

## 演算法
1. 對每個 row（9 個）、每個 col（9 個）：
2. 對每個數字 v ∈ {1..9}：
3. 找出 row（或 col）中候選含 v 的空格
4. 若全部在同一宮 → 該宮其他格（不在 row/col）若候選含 v，加入消除

## 中文說明範例
> 在 R4 行中，6 只能填在 R4C7 與 R4C9，皆位於第 6 宮。因此第 6 宮其他格（不在 R4）不可能填 6。

## 測試
- fixture box-line-reduction-01/02/03 通過
- row→box 與 col→box 兩種方向各至少 1 個測試

## 完工條件
- `pnpm test` 全綠
