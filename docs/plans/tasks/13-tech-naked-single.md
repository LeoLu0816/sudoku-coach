---
id: 13-tech-naked-single
phase: P1
status: todo
depends_on: [10-board-core, 11-validator, 02-test-fixtures]
assignee: null
estimated_complexity: S
acceptance:
  - "實作 TechniqueSolver 介面"
  - "通過 fixtures 中所有 naked-single 場景"
  - "輸出 step 含正確 targets / placements / explanation"
deliverables:
  - "src/techniques/nakedSingle.ts"
  - "src/techniques/nakedSingle.test.ts"
---

# 13 — Naked Single（裸單）

## 技巧說明
當某空格的合法候選數只剩一個時，必定填那個數字。

## 介面
匯出 `nakedSingleSolver: TechniqueSolver`：

```ts
meta = {
  id: 'naked-single',
  name: '裸單',
  shortDesc: '某空格只剩一個合法候選數，直接填入',
}

apply(board): TechniqueStep | null
```

## 演算法
1. 對每個空格 cell：
2. 取 `getLegalCandidates(board, cell.index)`
3. 若 size === 1，回傳 step（action: 'place'）
4. 全部掃完都找不到 → 回 `null`

## Step 輸出範例

```ts
{
  technique: 'naked-single',
  targets: [40],
  related: [],
  action: 'place',
  placements: [{ index: 40, value: 7 }],
  explanation: 'R5C5 的合法候選只剩 7，因為同行/列/宮已佔用其他數字。'
}
```

## 中文說明組裝原則
- 用 `R{row+1}C{col+1}` 標示格位
- 提及「同行 / 同列 / 同宮」哪些已佔用
- 句子簡短可讀

## 測試項目
- 對 fixture 中每個 `technique === 'naked-single'` 場景：
  - apply 結果 != null
  - `targets`、`placements` 與 `expectedStep` 一致
- 純空盤 → null
- 已解完的盤 → null

## 完工條件
- 純函式無副作用、`pnpm test` 全綠
