---
id: 32-ui-controlpanel
phase: P2
status: todo
depends_on: [01-shared-types]
assignee: null
estimated_complexity: S
acceptance:
  - "新局、undo、redo、提示、自動候選 toggle 按鈕"
  - "元件測試通過"
deliverables:
  - "src/ui/ControlPanel.vue"
  - "src/ui/ControlPanel.test.ts"
---

# 32 — 控制面板

## Props

```ts
interface Props {
  canUndo: boolean;
  canRedo: boolean;
  autoCandidates: boolean;
}
```

## Emits

```ts
emit('newGame')           // 由父元件彈出難度選單
emit('undo')
emit('redo')
emit('hint')              // 提示
emit('toggleAutoCandidates')
emit('checkErrors')       // 一次檢查所有錯誤
```

## 視覺規格
- 按鈕橫列，每按鈕 icon + 中文 label
- undo/redo：可用時藍色，不可用時灰色 disabled
- 提示：強調色（橘黃），含「提示」字

## 測試
- 點擊每按鈕 → 對應 emit
- canUndo=false 時，undo 按鈕 disabled

## 完工條件
- 元件 + 測試完成
