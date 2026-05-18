---
id: 75-analyze-view-rwd
phase: P6
status: todo
depends_on: [71-shared-components, 72-board-clamp-scaling]
assignee: claude-code
estimated_complexity: M
acceptance:
  - "AnalyzeView 套用三層骨架（AppHeader + main）"
  - "手機（< md）：Tabs 切換「輸入 / 結果」，預設「輸入」；分析成功後自動切到「結果」"
  - "桌面（≥ md）：輸入區與結果區並列或上下顯示（維持類現狀），不需 Tabs"
  - "AnalyzeView 既有功能（貼字串 / 點輸入 / 載入範例 / 分析 / 進入觀摩 / 清空）全部可用"
  - "pnpm typecheck / pnpm test 全綠"
deliverables:
  - "src/views/AnalyzeView.vue"
---

# Task 75: AnalyzeView 手機版重構

## 目標

AnalyzeView 在手機因為輸入面板 + 結果面板兩塊都很大，垂直堆疊體驗差。改為 Tabs 切換；桌面維持上下排列（現狀）。

## 變動檔案

- 修改：`src/views/AnalyzeView.vue`

## 前置確認

- [ ] **Step 1：讀現況**

`src/views/AnalyzeView.vue`：
- script 區已有 onUpdateBoard / onSelectCell / onAnalyze / onClear / onLoadSample / enterObserve / goHome 等函式
- template 區為直線排列：header / input-area / result-area / hint
- analyzeStore 有 result reactive

## 實作步驟

### 子任務 A：script 補 Tab 狀態

- [ ] **Step 2：新增 import 與 Tab 狀態**

於既有 import 區追加：

```ts
import AppHeader from '@/ui/AppHeader.vue'
import { watch } from 'vue'
```

於既有 `selectedIndex` 宣告附近加：

```ts
/** 手機版 Tab：'input' | 'result'，桌面忽略此狀態（全部顯示） */
const activeTab = ref<'input' | 'result'>('input')

/** 分析成功後自動切到結果 Tab（即使桌面也切，沒影響） */
watch(result, (next) => {
  if (next && (next.isUnique || next.error)) {
    activeTab.value = 'result'
  }
})

/** Tab 切換 */
function setTab(tab: 'input' | 'result'): void {
  activeTab.value = tab
}
```

### 子任務 B：template 重寫

- [ ] **Step 3：替換整段 `<template>`**

