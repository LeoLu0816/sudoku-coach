---
id: 76-home-and-acceptance
phase: P6
status: todo
depends_on: [73-play-view-rwd, 74-observe-view-rwd, 75-analyze-view-rwd]
assignee: claude-code
estimated_complexity: S
acceptance:
  - "HomeView 三張模式卡在手機為單欄、桌面為三欄"
  - "HomeView 標題與 padding 在手機尺寸下合適（不出現橫向捲動 / 文字溢出）"
  - "四個尺寸（iPhone SE 375 / Pixel 412 / iPad 768 / Desktop 1280）逐項目手動驗收完成"
  - "pnpm typecheck / pnpm test / pnpm build 全綠，bundle size 增量 < 30 KB gzipped"
  - "rwd-mobile spec 第六節驗收清單全部勾選通過"
deliverables:
  - "src/views/HomeView.vue"
  - "docs/plans/rwd-mobile.report.md（完工報告，本任務寫，且把 rwd-mobile.md 改為 rwd-mobile.done.md）"
---

# Task 76: HomeView RWD + 整合手動驗收

## 目標

完成 HomeView 的 RWD（最小改動，三張卡單欄/三欄），然後跑完整四尺寸手動驗收清單，寫完工報告。

## 變動檔案

- 修改：`src/views/HomeView.vue`
- 建立：`docs/plans/rwd-mobile.report.md`
- 改名：`docs/plans/rwd-mobile.md` → `docs/plans/rwd-mobile.done.md`

## 實作步驟

### 子任務 A：HomeView 改造

- [ ] **Step 1：替換整個 `<template>`**

```vue
<template>
  <main class="flex min-h-screen flex-col items-center justify-center gap-9 bg-slate-50 px-4 py-8 text-slate-800 md:px-8 md:py-12">
    <header class="max-w-2xl text-center">
      <p class="m-0 mb-3 text-xs font-bold uppercase tracking-widest text-indigo-500">
        Sudoku Learning Tool
      </p>
      <h1 class="m-0 text-3xl leading-tight md:text-5xl">
        數獨學習工具
      </h1>
      <p class="mt-4 text-base text-slate-500 md:text-lg">
        在三種模式中練習解題、觀摩解法、分析任意盤面
      </p>
    </header>

    <section class="grid w-full max-w-5xl grid-cols-1 gap-4 md:grid-cols-3">
      <button
        class="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        data-testid="mode-play"
        @click="goTo('play')"
      >
        <h2 class="m-0 text-xl text-blue-600">玩</h2>
        <p class="m-0 text-sm text-slate-500">自己解題，卡住時可呼叫提示</p>
      </button>

      <button
        class="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        data-testid="mode-observe"
        @click="goTo('observe')"
      >
        <h2 class="m-0 text-xl text-slate-600">觀摩學習</h2>
        <p class="m-0 text-sm text-slate-500">看電腦逐步解題</p>
      </button>

      <button
        class="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        data-testid="mode-analyze"
        @click="goTo('analyze')"
      >
        <h2 class="m-0 text-xl text-slate-600">分析盤面</h2>
        <p class="m-0 text-sm text-slate-500">輸入任意盤面，分析難度與解法</p>
      </button>
    </section>
  </main>
</template>
```

- [ ] **Step 2：移除整段 `<style scoped>...</style>`**

HomeView 原本 scoped CSS 全刪。

- [ ] **Step 3：typecheck + test**

```bash
pnpm typecheck
pnpm test
```

預期：全綠。

### 子任務 B：四尺寸整合手動驗收

- [ ] **Step 4：跑 dev server**

```bash
pnpm dev
```

開瀏覽器 DevTools 模擬四尺寸，逐項目目視。

**iPhone SE（375 × 667）**：

- [ ] HomeView：三張卡單欄堆疊；不出現橫向捲動
- [ ] PlayView：AppHeader「← 首頁 / 遊戲模式 / ⋯」；棋盤 ~92vw；BottomBar sticky 含 NumberPad + 4 顆主鍵；點「💡 提示」開 Drawer；點「⋯」開更多動作 Drawer
- [ ] ObserveView：AppHeader「← 首頁 / 觀摩模式 / 重選」；棋盤下方 HintOverlay；BottomBar 4 顆控制鍵；點「☰ 步驟」開 PlaybackPanel Drawer
- [ ] AnalyzeView：AppHeader + Tabs「輸入 / 結果」；分析後自動切到結果
- [ ] 路由切換流暢，從 / → /play → /observe → /analyze → / 無破版

**Pixel 7（412 × 915）**：

