---
id: 53-tech-x-wing
phase: P5
status: todo
depends_on: [50-contract-and-uniqueness, 10-board-core, 11-validator]
assignee: null
estimated_complexity: M
acceptance:
  - "實作 TechniqueSolver 介面，meta.id = 'x-wing'"
  - "可偵測 row-based X-Wing（兩列、各兩欄）與 col-based X-Wing（兩欄、各兩列）"
  - "正確產生 action='eliminate' 的 step"
  - "explanation 為繁體中文，標出數字 + 兩列/兩欄 + 矩形四角"
  - "新增 src/techniques/xWing.test.ts，含 row-based / col-based 各 1 案例 + negative"
  - "pnpm typecheck + pnpm test src/techniques/xWing.test.ts 全綠"
  - "**不動** orchestrator.ts（註冊由 T56 整合任務處理）"
deliverables:
  - "src/techniques/xWing.ts"
  - "src/techniques/xWing.test.ts"
---

# 53 — X-Wing（雙線矩形）

## 技巧說明
對某數字 d：
- **Row-based**：若兩列中 d 恰好只能填在「相同的兩欄」（每列各 2 個位置），則這兩欄中其他列若有候選 d 可消去
- **Col-based**：對偶，兩欄中 d 恰好只能在相同的兩列 → 這兩列其他欄的 d 候選可消去

## Step 輸出
- action: `'eliminate'`
- targets：被消除的格
- related：X-Wing 四個矩形角
- eliminations：其他列/欄中含 d 的格

## 演算法
```
對每個數字 d ∈ 1..9：
  // Row-based
  rowCandPos[r] = 列 r 中候選含 d 的欄 index 集合
  收集 rowsWithTwo = { r : rowCandPos[r].size === 2 }
  對 rowsWithTwo 中所有 (r1, r2) 配對：
    if rowCandPos[r1] === rowCandPos[r2] （兩欄相同）:
      cols = rowCandPos[r1]
      eliminations = 對 cols 中每欄 c，收集 c 欄 r1,r2 以外列中候選含 d 的格
      若 eliminations 非空 → 回傳 step
  // Col-based 對偶
  colCandPos[c] = ...
  ...
```

## 中文說明範例
> 數字 4 在 R2 列只能填在 C3、C7，在 R5 列也只能填在 C3、C7。因此 R2C3、R2C7、R5C3、R5C7 四格中必有兩個是 4（每列一個），同時佔據 C3 與 C7 欄的 4。其他列在 C3、C7 的候選可消去 4。

## 注意事項
- 必須恰好 2 個位置；3 個位置以上不是 X-Wing
- row-based 與 col-based 是對偶，但實作上分開掃以利測試
- 「兩欄相同」用 Set 比較：`a.size === b.size && [...a].every(x => b.has(x))`

## 測試
- row-based 案例：手構盤面 R2、R5 在數字 4 上只剩 C3、C7
- col-based 案例：對偶
- negative：兩列 d 都是 2 格但欄不同 → return null
- negative：找到了但沒可消去 → return null

## 不做
- 不註冊 orchestrator（T56）
- Finned X-Wing / Sashimi 不在範圍

## 完工
- 跑 `pnpm typecheck` + `pnpm test src/techniques/xWing.test.ts` 全綠
