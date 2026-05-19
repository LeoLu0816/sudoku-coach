---
id: 73-play-view-rwd
status: done
completed_at: 2026-05-19
---

# Task 73 Report

## 完工摘要

PlayView 改為三層骨架（AppHeader / main / BottomBar）；手機透過 AppDrawer 承載 HintOverlay 與「更多動作」；桌面維持兩欄。難度選擇 modal 改為手機底部 sheet、桌面置中卡片。

## 變動檔案

- `src/views/PlayView.vue` — template / script 整檔重寫，移除整段 scoped CSS

## 主要變更點

- 新增 import：`watch` / AppHeader / AppDrawer / BottomBar
- 新增狀態：`hintDrawerOpen` / `moreDrawerOpen`，並 watch `currentHint` 自動開抽屜
- template：AppHeader（含手機 ⋯ 按鈕）→ main（手機單欄 / 桌面兩欄）→ BottomBar（手機 NumberPad + 4 顆主鍵 / 桌面完整 ControlPanel）
- 手機提示抽屜 + 更多動作抽屜
- 難度選擇器：手機 `items-end` + `rounded-t-2xl` / 桌面 `md:items-center` + `md:rounded-2xl`
- 保留 master 難度按鈕（plan 範例少寫，但既有 store 支援）

## 驗收

- `pnpm typecheck` 綠
- `pnpm test`：44 / 44 files、479 / 479 tests 綠（含 play-flow 7/7）

## 實作決策備註

- 手機 master 按鈕用 `col-span-2`（兩格寬）區分一般四難度。
- HintOverlay 渲染兩個實例（桌面 aside + 手機 Drawer），純展示元件無狀態，比條件渲染清晰。
- 視覺驗收延至 76 整合做四尺寸對比。
