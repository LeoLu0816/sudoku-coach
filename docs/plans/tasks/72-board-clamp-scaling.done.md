---
id: 72-board-clamp-scaling
phase: P6
status: done
completed_at: 2026-05-19
depends_on: [70-tailwind-setup]
assignee: claude-code
estimated_complexity: S
acceptance:
  - "SudokuBoard.vue 寬度改為 min(92vw, 560px)，aspect-ratio: 1"
  - "候選格 font-size 改為 clamp(8px, 1.6vw, 11px)"
  - "主數字 font-size 改為 clamp(1rem, 4vw, 1.5rem)"
  - "移除既有 @media (max-width: 480px) 區塊"
  - "SudokuBoard.test.ts 既有測試全綠"
  - "pnpm typecheck / pnpm test 全綠"
deliverables:
  - "src/ui/SudokuBoard.vue"
---

> **[DONE 2026-05-19]** clamp 縮放 + 移除 480 media query；SudokuBoard 12/12 綠。

# Task 72: SudokuBoard 自適應縮放

## 目標

把 SudokuBoard 從固定尺寸 + 480px 媒體查詢，改為用 `clamp` / `min` 自然縮放，在 320px 到 1024px 之間順暢縮放，不需要任何斷點切換。

## 變動檔案

- 修改：`src/ui/SudokuBoard.vue`（僅 `<style scoped>` 區段）

## 前置確認

- [ ] **Step 1：先讀現況**

讀 `src/ui/SudokuBoard.vue` 完整檔案，記下：
- 棋盤容器 selector（推測為 `.sudoku-board`，需以實檔為準）
- 主數字 / 候選格 selector
- 既有 `@media (max-width: 480px)` 區塊的 line 範圍（前面已知約在 line 303-312）

## 實作步驟

- [ ] **Step 2：找出棋盤容器寬度設定，改為 min + aspect-ratio**

於 `.sudoku-board` 規則中：

舊：
```css
.sudoku-board {
  /* 原本可能類似：width: 450px; height: 450px; 或固定 px */
}
```

改為：
```css
.sudoku-board {
  width: min(92vw, 560px);
  aspect-ratio: 1;
  /* 保留其餘屬性（display / border / 格線等） */
}
```

注意：保留 `.sudoku-board` 既有的 display / grid / border 等屬性，只動 width / height。若原本有 `height: ...px;`，整行刪除（aspect-ratio 取代）。

- [ ] **Step 3：候選格 font-size 改 clamp**

找到 `.candidate` 規則：

舊：
```css
.candidate {
  font-size: 11px;
  /* ... */
}
```

改為：
```css
.candidate {
  font-size: clamp(8px, 1.6vw, 11px);
  /* ... */
}
```

- [ ] **Step 4：主數字 font-size 改 clamp**

找到 `.cell-value` 規則（或對應主數字的 class），加上：

```css
.cell-value {
  font-size: clamp(1rem, 4vw, 1.5rem);
  /* ... 其餘屬性保留 */
}
```

若原本 cell-value 沒寫死 font-size 而是繼承 parent，需在 `.cell` 或對應容器補上此屬性。實作時讀現況決定。

- [ ] **Step 5：移除 `@media (max-width: 480px)` 整段**

刪除：
```css
@media (max-width: 480px) {
  .sudoku-board {
    width: 95vw;
    height: 95vw;
  }

  .candidate {
    font-size: 9px;
  }
}
```

- [ ] **Step 6：跑既有 SudokuBoard 測試**

執行：`pnpm test src/ui/SudokuBoard.test.ts`
預期：PASS（測試聚焦在點擊事件 / props 渲染，不測 CSS 數值，應全綠）

- [ ] **Step 7：跑全測試 + typecheck**

執行：`pnpm typecheck && pnpm test`
預期：全綠

- [ ] **Step 8：手動驗收**

`pnpm dev` 啟動，瀏覽器 DevTools 切換手機尺寸：
- iPhone SE（375）：棋盤填滿 ~92vw，候選格仍可讀
- iPad（768）：棋盤達 560px 上限，不再放大
- Desktop（1280）：棋盤固定 560px，不會異常變大

- [ ] **Step 9：commit**

```bash
git add src/ui/SudokuBoard.vue
git commit -m "feat(ui): SudokuBoard 改用 clamp 自適應縮放，移除 480 media query [72-board-clamp-scaling]"
```

## 完工條件

- [ ] `.sudoku-board` 寬度為 `min(92vw, 560px)` + `aspect-ratio: 1`
- [ ] `.candidate` font-size 為 `clamp(8px, 1.6vw, 11px)`
- [ ] 主數字 font-size 為 `clamp(1rem, 4vw, 1.5rem)`
- [ ] `@media (max-width: 480px)` 已移除
- [ ] `pnpm typecheck` + `pnpm test` 全綠
- [ ] 手動驗收三個視窗尺寸無異常

## 設計決策備註

- 用 `min(92vw, 560px)` 而非純 `92vw`：避免在桌面上把棋盤拉到 1000px 以上，可讀性反而下降
- `aspect-ratio: 1` 取代固定高度：對所有現代瀏覽器（Chrome 88+ / Safari 15+ / Firefox 89+）友善
- `clamp` 上下界對應 8px ~ 11px：太小無法閱讀，太大會壞掉 3x3 候選格網格