- [ ] 與 iPhone SE 行為一致，棋盤稍微大一些（仍 92vw）
- [ ] 文字與按鈕無溢出

**iPad（768 × 1024）**：

- [ ] HomeView：三張卡三欄
- [ ] PlayView：layout 切到桌面兩欄；BottomBar 退化為非 sticky，內部顯示 NumberPad + ControlPanel 完整版；HintOverlay 在右側 aside
- [ ] ObserveView：兩欄 grid + PlaybackPanel 在右側 aside；BottomBar 4 顆鍵不可見
- [ ] AnalyzeView：Tabs 不顯示，輸入區 + 結果區直接顯示

**Desktop（≥ 1280）**：

- [ ] 與目前未改動前的版面接近（兩欄、HintOverlay 在右、ControlPanel 完整）
- [ ] HomeView 三張卡三欄、中央對齊

- [ ] **Step 5：跑 pnpm build 確認 bundle**

```bash
pnpm build
```

預期：
- 無錯誤
- 輸出 dist/assets/*.css 與 *.js
- 對比改造前 bundle size，CSS 增量 < 30 KB gzipped；若超標檢查 tailwind config content glob

若 build 失敗或 size 超標：依錯誤訊息修正，重跑直到 PASS。

### 子任務 C：完工歸檔（依全域 CLAUDE.md 規範）

- [ ] **Step 6：建立 `docs/plans/rwd-mobile.report.md`**

```markdown
---
id: rwd-mobile.report
related_plan: rwd-mobile.done
completed_at: <執行當天日期 YYYY-MM-DD>
---

# RWD 自適應手機版 — 完工報告

## 動工結果

- 子任務 70 ~ 76 全數完工
- `pnpm typecheck` / `pnpm test` / `pnpm build` 全綠
- 手動驗收四尺寸（375 / 412 / 768 / 1280）通過

## 主要變動檔案

- 新增：tailwind.config.js / postcss.config.js / src/styles/tailwind.css
- 新增：src/ui/AppHeader.vue / BottomBar.vue / AppDrawer.vue（含兩個測試檔）
- 修改：src/main.ts / index.html / src/ui/SudokuBoard.vue
- 修改：src/views/HomeView.vue / PlayView.vue / ObserveView.vue / AnalyzeView.vue

## 實作決策備註

- Tailwind 與 scoped CSS 採共存策略：views 與新元件用 Tailwind，現有 UI 元件保留 scoped
- HintOverlay 在 PlayView 手機與桌面雙渲染（一個 aside / 一個 Drawer），因元件 prop-driven 無內部 state，重複可接受
- AnalyzeView Tabs 用 v-show 而非 v-if，保留 PuzzleInputPanel 內部 state
- 難度選擇沒用 AppDrawer：需「桌面置中、手機底部 sheet」雙形態，直接 inline + Tailwind 切換更直觀

## 已知限制

- 不處理手機橫向（landscape）特化版面
- AppDrawer 沒做 focus trap

## 後續可能延伸

- 觀摩 / 分析模式的步驟列表大量步驟時手機性能評估
- 若 Tailwind preflight 對既有元件有副作用，後續可考慮在 tailwind.config.js 關閉 preflight
```

- [ ] **Step 7：把 `docs/plans/rwd-mobile.md` 改名為 `docs/plans/rwd-mobile.done.md`，並在頂端加完工標記**

頂端加（在 `---` frontmatter 之後、第一個 `#` 標題之前）：

```markdown
> ✅ **完工：YYYY-MM-DD**  全 7 個子任務 done，四尺寸驗收通過。詳見 `rwd-mobile.report.md`。
```

frontmatter 中 `status: design` 改為 `status: done`。

- [ ] **Step 8：commit**

```bash
git add src/views/HomeView.vue docs/plans/rwd-mobile.report.md
git mv docs/plans/rwd-mobile.md docs/plans/rwd-mobile.done.md
# rwd-mobile.done.md 已含完工標記
git add docs/plans/rwd-mobile.done.md
git commit -m "feat(views): HomeView RWD + 整合驗收完工 [76-home-and-acceptance]"
```

## 完工條件

- [ ] HomeView 三張卡手機單欄、桌面三欄
- [ ] 四尺寸手動驗收清單全部勾選
- [ ] `pnpm typecheck` / `pnpm test` / `pnpm build` 全綠
- [ ] 完工報告寫好，spec 改名為 done
- [ ] commit 完成

## 退場條件

若手動驗收發現嚴重破版（且無法 30 分鐘內修復）：
- 不繼續歸檔，回報問題、列出受影響項
- spec 維持 `status: review`，等後續任務修補