```vue
<template>
  <div class="flex min-h-screen flex-col bg-slate-50 text-slate-800">
    <AppHeader title="分析模式" @back="goHome" />

    <!-- 手機版 Tabs：只在 < md 顯示 -->
    <nav class="sticky top-[57px] z-[5] flex border-b border-slate-200 bg-white md:hidden">
      <button
        class="flex-1 py-3 text-sm"
        :class="activeTab === 'input' ? 'border-b-2 border-blue-600 font-semibold text-blue-600' : 'text-slate-600'"
        data-testid="tab-input"
        @click="setTab('input')"
      >
        輸入
      </button>
      <button
        class="flex-1 py-3 text-sm"
        :class="activeTab === 'result' ? 'border-b-2 border-blue-600 font-semibold text-blue-600' : 'text-slate-600'"
        data-testid="tab-result"
        @click="setTab('result')"
      >
        結果
      </button>
    </nav>

    <main class="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center gap-4 px-3 py-4 md:px-6">
      <!-- 輸入區：手機只在 activeTab='input' 顯示；桌面永遠顯示 -->
      <section
        v-show="activeTab === 'input'"
        class="w-full md:block"
      >
        <PuzzleInputPanel
          :board="board"
          :selected-index="selectedIndex"
          @update:board="onUpdateBoard"
          @select-cell="onSelectCell"
          @analyze="onAnalyze"
          @clear="onClear"
          @load-sample="onLoadSample"
        />
      </section>

      <!-- 結果區：手機只在 activeTab='result' 顯示；桌面有 result 才顯示 -->
      <section
        v-show="activeTab === 'result'"
        class="w-full md:block"
      >
        <div
          v-if="result"
          class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
          data-testid="analyze-result"
        >
          <div
            v-if="result.error"
            class="rounded-lg border border-red-300 bg-red-50 px-5 py-4 text-red-700"
            data-testid="result-error"
          >
            <p class="m-0">{{ result.error }}</p>
          </div>

          <div v-else-if="result.isUnique">
            <h2 class="m-0 mb-3 text-lg font-semibold">分析結果</h2>
            <p class="my-1 flex gap-2">
              <span>唯一解：</span><strong class="text-blue-700">是</strong>
            </p>
            <p class="my-1 flex gap-2">
              <span>難度：</span>
              <strong class="text-blue-700" data-testid="result-difficulty">
                {{ result.difficulty ? difficultyLabel[result.difficulty] : '-' }}
              </strong>
            </p>
            <p class="my-1 flex gap-2">
              <span>解題步驟總數：</span>
              <strong class="text-blue-700">{{ result.solveResult?.steps.length ?? 0 }}</strong>
            </p>

            <div class="mt-4">
              <h3 class="mb-2 text-base font-medium text-slate-600">使用技巧</h3>
              <ul
                class="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-1.5 p-0"
                data-testid="usage-list"
              >
                <li
                  v-for="item in techniqueUsageList"
                  :key="item.id"
                  class="flex items-center justify-between rounded bg-slate-100 px-3 py-1.5"
                >
                  <span>{{ item.name }}</span>
                  <span class="font-semibold text-blue-600">×{{ item.count }}</span>
                </li>
              </ul>
              <p v-if="result.solveResult?.fallbackUsed" class="mt-2 text-sm text-amber-700">
                ⚠ 使用了暴力回溯（超出可解技巧範圍）
              </p>
            </div>

            <button
              class="mt-4 rounded bg-blue-600 px-5 py-2 text-white hover:bg-blue-700"
              data-testid="btn-enter-observe"
              @click="enterObserve"
            >
              進入觀摩模式 →
            </button>
          </div>
        </div>

        <div v-else class="rounded-lg bg-white px-6 py-8 text-center text-slate-500">
          <p class="m-0">尚未分析，請回到「輸入」貼上盤面後按「分析」</p>
        </div>
      </section>

      <!-- 無 result 時的 hint，僅桌面有意義（手機已有 Tab 引導） -->
      <section v-if="!result" class="hidden w-full text-center text-slate-500 md:block">
        <p>請貼上 81 字串、手動輸入盤面，或點「載入範例」後按「分析」</p>
      </section>
    </main>
  </div>
</template>
```

- [ ] **Step 4：移除整段 `<style scoped>...</style>`**

AnalyzeView 原本 scoped CSS 全刪。

### 子任務 C：驗證

- [ ] **Step 5：跑 typecheck + test**

```bash
pnpm typecheck
pnpm test
```

預期：全綠。

- [ ] **Step 6：手動驗收**

`pnpm dev` 啟動：

桌面（≥ 1024）：
- [ ] AppHeader 顯示「← 首頁」「分析模式」
- [ ] Tabs 不顯示
- [ ] 輸入區 + 結果區（或 hint）上下排列，與現狀類似
- [ ] 貼 81 字串、點分析 → 結果出現

手機（375 寬）：
- [ ] AppHeader 下方有兩個 Tab（輸入 / 結果），預設「輸入」
- [ ] 切「結果」Tab 在尚未分析時顯示「尚未分析」提示
- [ ] 在輸入 Tab 貼字串、點分析 → 自動切到「結果」Tab
- [ ] 結果顯示完整：唯一解 / 難度 / 步驟數 / 技巧分布
- [ ] 點「進入觀摩模式」→ 跳 /observe 且能看到該題

- [ ] **Step 7：commit**

```bash
git add src/views/AnalyzeView.vue
git commit -m "feat(views): AnalyzeView 手機 RWD 重構（Tabs 切換輸入/結果）[75-analyze-view-rwd]"
```

## 完工條件

- [ ] AnalyzeView 套 AppHeader
- [ ] 手機有 Tabs 切換輸入 / 結果
- [ ] 分析成功自動切到結果 Tab
- [ ] 桌面維持上下排列
- [ ] `pnpm typecheck` + `pnpm test` 全綠

## 設計決策備註

- AnalyzeView 沒用 BottomBar：輸入面板已有「分析 / 清空 / 載入範例」按鈕在元件內，不需另設底部固定列
- Tabs 用 `v-show` 而非 `v-if`：避免切換時 PuzzleInputPanel / 結果區重新 mount 損失 state
- `sticky top-[57px]`：對應 AppHeader 的高度（py-3 + h1 lg：約 56-57px）。若 AppHeader 高度調整需同步
