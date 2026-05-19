---
id: 73-play-view-rwd
phase: P6
status: done
completed_at: 2026-05-19
depends_on: [71-shared-components, 72-board-clamp-scaling]
assignee: claude-code
estimated_complexity: M
acceptance:
  - "PlayView 套用三層骨架（AppHeader + main + BottomBar）"
  - "手機（< md）：HintOverlay 透過 AppDrawer 呈現，currentHint 有值時自動開抽屜"
  - "手機：BottomBar 含 NumberPad 與「提示 / undo / redo / 鉛筆」4 顆主鍵 sticky 底部"
  - "手機：Header 右側「⋯」按鈕開 AppDrawer，內含「新局 / 自動候選 / 檢查衝突」"
  - "桌面（≥ md）：HintOverlay 維持右側面板，BottomBar 退化為非 sticky 排在 main 下方"
  - "難度選擇 modal 在手機改為底部 sheet 樣式"
  - "PlayView 既有功能（鍵盤輸入 / undo / redo / 提示 / 鉛筆）全部可用"
  - "pnpm typecheck / pnpm test 全綠"
deliverables:
  - "src/views/PlayView.vue"
---

> **[DONE 2026-05-19]** 三層骨架 + 提示抽屜 + 更多動作抽屜 + sticky BottomBar；全 479 tests 綠。

# Task 73: PlayView 手機版重構

## 目標

把 PlayView 改為 mobile-first 三層骨架；手機版以 AppDrawer 承載 HintOverlay 與「更多動作」；桌面版維持兩欄。NumberPad + 主鍵 sticky 在 BottomBar。

## 變動檔案

- 修改：`src/views/PlayView.vue`（template + style 大改；script 區僅新增抽屜 open 狀態與 watch）

## 前置確認

- [ ] **Step 1：讀現況**

讀 `src/views/PlayView.vue` 全檔，確認：
- script 區域 import / store 用法
- template 結構（header / layout / numberpad-row / control-row / modal）
- style 區的 class 名稱

## 實作步驟

### 子任務 A：script 區追加抽屜狀態

- [ ] **Step 2：新增 import**

於現有 import 區（最上面）加：

```ts
import { watch } from 'vue'
import AppHeader from '@/ui/AppHeader.vue'
import AppDrawer from '@/ui/AppDrawer.vue'
import BottomBar from '@/ui/BottomBar.vue'
```

`watch` 若 vue 那行已 import 則合併進去。

- [ ] **Step 3：新增抽屜 open 狀態與自動開啟邏輯**

在 `errorBannerVisible` 宣告附近加：

```ts
/** 提示抽屜開關（手機版用，桌面版仍走 aside） */
const hintDrawerOpen = ref<boolean>(false)

/** 更多動作抽屜開關（手機版「⋯」用） */
const moreDrawerOpen = ref<boolean>(false)

/** 難度選擇用底部 sheet 樣式（手機版用同一 modal、只是 CSS 切換） */

// 提示出現時自動打開抽屜（手機版才看得到，桌面版 aside 仍顯示）
watch(currentHint, (next) => {
  if (next) {
    hintDrawerOpen.value = true
  }
})
```

- [ ] **Step 4：新增「更多動作」處理函式**

在 `onCloseHint` 附近加：

```ts
/** 手機版「⋯」按鈕：開更多動作抽屜 */
function openMoreActions(): void {
  moreDrawerOpen.value = true
}

/** 從抽屜內按「新局」 */
function onNewGameFromDrawer(): void {
  moreDrawerOpen.value = false
  onNewGame()
}

/** 從抽屜內按「自動候選」 */
function onToggleAutoCandidatesFromDrawer(): void {
  onToggleAutoCandidates()
}

/** 從抽屜內按「檢查衝突」 */
function onCheckErrorsFromDrawer(): void {
  moreDrawerOpen.value = false
  onCheckErrors()
}
```

### 子任務 B：template 改造

- [ ] **Step 5：替換 template 為三層骨架**

整段 `<template>...</template>` 替換為：

