---
id: 52-tech-naked-quad
phase: P5
status: todo
depends_on: [50-contract-and-uniqueness, 10-board-core, 11-validator]
assignee: null
estimated_complexity: M
acceptance:
  - "實作 TechniqueSolver 介面，meta.id = 'naked-quad'"
  - "可在 row/col/box 三種 unit 偵測"
  - "正確產生 action='eliminate' 的 step"
  - "explanation 為繁體中文，明確標出四格與聯合候選 {a,b,c,d}"
  - "新增 src/techniques/nakedQuad.test.ts，含 row/col/box 各 1 案例 + negative 案例"
  - "pnpm typecheck + pnpm test src/techniques/nakedQuad.test.ts 全綠"
  - "**不動** orchestrator.ts（註冊由 T56 整合任務處理）"
deliverables:
  - "src/techniques/nakedQuad.ts"
  - "src/techniques/nakedQuad.test.ts"
---

# 52 — Naked Quad（裸四）

## 技巧說明
若某 unit 中存在四格，其候選聯集恰為 {a, b, c, d}（即每格候選都是 {a,b,c,d} 的子集），則該 unit 其他格中含 a/b/c/d 的候選可消去。

## Step 輸出
- action: `'eliminate'`
- targets：被消除候選的格（不含那四格本身）
- related：那四格 naked quad
- eliminations：unit 其他格中含 {a,b,c,d} 任一者的候選

## 演算法
```
對每個 unit：
  candidates = unit 中候選大小介於 2..4 的空格
  對 candidates 中所有 4 格組合：
    union = 四格候選聯集
    if union.size === 4:
      四格 = combination
      eliminations = unit 其他空格中含 union 任一數字者
      若 eliminations 非空 → 回傳 step
```

## 中文說明範例
> 在 R5 列中，R5C1、R5C3、R5C7、R5C9 的候選聯集恰為 {1, 4, 6, 9}，這四格必對應這四個數字。同列其他空格的候選可消去 1、4、6、9。

## 注意事項
- 候選大小限制在 2..4 之間：候選 = 1 的格屬於 naked single（既有技巧），不納入；候選 > 4 不可能屬於 naked quad
- 與 hidden triple 對偶：演算法結構不同，但結果有時等價
- 組合數 C(<=9, 4) = 最多 126，× 27 unit = 3402，可接受

## 測試
- row / col / box naked quad 各 1 案例
- negative：4 格但聯集為 5 個數字 → return null
- negative：4 格候選 ⊆ {a,b,c,d} 但其他格沒任何 elim → return null

## 不做
- 不註冊 orchestrator（T56）
- 不改 fixtures（inline build board）

## 完工
- 跑 `pnpm typecheck` + `pnpm test src/techniques/nakedQuad.test.ts` 全綠
