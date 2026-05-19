---
id: 75-analyze-view-rwd
status: done
completed_at: 2026-05-19
---

# Task 75 Report

## 完工摘要

AnalyzeView 套 AppHeader + 手機 Tabs（輸入 / 結果），分析完成自動切到結果 Tab；桌面維持上下排列。

## 變動檔案

- `src/views/AnalyzeView.vue` — 整檔重寫，移除 scoped CSS

## 主要變更點

- 新增 import：AppHeader、`watch`
- 新增狀態：`activeTab: 'input' | 'result'`，watch result 自動切到 'result'
- template：AppHeader → 手機 Tabs (sticky top-[57px]) → 兩個 section v-show 切換
- 結果區用 Tailwind 重寫卡片 / 列表 / 按鈕
- 保留 `out-of-technique-scope-note` testid
- onClear 順手切回 'input' Tab

## 驗收

- `pnpm typecheck` 綠
- `pnpm test tests/integration/analyze-flow.test.ts`：6/6 綠

## 實作決策備註

- v-show 而非 v-if：避免 PuzzleInputPanel state 重 mount。
- 桌面 v-show 兩塊都顯示（CSS `md:block` 強制），無 Tab 切換影響。