```vue
<template>
  <div class="flex min-h-screen flex-col bg-slate-50 text-slate-800">
    <!-- 上方標頭 -->
    <AppHeader title="遊戲模式" @back="goHome">
      <template #actions>
        <span class="hidden text-sm text-slate-600 sm:inline">難度：{{ difficultyLabel }}</span>
        <button
          class="rounded px-2 py-1 text-base text-slate-600 hover:bg-slate-100 md:hidden"
          data-testid="btn-more-actions"
          aria-label="更多動作"
          @click="openMoreActions"
        >
          ⋯
        </button>
      </template>
    </AppHeader>

    <!-- 主體：手機單欄、桌面兩欄 -->
    <main class="flex w-full flex-1 flex-col items-center gap-4 px-3 py-4 md:px-6">
      <section
        v-if="board"
        class="grid w-full max-w-5xl items-start gap-4 md:grid-cols-[auto_1fr] md:gap-6"
        data-testid="game-layout"
      >
        <div class="flex flex-col items-center gap-3">
          <SudokuBoard
            :board="board"
            :selected-index="selectedIndex"
            :conflicts="conflicts"
            :show-candidates="autoCandidates || pencilMode"
            :hint-highlight="hintHighlight"
            @select-cell="onSelectCell"
            @key-input="onBoardKey"
          />

          <div
            v-if="isSolved"
            class="flex items-center gap-3 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-3"
            data-testid="solved-banner"
          >
            <p class="m-0 font-semibold text-emerald-700">🎉 恭喜，你解開了！</p>
            <button
              class="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
              data-testid="btn-play-again"
              @click="playAgain"
            >
              再來一局
            </button>
          </div>

          <div
            v-if="errorBannerVisible"
            class="rounded-md border border-orange-300 bg-orange-50 px-3 py-2 text-orange-800"
            data-testid="error-banner"
          >
            {{ conflicts.length === 0 ? '目前沒有衝突' : `發現 ${conflicts.length} 處衝突（已紅色標示）` }}
          </div>
        </div>

        <!-- 桌面：右側提示面板 -->
        <aside class="hidden md:block md:min-w-[280px]">
          <HintOverlay
            :step="currentHint"
            @apply="onApplyHint"
            @next="onNextHint"
            @close="onCloseHint"
          />
        </aside>
      </section>

      <section v-if="!board && !showDifficultyPicker" class="flex flex-col items-center gap-3 py-12">
        <p>尚未開始任何題目</p>
        <button
          class="rounded bg-blue-600 px-5 py-2 text-white hover:bg-blue-700"
          @click="onNewGame"
        >
          開新局
        </button>
      </section>
    </main>

    <!-- 底部 sticky 區：手機含 NumberPad + 主鍵；桌面排在 main 下方且非 sticky -->
    <BottomBar v-if="board">
      <div class="mx-auto flex w-full max-w-5xl flex-col gap-2 md:gap-3">
        <NumberPad
          :remaining-counts="remainingCounts"
          :pencil-mode="pencilMode"
          @number="onNumber"
          @clear="onClear"
          @toggle-pencil="store.togglePencil"
        />
        <!-- 桌面顯示完整 ControlPanel；手機只顯示精簡主鍵 -->
        <div class="hidden md:block">
          <ControlPanel
            :can-undo="canUndo"
            :can-redo="canRedo"
            :auto-candidates="autoCandidates"
            @new-game="onNewGame"
            @undo="onUndo"
            @redo="onRedo"
            @hint="onHint"
            @toggle-auto-candidates="onToggleAutoCandidates"
            @check-errors="onCheckErrors"
          />
        </div>
        <div class="flex justify-between gap-2 md:hidden">
          <button
            class="flex-1 rounded border border-slate-300 bg-white py-2 text-sm disabled:opacity-50"
            :disabled="!canUndo"
            @click="onUndo"
          >
            ↶ Undo
          </button>
          <button
            class="flex-1 rounded border border-slate-300 bg-white py-2 text-sm disabled:opacity-50"
            :disabled="!canRedo"
            @click="onRedo"
          >
            ↷ Redo
          </button>
          <button
            class="flex-1 rounded border border-slate-300 bg-white py-2 text-sm"
            @click="onHint"
          >
            💡 提示
          </button>
          <button
            class="flex-1 rounded border border-slate-300 bg-white py-2 text-sm"
            :class="{ 'bg-amber-100': pencilMode }"
            @click="store.togglePencil"
          >
            ✏️ 鉛筆
          </button>
        </div>
      </div>
    </BottomBar>

    <!-- 手機版提示抽屜 -->
    <AppDrawer v-model:open="hintDrawerOpen" title="提示">
      <HintOverlay
        :step="currentHint"
        @apply="onApplyHint"
        @next="onNextHint"
        @close="
          () => {
            onCloseHint()
            hintDrawerOpen = false
          }
        "
      />
    </AppDrawer>

    <!-- 手機版「更多動作」抽屜 -->
    <AppDrawer v-model:open="moreDrawerOpen" title="更多動作">
      <div class="flex flex-col gap-2">
        <button
          class="rounded border border-slate-300 bg-white px-4 py-3 text-left"
          @click="onNewGameFromDrawer"
        >
          🎲 新局
        </button>
        <label class="flex items-center justify-between rounded border border-slate-300 bg-white px-4 py-3">
          <span>🔍 自動顯示候選數</span>
          <input
            type="checkbox"
            :checked="autoCandidates"
            @change="onToggleAutoCandidatesFromDrawer"
          />
        </label>
        <button
          class="rounded border border-slate-300 bg-white px-4 py-3 text-left"
          @click="onCheckErrorsFromDrawer"
        >
          ⚠️ 檢查衝突
        </button>
        <p class="px-1 pt-2 text-xs text-slate-500">
          目前難度：{{ difficultyLabel }}
        </p>
      </div>
    </AppDrawer>

    <!-- 難度選擇：手機底部 sheet、桌面置中卡片 -->
    <div
      v-if="showDifficultyPicker"
      class="fixed inset-0 z-40 flex items-end justify-center bg-slate-900/35 md:items-center"
      data-testid="difficulty-modal"
    >
      <div
        class="w-full max-w-md rounded-t-2xl bg-white p-6 md:rounded-2xl md:p-8"
      >
        <h2 class="mb-4 text-lg font-semibold">選擇難度</h2>
        <div class="grid grid-cols-2 gap-2">
          <button
            class="rounded border border-slate-300 bg-white px-4 py-3 hover:bg-slate-50"
            data-testid="pick-easy"
            @click="pickDifficulty('easy')"
          >
            簡單
          </button>
          <button
            class="rounded border border-slate-300 bg-white px-4 py-3 hover:bg-slate-50"
            data-testid="pick-medium"
            @click="pickDifficulty('medium')"
          >
            中等
          </button>
          <button
            class="rounded border border-slate-300 bg-white px-4 py-3 hover:bg-slate-50"
            data-testid="pick-hard"
            @click="pickDifficulty('hard')"
          >
            困難
          </button>
          <button
            class="rounded border border-slate-300 bg-white px-4 py-3 hover:bg-slate-50"
            data-testid="pick-expert"
            @click="pickDifficulty('expert')"
          >
            專家
          </button>
        </div>
        <button
          v-if="board"
          class="mt-4 w-full rounded px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"
          @click="cancelDifficulty"
        >
          取消
        </button>
      </div>
    </div>
  </div>
</template>
```

