---
id: 19-tech-naked-triple
phase: P3
status: todo
depends_on: [10-board-core, 11-validator, 02-test-fixtures]
assignee: null
estimated_complexity: M
acceptance:
  - "實作 TechniqueSolver 介面"
  - "通過 fixtures 中 naked-triple 場景"
  - "在 orchestrator 註冊清單加入此 solver"
deliverables:
  - "src/techniques/nakedTriple.ts"
  - "src/techniques/nakedTriple.test.ts"
  - "src/solver/orchestrator.ts (更新)"
---

# 19 — Naked Triple（裸三）

## 技巧說明
若某 unit 中三格的候選集合**聯集**恰好是同樣的三個數字 {a, b, c}（每格候選為 {a,b,c} 的子集且 size 2 或 3），則該 unit 其他格不能填 a/b/c。

## Step 輸出
- action: 'eliminate'
- targets：被消除候選的格
- related：那三格 naked triple
- eliminations：[{ index, values: [可能的 a/b/c 子集] }, ...]

## 演算法
1. 對每個 unit：
2. 收集 unit 中所有「候選 size 為 2 或 3」的格 → S
3. 對 S 取三組合 (i, j, k)：
4. 三格候選的聯集 size === 3 → 視為 naked triple
5. 對 unit 其他格的候選消除聯集中的數字

## 中文說明範例
> 在 R7 行中，R7C2、R7C5、R7C8 的候選為 {2,7}、{2,5,7}、{5,7}，三者聯集 = {2,5,7}。因此這三格之內必填 2、5、7，R7 其他格不可能填這三個數字。

## 測試
- fixture naked-triple-01/02/03 通過
- 包含「三格皆 size=3」、「混合 size=2 與 size=3」兩種情境

## 完工條件
- `pnpm test` 全綠
