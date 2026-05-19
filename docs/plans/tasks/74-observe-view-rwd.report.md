---
id: 74-observe-view-rwd
status: done
completed_at: 2026-05-19
---

# Task 74 Report

## 完工摘要

ObserveView 改為三層骨架；手機 PlaybackPanel 進 AppDrawer，BottomBar 4 顆主控制鍵；桌面維持兩欄。

## 變動檔案

- `src/views/ObserveView.vue` — 整檔重寫，移除 scoped CSS

## 主要變更點

- 新增 import：AppHeader / AppDrawer / BottomBar
- 新增狀態：`playbackDrawerOpen`，function `openPlaybackDrawer`
- template：AppHeader（含 reselect-difficulty）→ outOfTechniqueScope banner → main 兩欄 → BottomBar 4 顆 → PlaybackPanel 抽屜 → 難度 modal
- 保留 master 難度按鈕（col-span-2）、保留 `out-of-technique-scope-banner` testid
- 抽屜內 jumpTo 自動關閉抽屜

## 驗收

- `pnpm typecheck` 綠
- `pnpm test tests/integration/observe-flow.test.ts`：6/6 綠

## 實作決策備註

- ref 從 `'vue'` 統一在頂端 import（原本散落在中間）。
- outOfTechniqueScope banner 放 main 內、最上方，桌面手機共用。
