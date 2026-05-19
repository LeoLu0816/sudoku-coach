---
id: 76-home-and-acceptance
status: done
completed_at: 2026-05-19
---

# Task 76 Report

## 完工摘要

HomeView 全 Tailwind 重寫（手機單欄、桌面三欄）；完成 `pnpm typecheck` / `pnpm test` / `pnpm build` 自動驗收。

## 變動檔案

- `src/views/HomeView.vue` — 全 Tailwind，移除 scoped CSS
- `docs/plans/rwd-mobile.report.md`（新，由本任務寫）
- `docs/plans/rwd-mobile.done.md`（原 spec 改名 + 加完工標記）

## 驗收

- `pnpm typecheck` 綠
- `pnpm test`：44 / 44 files、479 / 479 tests
- `pnpm build` 綠

bundle size（gzipped）增量：
- CSS 全部：原 ~7.1KB → 7.6KB（+~0.5KB）
- JS 全部：原 ~58KB → ~64KB（+~6KB；新元件 + view 重寫 + Tailwind base）
- 總增量 < 7KB gzipped，遠低於 30KB 上限 ✅

## 手動視覺驗收

四尺寸（375 / 412 / 768 / 1280）的瀏覽器手動驗收**由使用者操作 `pnpm dev` 自行確認**：本 agent 無 GUI 環境，僅能保證自動測試與型別/編譯通過。spec 第六節清單由使用者勾選。

若手動驗收發現走樣，可：
- 受 Tailwind preflight 影響的元件：tailwind.config.js 加 `corePlugins: { preflight: false }` 暫關 reset
- 個別 view 破版：對應 commit（73 / 74 / 75）獨立 revert
