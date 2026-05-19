---
id: rwd-mobile.report
related_plan: rwd-mobile.done
completed_at: 2026-05-19
---

# RWD 自適應手機版 — 完工報告

## 動工結果

- 子任務 70 ~ 76 全數完工，七個 commit 對應七個子任務
- `pnpm typecheck` / `pnpm test`（479 / 479） / `pnpm build` 全綠
- 四尺寸手動視覺驗收待使用者於 `pnpm dev` 自行確認（本 agent 無 GUI 環境）

## 主要變動檔案

### 新增

- `tailwind.config.js` / `postcss.config.js` / `src/styles/tailwind.css`
- `src/ui/AppHeader.vue` / `BottomBar.vue` / `AppDrawer.vue`
- `src/ui/__tests__/AppDrawer.test.ts` / `BottomBar.test.ts`（7 tests）

### 修改

- `package.json` / `pnpm-lock.yaml`（tailwindcss 3.4 / postcss / autoprefixer）
- `index.html`（viewport-fit=cover）
- `src/main.ts`（頂端 import tailwind.css）
- `src/ui/SudokuBoard.vue`（clamp 縮放，移除 480 media query）
- `src/views/HomeView.vue` / `PlayView.vue` / `ObserveView.vue` / `AnalyzeView.vue`（mobile-first 重寫，移除 scoped CSS）

## Bundle size 增量（gzipped）

- CSS 全部：~7.1KB → ~7.6KB（+~0.5KB）
- JS 全部：~58KB → ~64KB（+~6KB）
- 總增量 < 7KB gzipped，遠低於 spec 30KB 上限

## 實作決策備註

- **Tailwind 與 scoped CSS 共存策略**：views 與新元件用 Tailwind，現有 UI 元件（SudokuBoard / NumberPad / ControlPanel / HintOverlay / PlaybackPanel / PuzzleInputPanel）保留 scoped CSS。
- **HintOverlay 在 PlayView 手機 + 桌面雙渲染**：一個 aside + 一個 Drawer，因元件 prop-driven 無內部 state，重複可接受。
- **AnalyzeView Tabs 用 v-show**：避免 PuzzleInputPanel 重 mount 損失 state。
- **難度選擇沒用 AppDrawer**：需「桌面置中、手機底部 sheet」雙形態，直接 inline div + Tailwind responsive class 切換更直觀。
- **master 難度按鈕保留**：plan 範例少寫，依現有 store 支援保留，手機版用 col-span-2 排第五顆。
- **AppDrawer 測試**：plan 範例 `wrapper.find` 對 Teleport 內容 jsdom 找不到，改用 `document.querySelector` + `attachTo: document.body` + `wrapper.unmount()` 收尾。

## 已知限制 / 後續延伸

- 不處理手機橫向（landscape）特化版面（YAGNI）
- AppDrawer 沒做 focus trap
- Tailwind preflight 預設開啟；若發現大面積走樣可在 `tailwind.config.js` 加 `corePlugins: { preflight: false }`，目前看 build / 既有測試皆綠，暫不關
- 觀摩 / 分析的大量步驟列表在低階手機性能尚未量測
