---
id: 17-tech-pointing-pair
phase: P3
status: todo
depends_on: [10-board-core, 11-validator, 02-test-fixtures]
assignee: null
estimated_complexity: M
acceptance:
  - "實作 TechniqueSolver 介面"
  - "通過 fixtures 中 pointing-pair 場景"
  - "在 orchestrator 註冊清單加入此 solver"
deliverables:
  - "src/techniques/pointingPair.ts"
  - "src/techniques/pointingPair.test.ts"
  - "src/solver/orchestrator.ts (更新)"
---

# 17 — Pointing Pair（指向對）

## 技巧說明
若某數字 v 在某宮中的候選只出現在同一行（或同一列）的 2-3 格，則該行（或列）的宮外其他格不可能填 v。

## Step 輸出
- action: 'eliminate'
- targets：被消除的格（宮外的同行 / 同列）
- related：宮內候選 v 的那 2-3 格
- eliminations：[{ index, values: [v] }, ...]

## 演算法
1. 對每個 box（9 個）：
2. 對每個數字 v ∈ {1..9}：
3. 找出 box 中候選含 v 的格
4. 若全部在同一行 → row 中其他格（box 外）若候選含 v，加入消除
5. 若全部在同一列 → col 中其他格（box 外）若候選含 v，加入消除

## 中文說明範例
> 在第 1 宮中，3 只能填在 R1C1 或 R1C3，皆位於第 1 行。因此第 1 行的宮外其他格不可能填 3。

## 測試
- fixture pointing-pair-01/02/03 通過
- row 與 col 兩種 pointing 各至少 1 個測試

## 完工條件
- `pnpm test` 全綠