- [ ] **Step 6：移除整段 `<style scoped>...</style>`**

PlayView 原本的 scoped CSS 全部以 Tailwind 取代。如果發現某些 class（如 SudokuBoard / HintOverlay 內部）仍依賴外部，那些 class 來自子元件自己的 scoped CSS，不在本檔範圍。

直接刪除整段 style 區塊。

### 子任務 C：驗證

- [ ] **Step 7：跑 typecheck**

執行：`pnpm typecheck`
預期：PASS。若 unused import 警告，移除即可。

- [ ] **Step 8：跑既有測試（PlayView 沒有專屬測試，但跑全測試確認不影響其他元件）**

執行：`pnpm test`
預期：全綠。

- [ ] **Step 9：手動驗收**

`pnpm dev` 啟動，逐項目測：

桌面（≥ 1024）：
- [ ] AppHeader 顯示「← 首頁」「遊戲模式」「難度：xxx」（⋯ 鈕隱藏）
- [ ] 棋盤左、HintOverlay 右
- [ ] BottomBar 在 main 下方，NumberPad + ControlPanel 完整顯示，不 sticky

手機（375 寬）：
- [ ] AppHeader 顯示「← 首頁」「遊戲模式」「⋯」
- [ ] 棋盤填滿 ~92vw，HintOverlay 不顯示在右側
- [ ] BottomBar sticky 底部，含 NumberPad + 4 顆主鍵
- [ ] 點「💡 提示」→ Drawer 從下方滑入，看到提示卡片，點關閉或背景能關
- [ ] 點 Header「⋯」→ Drawer 出現 3 個選項（新局 / 自動候選 / 檢查衝突）
- [ ] 點「新局」→ 難度選擇從下方滑入（底部 sheet）
- [ ] Undo / Redo / 鉛筆 按鈕能用，狀態（鉛筆 highlight）正確
- [ ] 解開棋盤 → solved-banner 顯示「再來一局」可用

- [ ] **Step 10：commit**

```bash
git add src/views/PlayView.vue
git commit -m "feat(views): PlayView 手機 RWD 重構（三層骨架 + 提示抽屜 + sticky BottomBar）[73-play-view-rwd]"
```

## 完工條件

- [ ] PlayView 結構為三層（AppHeader / main / BottomBar）
- [ ] 手機版 HintOverlay 透過 AppDrawer 呈現，currentHint 有值自動開
- [ ] 手機版「⋯」抽屜含 3 個更多動作
- [ ] 桌面版維持兩欄 + ControlPanel 完整顯示
- [ ] 難度選擇 modal 手機為底部 sheet
- [ ] `pnpm typecheck` + `pnpm test` 全綠
- [ ] 手動驗收手機 / 桌面通過

## 設計決策備註

- 手機 BottomBar 內 4 顆主鍵直接寫死在 PlayView，不沿用 ControlPanel：因 ControlPanel 元件有自己的 scoped 樣式不易在 BottomBar 內排成 4 顆 inline、且 NumberPad 已單獨在 BottomBar 內
- HintOverlay 在桌面用 aside 顯示、手機用 Drawer 顯示：透過 `hidden md:block` / `<AppDrawer>` 分流，**渲染兩個實例**。可接受重複，避免條件渲染複雜化（HintOverlay 是 prop-driven 純展示元件，無內部狀態）
- 難度選擇沒改用 AppDrawer：因它需「桌面置中、手機底部 sheet」雙形態，AppDrawer 目前固定底部；直接用 inline div + Tailwind 切換更直觀
