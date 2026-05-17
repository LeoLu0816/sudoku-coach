---
id: 14-tech-hidden-single
phase: P1
status: todo
depends_on: [10-board-core, 11-validator, 02-test-fixtures]
assignee: null
estimated_complexity: S
acceptance:
  - "實作 TechniqueSolver 介面"
  - "通過 fixtures 中所有 hidden-single 場景"
  - "可在 row / col / box 三種 unit 中偵測"
deliverables:
  - "src/techniques/hiddenSingle.ts"
  - "src/techniques/hiddenSingle.test.ts"
---

# 14 — Hidden Single（隱單）

## 技巧說明
某數字在某個 unit（行/列/宮）中只能填在唯一一格，即使該格還有其他候選。

## 介面
匯出 `hiddenSingleSolver: TechniqueSolver`：

```ts
meta = {
  id: 'hidden-single',
  name: '隱單',
  shortDesc: '某數字在行/列/宮中只能填在唯一一格',
}
```

## 演算法
1. 對每個 unit (9 行 + 9 列 + 9 宮 = 27 個)：
2. 對每個數字 v ∈ {1..9}：
3. 找出該 unit 中 candidates 含 v 的所有空格
4. 若數量 === 1，回傳 step
5. 全部掃完都找不到 → null

## Step 輸出範例

```ts
{
  technique: 'hidden-single',
  targets: [13],
  related: [10,11,12,14,15,16,17,18], // 該 unit 其他 8 格
  action: 'place',
  placements: [{ index: 13, value: 4 }],
  explanation: '在 R2 這一行中，4 只能填在 R2C5（其他格的候選都不含 4）。'
}
```

## 中文說明組裝原則
- 指出在哪個 unit（如「R2 這一行」「C5 這一列」「第 5 宮」）
- 提及該數字只剩此格可填

## 測試項目
- 對 fixture 中每個 `technique === 'hidden-single'` 場景驗證
- row、col、box 三類 unit 各至少 1 個測試
- 沒有 hidden single 的盤 → null

## 完工條件
- `pnpm test` 全綠
