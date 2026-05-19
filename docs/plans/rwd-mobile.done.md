---
id: rwd-mobile
title: RWD 自適應手機版 — 設計 Spec
version: 1.0.0
status: done
completed_at: 2026-05-19
last_updated: 2026-05-19
owner: claude-code
---

> ✅ **完工：2026-05-19**　全 7 個子任務（70~76）done，typecheck/test(479)/build 全綠。詳見 [`rwd-mobile.report.md`](./rwd-mobile.report.md)。瀏覽器四尺寸視覺驗收待使用者於 `pnpm dev` 自行確認。

# RWD 自適應手機版 — 設計 Spec

## 一、目標

讓整站三個 view（Home / Play / Observe / Analyze）在手機（< 768px）取得近似 App 的操作體驗：

- 棋盤可用面積最大化、不出現橫向捲動
- 數字輸入盤與重要操作鍵 sticky 在底部，雙手拇指可及
- 提示說明 / 觀摩步驟 / 分析輸入等副面板改為底部抽屜（Drawer），不再與棋盤搶版面
- 桌面（≥ 1024px）維持目前兩欄 grid 視覺，不退步

## 二、非目標（YAGNI）

- 不做手機橫向（landscape）特化版面，依寬度走 desktop layout 即可
- 不重整 SudokuBoard 的格線顏色 / 衝突高亮 / 候選格網格等視覺
- 不為了 Tailwind 全面替換現有 scoped CSS
- 不引入 Vue 元件庫（Naive / Vuetify / Element Plus），保留現有 6 個手寫元件
- 不做 PWA / 離線安裝 / 安全區域以外的 viewport meta 調整

## 三、技術決策

### 3.1 引入 Tailwind CSS

- 安裝：`tailwindcss` + `postcss` + `autoprefixer`（pnpm devDependencies）
- 設定檔：`tailwind.config.js`、`postcss.config.js`
- `tailwind.config.js`：
  - `content: ['./index.html', './src/**/*.{vue,ts}']`
  - `theme.screens: { sm: '480px', md: '768px', lg: '1024px' }`（覆寫 Tailwind 預設斷點，與本專案三段制對齊）
  - 其餘 theme 沿用 Tailwind 預設（顏色 / spacing / shadow 等）
- 新增 `src/styles/tailwind.css`：
  ```css
  @tailwind base;
  @tailwind components;
  @tailwind utilities;
  ```
- `src/main.ts` 頂端 import `'./styles/tailwind.css'`
- preflight：開啟（預設）。風險評估：現有元件大量自寫 button / h1 / p，preflight 會 reset，需驗收後微調

### 3.2 Tailwind 與 scoped CSS 共存策略（B 方案）

- **由 Tailwind 負責**：view 的 layout / spacing / breakpoint、新元件（AppHeader / BottomBar / AppDrawer）的所有樣式
- **由 scoped CSS 負責**：UI 元件內部視覺（SudokuBoard 格線顏色、NumberPad 按鈕造型、HintOverlay 卡片樣式等）
- 共存原則：scoped CSS 不下到容器層；容器層級的 padding / grid / sticky 全交 Tailwind
- 改造順序：先建好 Tailwind 基建（70）、再做共用元件（71）、再逐 view 改造（73–76）

### 3.3 斷點

| 斷點 | 寬度 | 用途 |
|---|---|---|
| `< sm` | < 480px | 小型手機（iPhone SE 等） |
| `sm` | ≥ 480px | 一般手機 |
| `md` | ≥ 768px | 平板 / 小桌面（layout 轉為兩欄） |
| `lg` | ≥ 1024px | 桌面（完整版面） |

實作上 mobile-first：預設手機樣式，用 `md:` `lg:` 往上加。

### 3.4 Viewport meta

`index.html` 確保 `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`。

## 四、版面結構

### 4.1 共用三層骨架（PlayView / ObserveView / AnalyzeView）

```
┌────────────────────────────┐
│ <AppHeader>  sticky top    │  返回鈕 / 標題 / 右側 actions slot
├────────────────────────────┤
│ <main> overflow-y-auto     │
│   棋盤 / 結果 / 輸入...      │
│   solved / error banner    │
├────────────────────────────┤
│ <BottomBar>  sticky bottom │  僅手機顯示（< md）
│   NumberPad + 主動作 4 顆   │  桌面隱藏，內容在 main 下方
└────────────────────────────┘
```

