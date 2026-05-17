---
id: 33-ui-hint-overlay
phase: P2
status: todo
depends_on: [01-shared-types, 21-solver-orchestrator]
assignee: null
estimated_complexity: M
acceptance:
  - "可顯示 TechniqueStep 內容（技巧名 + 中文說明）"
  - "可發出 highlight 資訊給 Board"
  - "「套用」按鈕將該步應用到棋盤"
  - "「下一個提示」按鈕"
  - "元件測試通過"
deliverables:
  - "src/ui/HintOverlay.vue"
  - "src/ui/HintOverlay.test.ts"
---

# 33 — 提示面板

## 目標
顯示一個 TechniqueStep 的內容；同時透過 props/emit 與 Board 元件協作，讓 Board 知道要高亮哪些格。

## Props

```ts
interface Props {
  step: TechniqueStep | null;   // null = 隱藏
}
```

## Emits

```ts
emit('apply')      // 套用該步到盤面（更新棋盤狀態）
emit('next')       // 再給下一個提示
emit('close')      // 關閉提示
```

## 視覺
- 卡片或側邊欄
- 標頭：技巧中文名（如「裸單」）+ 簡短副標
- 內文：`step.explanation`
- 按鈕：套用 / 下一個 / 關閉
- 若 `step === null`：顯示「目前已解完 / 無可推薦步驟」

## 高亮協作模式
**注意**：本元件不直接操作 Board。父元件（view）負責讀 `step.targets` + `step.related` 傳給 `SudokuBoard` 做高亮。

## 測試
- 給定 step → 渲染技巧名與 explanation
- 點擊 apply → emit `apply`
- step=null → 顯示空狀態文字

## 完工條件
- 元件 + 測試完成
