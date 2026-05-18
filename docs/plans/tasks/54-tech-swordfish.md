---
id: 54-tech-swordfish
phase: P5
status: todo
depends_on: [50-contract-and-uniqueness, 10-board-core, 11-validator]
assignee: null
estimated_complexity: M
acceptance:
  - "實作 TechniqueSolver 介面，meta.id = 'swordfish'"
  - "可偵測 row-based 與 col-based Swordfish（3×3 結構）"
  - "正確產生 action='eliminate' 的 step"
  - "explanation 為繁體中文，標出數字 + 三列/三欄 + 九角"
  - "新增 src/techniques/swordfish.test.ts，含 row-based / col-based 各 1 案例 + negative"
  - "pnpm typecheck + pnpm test src/techniques/swordfish.test.ts 全綠"
  - "**不動** orchestrator.ts（註冊由 T56 整合任務處理）"
deliverables:
  - "src/techniques/swordfish.ts"
  - "src/techniques/swordfish.test.ts"
---

# 54 — Swordfish（劍魚）

## 技巧說明
X-Wing 的 3×3 推廣：對數字 d，若三列各自候選 d 只在 ≤3 個欄中、且這三列候選 d 的欄聯集恰為 3 欄 → 這三欄其他列的 d 可消去（col-based 對偶）。

## Step 輸出
- action: `'eliminate'`
- targets：被消除的格
- related：Swordfish 結構中所有候選 d 的格
- eliminations：三欄其他列中含 d 的格

## 演算法
```
對每個 d ∈ 1..9：
  // Row-based
  candRows = { r : 1 <= rowCandPos[r].size <= 3 }
  對 candRows 所有 3 列組合 (r1, r2, r3)：
    colsUnion = rowCandPos[r1] ∪ rowCandPos[r2] ∪ rowCandPos[r3]
    if colsUnion.size === 3:
      eliminations = 三欄中 r1,r2,r3 以外列含 d 的格
      若 eliminations 非空 → 回傳 step
  // Col-based 對偶
```

## 中文說明範例
> 數字 5 在 R1、R4、R6 三列分別只能填在 {C2,C5}、{C2,C8}、{C5,C8} 中，欄聯集恰為 {C2, C5, C8}。這三欄的 5 必落在這三列。其他列在 C2、C5、C8 的候選可消去 5。

## 注意事項
- 每列候選 d 的位置數可為 2 或 3（不一定全是 3）
- 排除「3 列聯集 = 2 欄」（那是退化的 X-Wing）→ 嚴格要求聯集大小 === 3
- 組合 C(9,3)=84，× 9 digit × 2 方向 = 1512 次，可接受

## 測試
- row-based 經典案例（如上述 R1/R4/R6 → C2/C5/C8）
- col-based 對偶
- negative：聯集為 4 欄 → return null
- negative：聯集為 2 欄 → return null（退化）
- negative：找到結構但其他列無 elim → return null

## 不做
- Finned / Sashimi 不在範圍
- 不註冊 orchestrator（T56）

## 完工
- 跑 `pnpm typecheck` + `pnpm test src/techniques/swordfish.test.ts` 全綠
