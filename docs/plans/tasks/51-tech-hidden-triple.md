---
id: 51-tech-hidden-triple
phase: P5
status: todo
depends_on: [50-contract-and-uniqueness, 10-board-core, 11-validator]
assignee: null
estimated_complexity: M
acceptance:
  - "實作 TechniqueSolver 介面，meta.id = 'hidden-triple'"
  - "可在 row/col/box 三種 unit 偵測"
  - "正確產生 action='eliminate' 的 step（不做 placements）"
  - "explanation 為繁體中文，明確標出三個數字與三格位置"
  - "新增 src/techniques/hiddenTriple.test.ts，含 row/col/box 各 1 案例 + negative 案例（無 hidden triple 時 return null）"
  - "pnpm typecheck + pnpm test src/techniques/hiddenTriple.test.ts 全綠"
  - "**不動** orchestrator.ts（註冊由 T56 整合任務處理）"
deliverables:
  - "src/techniques/hiddenTriple.ts"
  - "src/techniques/hiddenTriple.test.ts"
---

# 51 — Hidden Triple（隱三）

## 技巧說明
若某 unit（row / col / box）中存在三個數字 {a, b, c}，它們只能填入該 unit 內的同三格（每個數字至少在這三格中之一，且這三個數字在這三格以外不出現），則這三格的候選可只保留 {a, b, c}（消去其他候選）。

## Step 輸出
- action: `'eliminate'`
- targets：那三格 cell index
- related：unit 中其他空格 index（UI 高亮用）
- eliminations：對每一格列出要消除的候選（即該格現有候選 - {a, b, c}）

## 演算法
```
對每個 unit（27 個）：
  收集 unit 內所有「空格」cells
  對所有 unit 中 1..9 的數字，建構 digitPositions[d] = unit 中候選含 d 的格 index 集合
  對所有 1..9 的三元組 (a, b, c)：
    union = digitPositions[a] ∪ digitPositions[b] ∪ digitPositions[c]
    if union.size === 3:
      三格 = union
      eliminations = 對三格中每格，若候選有 {a,b,c} 以外的數字 → 列入
      若 eliminations 非空 → 回傳 step
```

## 中文說明範例
> 在第 5 宮中，數字 {2, 5, 8} 只能填在 R4C5、R5C4、R6C6 這三格，因此這三格的候選可僅保留 {2, 5, 8}，其他候選可消去。

## 注意事項
- 若三格候選本來就只剩 {a, b, c}（無可消去）→ 不算 hidden triple step（沒有 eliminations）→ 不回傳 step（避免空 step）
- 應該優先回傳「能造成最多消去」的，但實作上找到第一個即可（與既有 hidden-pair 風格一致）
- 三元組列舉用 nested loop 即可（C(9,3) = 84，× 27 unit = 2268 次，可接受）

## 測試
- row hidden triple：建構盤面，row 中三格候選為 {2,5,8}/{2,8,9}/{5,8,9}（含其他干擾候選），預期消去多餘
- col hidden triple
- box hidden triple
- negative：手寫一個沒有 hidden triple 的盤面 → return null
- 三格候選已收斂到 {a,b,c} 時 → return null（無 elim）

## 不做
- 不註冊到 orchestrator（T56 整合）
- 不改 fixtures（如需測試用 fixture，inline 在 test 檔內建構 board 即可，避免動 02-test-fixtures）
- 不擴 TechniqueId（T50 已處理）

## 完工
- 跑 `pnpm typecheck` + `pnpm test src/techniques/hiddenTriple.test.ts` 全綠
- 回報用 dispatch report 範本（見 master plan §七）
