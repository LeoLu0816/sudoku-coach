---
id: 31-ui-numberpad
phase: P2
status: todo
depends_on: [01-shared-types]
assignee: null
estimated_complexity: S
acceptance:
  - "1-9 數字按鈕 + 清除鍵"
  - "鉛筆模式切換按鈕（toggle）"
  - "每個數字顯示剩餘可填數量（9 扣已填）"
  - "元件測試通過"
deliverables:
  - "src/ui/NumberPad.vue"
  - "src/ui/NumberPad.test.ts"
---

# 31 — 數字輸入盤

## 目標
數字輸入面板（含鉛筆模式切換），讓玩家點擊輸入。

## Props

```ts
interface Props {
  /** 各數字剩餘可填數量（[1..9] 各算）；用於數字 hint UI */
  remainingCounts: number[];   // length 9
  pencilMode: boolean;
}
```

## Emits

```ts
emit('number', value: number)   // 1-9
emit('clear')
emit('togglePencil')
```

## 視覺規格
- 1-9 按鈕橫排（手機可換 2 行）
- 每按鈕底部小字顯示剩餘數量（如「5」「(3)」）；剩 0 個的按鈕變灰
- 鉛筆模式按鈕：on/off 兩種狀態（鉛筆 icon）
- 清除鍵：橡皮擦 icon

## 測試
- 點擊數字 5 → emit `number` 5
- 剩 0 個的按鈕 disabled，點擊不 emit
- 點擊鉛筆按鈕 → emit `togglePencil`

## 完工條件
- 元件 + 測試完成、純 prop-driven
