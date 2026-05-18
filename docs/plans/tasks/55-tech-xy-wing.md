---
id: 55-tech-xy-wing
phase: P5
status: todo
depends_on: [50-contract-and-uniqueness, 10-board-core, 11-validator]
assignee: null
estimated_complexity: M
acceptance:
  - "實作 TechniqueSolver 介面，meta.id = 'xy-wing'"
  - "正確識別 pivot + 兩 wing 的 XY-Wing 結構"
  - "正確產生 action='eliminate' 的 step（消去 Z 候選於兩 wing 共同 peer）"
  - "explanation 為繁體中文，標出 pivot {X,Y}、wing1 {X,Z}、wing2 {Y,Z}、被消去格"
  - "新增 src/techniques/xyWing.test.ts，含至少 2 案例 + negative"
  - "pnpm typecheck + pnpm test src/techniques/xyWing.test.ts 全綠"
  - "**不動** orchestrator.ts（註冊由 T56 整合任務處理）"
deliverables:
  - "src/techniques/xyWing.ts"
  - "src/techniques/xyWing.test.ts"
---

# 55 — XY-Wing（XY 樞紐）

## 技巧說明
三個 bivalue cell（恰好 2 候選）：
- pivot 候選為 {X, Y}
- wing1 候選為 {X, Z}，與 pivot 是 peer（共享 row/col/box）
- wing2 候選為 {Y, Z}，與 pivot 是 peer

則無論 pivot = X 或 Y，wing1 或 wing2 中必有一格 = Z。**兩 wing 的共同 peer（不包含三格本身）中含 Z 的候選可消去**。

## Step 輸出
- action: `'eliminate'`
- targets：被消去 Z 的格
- related：[pivot, wing1, wing2]
- eliminations：targets 中每格消去 [Z]

## 演算法
```
bivalues = 所有候選大小 === 2 的空格
對 bivalues 中每個 pivot {X, Y}：
  pivotPeers = getPeers(pivot)（不含自己）
  candidateWings = pivotPeers 中也是 bivalue 的
  對 candidateWings 中每對 (w1, w2)：
    分析：是否存在 X,Y,Z 使得 pivot={X,Y}, w1={X,Z}, w2={Y,Z}?
      pivot ∪ w1 ∪ w2 = {X, Y, Z}（聯集大小 3）
      每個 cell 候選大小 = 2
      pivot ∩ w1 = {X}（1 個共同數）
      pivot ∩ w2 = {Y}（1 個共同數）
      w1 ∩ w2 = {Z}（1 個共同數）
      X ≠ Y ≠ Z
    若成立：
      共同 peer = getPeers(w1) ∩ getPeers(w2) - {pivot, w1, w2}
      eliminations = 共同 peer 中候選含 Z 的格
      若 eliminations 非空 → 回傳 step
```

> 注意：w1 與 w2 之間**不需要**互為 peer（XY-Wing 與 W-Wing 的差別）。

## 中文說明範例
> R5C3 候選為 {2,6}（樞紐），R6C3 候選為 {2,3}（wing1），R5C8 候選為 {3,6}（wing2）。三格的候選聯集為 {2,3,6}：若 R5C3 = 2 則 R6C3 = 3；若 R5C3 = 6 則 R5C8 = 3。無論如何 wing 之一為 3。R6C3 與 R5C8 的共同 peer 中含 3 的候選可消去。

## 注意事項
- 三個 cell 都必須是 bivalue（候選大小恰 2）
- pivot 同時與 w1、w2 是 peer；w1、w2 可以也是彼此 peer（不影響結果）
- 同一個候選結構可能被找到多次（pivot 角色互換）→ 找到第一個有 elim 即回傳
- helper：`getPeers(board, index)` 既有，回傳該格所有 peer cells

## 測試
- 經典案例 1：pivot+w1+w2 在不同 row/col/box，有 1 個 elim
- 經典案例 2：pivot+w1 同 row，pivot+w2 同 box
- negative：三格候選聯集 > 3 個數字 → return null
- negative：找到結構但共同 peer 無 Z 候選 → return null

## 不做
- XYZ-Wing / W-Wing 不在範圍（5B 才考慮）
- 不註冊 orchestrator（T56）

## 完工
- 跑 `pnpm typecheck` + `pnpm test src/techniques/xyWing.test.ts` 全綠