- 手機：BottomBar sticky；HintOverlay / PlaybackPanel / PuzzleInputPanel / 「更多動作」走 AppDrawer
- 桌面（≥ md）：恢復目前兩欄 grid；BottomBar 內容改為非 sticky 排在 main 下方

### 4.2 新增共用元件

#### `src/ui/AppHeader.vue`

- Props：`title: string`
- Slots：`actions`（右側額外操作）
- Emits：`back`
- 樣式：`sticky top-0 bg-white/95 backdrop-blur z-10 px-4 py-3 flex items-center gap-3 border-b border-slate-200`

#### `src/ui/BottomBar.vue`

- 純佈局容器，內容透過 default slot 注入
- 樣式：`sticky bottom-0 bg-white border-t border-slate-200 px-3 py-2 md:static md:bg-transparent md:border-0`
- 桌面（≥ md）退化為一般 block，不 sticky

#### `src/ui/AppDrawer.vue`

- Props：`open: boolean`、`title?: string`
- Emits：`update:open`（v-model 用）
- Slots：default（內容）、`footer`（可選）
- 行為：從底部滑入；點背景遮罩或關閉鈕關閉；ESC 關閉
- 樣式：fixed inset-0、遮罩 `bg-slate-900/40`、抽屜本體 `bg-white rounded-t-2xl max-h-[85vh] overflow-y-auto`
- 動畫：transform translate-y，`transition` 200ms

### 4.3 各 view 改造重點

| View | 手機版差異 |
|---|---|
| **HomeView** | 三張模式卡 `grid-cols-1 md:grid-cols-3`；padding 從 32px 縮到 16px；hero 文字尺寸用 clamp |
| **PlayView** | 套三層骨架。**手機**：HintOverlay 移入 AppDrawer（觸發：`currentHint` 有值時自動開抽屜）；BottomBar 含 NumberPad + 4 顆主鍵（提示 / undo / redo / 鉛筆）；其他動作（新局 / 自動候選 / 檢查衝突）收進 Header「⋯」→ AppDrawer；難度選擇 modal 改為底部 sheet 樣式。**桌面（≥ md）**：HintOverlay 維持右側面板（現狀），BottomBar 內容退化為非 sticky、排在 main 下方 |
| **ObserveView** | 套三層骨架。**手機**：PlaybackPanel 整塊改塞 AppDrawer；BottomBar 含播放/暫停/上一步/下一步 4 顆。**桌面**：維持兩欄 grid、PlaybackPanel 在右側 |
| **AnalyzeView** | 套三層骨架。**手機**：Tabs（輸入 ↔ 結果），預設「輸入」、分析完跳「結果」。**桌面**：維持單頁面板並列（現狀） |

### 4.4 SudokuBoard 縮放

- 預設 `width: min(92vw, 560px); aspect-ratio: 1`
- 候選格 `font-size: clamp(8px, 1.6vw, 11px)`
- 主數字 `font-size: clamp(1rem, 4vw, 1.5rem)`
- 移除既有 `@media (max-width: 480px)` block（被 clamp 取代）
- 不動格線顏色 / 衝突高亮邏輯

## 五、檔案異動範圍

### 新增

- `tailwind.config.js`
- `postcss.config.js`
- `src/styles/tailwind.css`
- `src/ui/AppHeader.vue`
- `src/ui/BottomBar.vue`
- `src/ui/AppDrawer.vue`
- `src/ui/__tests__/AppDrawer.test.ts`
- `src/ui/__tests__/BottomBar.test.ts`
- `docs/plans/tasks/70-tailwind-setup.md` ~ `76-home-and-acceptance.md`

### 修改

- `package.json`（新增 devDependencies）
- `index.html`（補 viewport meta，若無）
- `src/main.ts`（import tailwind.css）
- `src/App.vue`（不變或微調）
- `src/views/HomeView.vue`
- `src/views/PlayView.vue`
- `src/views/ObserveView.vue`
- `src/views/AnalyzeView.vue`
- `src/ui/SudokuBoard.vue`（縮放公式）

### 不動

- `src/types/`、`src/core/`、`src/techniques/`、`src/solver/`、`src/generator/`、`src/stores/`
- UI 元件內部視覺（NumberPad / ControlPanel / HintOverlay / PlaybackPanel / PuzzleInputPanel 的 scoped CSS）— 僅可能微調 padding / 文字 size 以配合 BottomBar 容器

## 六、測試與驗收

### 6.1 自動測試

