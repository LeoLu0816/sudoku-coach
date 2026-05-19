---
id: 72-board-clamp-scaling
status: done
completed_at: 2026-05-19
---

# Task 72 Report

## 完工摘要

SudokuBoard 改 clamp / min 自適應縮放，移除 480px media query。

## 變動檔案

- `src/ui/SudokuBoard.vue`（scoped style 區段）
  - `.sudoku-board`: `width: min(92vw, 560px); aspect-ratio: 1;`
  - `.cell-value`: `font-size: clamp(1rem, 4vw, 1.5rem);`
  - `.candidate`: `font-size: clamp(8px, 1.6vw, 11px);`
  - 移除 `@media (max-width: 480px)` 整段

## 驗收

- `pnpm test src/ui/SudokuBoard.test.ts`：12/12 綠
- `pnpm typecheck` 綠

## 實作決策備註

- 視覺驗收（pnpm dev）延至 76 整合做四尺寸對比。
