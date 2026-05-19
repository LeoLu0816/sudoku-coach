---
id: 71-shared-components
status: done
completed_at: 2026-05-19
---

# Task 71 Report

## 完工摘要

新增三個全站共用 RWD 元件：AppHeader / BottomBar / AppDrawer，並為後兩者寫單元測試（7 tests 全綠）。

## 變動檔案

- `src/ui/AppHeader.vue`（新）— sticky 標頭、title prop / actions slot / back emit
- `src/ui/BottomBar.vue`（新）— sticky bottom 容器，md 退化非 sticky
- `src/ui/AppDrawer.vue`（新）— Teleport 至 body、底部滑入、ESC/背景/關閉鈕三路關閉
- `src/ui/__tests__/BottomBar.test.ts`（新，2 tests）
- `src/ui/__tests__/AppDrawer.test.ts`（新，5 tests）

## 驗收

- `pnpm test src/ui/__tests__/`：7 / 7 綠
- `pnpm typecheck` 綠

## 實作決策備註

- AppDrawer 測試：plan 範例 `wrapper.find` 對 Teleport 內容找不到，改用 `document.querySelector`/`document.body.textContent` 取得 body 上的節點，並全部加 `attachTo: document.body` + `wrapper.unmount()` 收尾，避免污染下一個 case。
- 沒做 focus trap（per plan 設計備註）。