- 現有所有 `*.test.ts` 跑 jsdom 不測 layout，預期不受影響 → `pnpm test` 全綠是基本盤
- 新增 `AppDrawer.test.ts`：open=true 渲染內容、emit `update:open` false 於關閉、ESC 觸發關閉
- 新增 `BottomBar.test.ts`：slot 渲染、容器 class 存在
- `pnpm typecheck` 全綠
- `pnpm build` 無錯誤，bundle size 增加 < 30 KB gzipped（Tailwind purge 後）

### 6.2 手動驗收

於 Chrome DevTools 模擬以下尺寸：

- iPhone SE（375 × 667）
- Pixel 7（412 × 915）
- iPad（768 × 1024）
- Desktop（≥ 1280）

逐項目視測：

- [ ] 三個 view 在手機尺寸下棋盤不出現橫向捲動
- [ ] 手機 BottomBar sticky 於底部、滾動時不消失
- [ ] 手機 PlayView：點「提示」→ 抽屜從下方滑入；關閉後棋盤狀態保留
- [ ] 手機 PlayView：點「⋯」→ 看到新局 / 自動候選 / 檢查衝突
- [ ] 手機 AnalyzeView：能在「輸入 / 結果」Tab 間切換
- [ ] 手機 ObserveView：能用 BottomBar 控制播放、抽屜可看完整步驟列表
- [ ] iPad（768）：layout 切換到桌面兩欄，BottomBar 退化為非 sticky
- [ ] Desktop（≥ 1280）：與目前版面一致
- [ ] HomeView 三張卡在手機為單欄、桌面為三欄
- [ ] 難度選擇 modal 在手機為底部 sheet、桌面為置中卡片

## 七、任務拆分（P6 區段）

> **執行模式**：本案不走 Cursor 派工，全部由 claude-code 主 agent 直接動工。子任務拆分仍保留，便於分段 commit、checkpoint 復原、出問題定點回滾。子任務檔仍寫 `docs/plans/tasks/<id>-<slug>.md`，但**不再產出** `docs/plans/dispatch/<id>.prompt.md`。

| ID | 任務 | 依賴 | 複雜度 | 並行群組 |
|---|---|---|---|---|
| **70** | Tailwind 安裝 + 設定 + viewport meta + `tailwind.css` import | — | S | A |
| **71** | 新增共用元件：AppHeader / BottomBar / AppDrawer（含 test） | 70 | M | B |
| **72** | SudokuBoard 改 clamp 縮放、移除 480 media query | 70 | S | B |
| **73** | PlayView 重構：三層骨架 + HintOverlay 進 Drawer + ⋯ 選單 | 71, 72 | M | C |
| **74** | ObserveView 重構：手機 Drawer 包 PlaybackPanel | 71, 72 | M | C |
| **75** | AnalyzeView 重構：手機 Tabs（輸入 / 結果） | 71, 72 | M | C |
| **76** | HomeView RWD + 整合手動驗收（跑四尺寸清單） | 73, 74, 75 | S | D |

執行順序：A → B → C → D（C 群組內部可序列，因都動 view 層相似結構，序列更安全）。

每個子任務完工後依全域 CLAUDE.md 規範：

1. 寫 `docs/plans/tasks/<id>-<slug>.report.md`
2. 原 plan 改名為 `<id>-<slug>.done.md`
3. `.done.md` 頂端加完工標記（日期 + 一句話總結）
4. commit 訊息結尾標 `[<task-id>]`，例：`feat(ui): 新增 AppDrawer 抽屜元件 [71-shared-components]`

## 八、回滾策略

- 70（Tailwind 引入）若 preflight 把現有元件搞壞 → 在 `tailwind.config.js` 加 `corePlugins: { preflight: false }` 暫時關閉，或於 scoped CSS 補回必要 reset
- 73–75 每個 view 一個 commit，出問題單獨 revert 即可
- 不修改 stores / core / techniques / solver，邏輯層零風險

## 九、風險與未決事項

- **Tailwind preflight 影響**：可能 reset 掉 button / h1 / p 預設樣式 → 70 完成後跑一輪手動驗收，若大面積走樣再決定是否關 preflight
- **bundle size**：Tailwind v3 JIT + purge 應壓在 10 KB 內，加上新元件總增量 < 30 KB gzipped；若超標檢查 content glob 是否過廣
- **HintOverlay 在手機改抽屜**：原本「提示出現 → 顯示卡片」邏輯需改為「提示出現 → 開抽屜」；桌面維持原樣（v-if 條件分流或 component switch）
