---
id: 74-observe-view-rwd
phase: P6
status: todo
depends_on: [71-shared-components, 72-board-clamp-scaling]
assignee: claude-code
estimated_complexity: M
acceptance:
  - "ObserveView 套用三層骨架（AppHeader + main + BottomBar）"
  - "手機（< md）：PlaybackPanel 整塊改塞 AppDrawer，由「步驟列表」按鈕開啟"
  - "手機：BottomBar 含上一步 / 播放暫停 / 下一步 / 步驟列表 4 顆"
  - "桌面（≥ md）：維持兩欄 grid（棋盤左 + PlaybackPanel 右），BottomBar 退化為非 sticky 或隱藏"
  - "難度選擇 modal 在手機改為底部 sheet"
  - "ObserveView 既有功能（播放 / 暫停 / 上下步 / 跳到 / 設速度 / 重選難度）全部可用"
  - "pnpm typecheck / pnpm test 全綠"
deliverables:
  - "src/views/ObserveView.vue"
---

# Task 74: ObserveView 手機版重構

## 目標

把 ObserveView 改為 mobile-first 三層骨架，PlaybackPanel 在手機版收進 AppDrawer，BottomBar 提供 4 顆主要控制鍵。

## 變動檔案

- 修改：`src/views/ObserveView.vue`

## 前置確認

- [ ] **Step 1：讀現況**

`src/views/ObserveView.vue` 已在 spec 確認過：
- 主要 import 已含 SudokuBoard / PlaybackPanel / HintOverlay
- script 區會用 storeToRefs 從 playbackStore 拿 puzzle / steps / currentStepIndex / autoPlaying / speed
- 已有 reselectDifficulty / pickDifficulty / cancelDifficulty 等函式

## 實作步驟

### 子任務 A：script 補抽屜狀態

- [ ] **Step 2：新增 import 與抽屜狀態**

於既有 import 區追加：

```ts
import AppHeader from '@/ui/AppHeader.vue'
import AppDrawer from '@/ui/AppDrawer.vue'
import BottomBar from '@/ui/BottomBar.vue'
```

於既有 `showDifficultyPicker` 旁加：

```ts
/** PlaybackPanel 抽屜開關（手機版用） */
const playbackDrawerOpen = ref<boolean>(false)

/** 開步驟列表抽屜 */
function openPlaybackDrawer(): void {
  playbackDrawerOpen.value = true
}
```

### 子任務 B：template 重寫

- [ ] **Step 3：替換整段 `<template>`**

```vue
<template>
  <div class="flex min-h-screen flex-col bg-slate-50 text-slate-800">
    <AppHeader title="觀摩模式" @back="goHome">
      <template #actions>
        <span class="hidden text-sm text-slate-600 sm:inline">難度：{{ difficultyLabel }}</span>
        <button
          v-if="puzzle"
          class="rounded px-2 py-1 text-sm text-blue-600 hover:underline"
          data-testid="reselect-difficulty"
          @click="reselectDifficulty"
        >
          重選
        </button>
      </template>
    </AppHeader>

    <main class="flex w-full flex-1 flex-col items-center gap-4 px-3 py-4 md:px-6">
      <section
        v-if="currentBoard"
        class="grid w-full max-w-5xl items-start gap-4 md:grid-cols-[auto_1fr] md:gap-6"
        data-testid="observe-layout"
      >
        <div class="flex flex-col items-center gap-3">
          <SudokuBoard
            :board="currentBoard"
            :selected-index="null"
            :conflicts="[]"
            :show-candidates="true"
            :hint-highlight="hintHighlight"
            @select-cell="onSelectCell"
          />

          <!-- 當前步驟說明（重用 HintOverlay，兩端共用） -->
          <div class="w-full max-w-[560px]">
            <HintOverlay :step="currentStep" @apply="onNext" @next="onNext" @close="goHome" />
          </div>
        </div>

        <!-- 桌面：右側 PlaybackPanel -->
        <aside class="hidden md:block">
          <PlaybackPanel
            :steps="steps"
            :current-step-index="currentStepIndex"
            :auto-playing="autoPlaying"
            :speed="speed"
            @prev="onPrev"
            @next="onNext"
            @play="onPlay"
            @pause="onPause"
            @jump-to="onJumpTo"
            @set-speed="onSetSpeed"
          />
        </aside>
      </section>

      <section v-if="!currentBoard && !showDifficultyPicker" class="flex flex-col items-center gap-3 py-12">
        <p>尚未載入題目</p>
        <button
          class="rounded bg-blue-600 px-5 py-2 text-white hover:bg-blue-700"
          @click="showDifficultyPicker = true"
        >
          選難度生成
        </button>
      </section>
    </main>

    <!-- 手機 BottomBar：4 顆主控制鍵 -->
    <BottomBar v-if="currentBoard">
      <div class="mx-auto flex w-full max-w-5xl items-center gap-2 md:hidden">
        <button
          class="flex-1 rounded border border-slate-300 bg-white py-2 text-sm disabled:opacity-50"
          :disabled="currentStepIndex <= 0"
          @click="onPrev"
        >
          ◀ 上一步
        </button>
        <button
          v-if="!autoPlaying"
          class="flex-1 rounded bg-blue-600 py-2 text-sm text-white"
          @click="onPlay"
        >
          ▶ 播放
        </button>
        <button
          v-else
          class="flex-1 rounded bg-amber-500 py-2 text-sm text-white"
          @click="onPause"
        >
          ⏸ 暫停
        </button>
        <button
          class="flex-1 rounded border border-slate-300 bg-white py-2 text-sm disabled:opacity-50"
          :disabled="currentStepIndex >= steps.length"
          @click="onNext"
        >
          下一步 ▶
        </button>
        <button
          class="flex-1 rounded border border-slate-300 bg-white py-2 text-sm"
          @click="openPlaybackDrawer"
        >
          ☰ 步驟
        </button>
      </div>
    </BottomBar>

    <!-- 手機：PlaybackPanel 抽屜 -->
    <AppDrawer v-model:open="playbackDrawerOpen" title="解題步驟">
      <PlaybackPanel
        :steps="steps"
        :current-step-index="currentStepIndex"
        :auto-playing="autoPlaying"
        :speed="speed"
        @prev="onPrev"
        @next="onNext"
        @play="onPlay"
        @pause="onPause"
        @jump-to="
          (i) => {
            onJumpTo(i)
            playbackDrawerOpen = false
          }
        "
        @set-speed="onSetSpeed"
      />
    </AppDrawer>

    <!-- 難度選擇 modal：手機底部 sheet、桌面置中 -->
    <div
      v-if="showDifficultyPicker"
      class="fixed inset-0 z-40 flex items-end justify-center bg-slate-900/35 md:items-center"
      data-testid="difficulty-modal"
    >
      <div class="w-full max-w-md rounded-t-2xl bg-white p-6 md:rounded-2xl md:p-8">
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
          v-if="puzzle"
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

- [ ] **Step 4：移除整段 `<style scoped>...</style>`**

ObserveView 原本的 scoped CSS 全部刪除，全靠 Tailwind 與子元件 scoped CSS。

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
- [ ] 棋盤左 + PlaybackPanel 右兩欄；BottomBar 手機條（4 顆按鈕）不顯示
- [ ] HintOverlay 顯示在棋盤下方，當前步驟說明清楚
- [ ] PlaybackPanel 操作（播放 / 跳到 / 設速度）正常

手機（375 寬）：
- [ ] AppHeader 顯示「← 首頁」「觀摩模式」「重選」
- [ ] 棋盤填滿 ~92vw，下方有當前步驟說明（HintOverlay）
- [ ] BottomBar sticky 底部，4 顆鍵（上一步 / 播放暫停 / 下一步 / 步驟）
- [ ] 點「☰ 步驟」→ Drawer 從下方滑入，看到完整 PlaybackPanel
- [ ] 在抽屜內點某一步 → 跳到該步、抽屜自動關閉
- [ ] 從首頁進入時若無題目 → 難度選擇從下方滑入

- [ ] **Step 7：commit**

```bash
git add src/views/ObserveView.vue
git commit -m "feat(views): ObserveView 手機 RWD 重構（PlaybackPanel 進抽屜 + 4 顆 BottomBar）[74-observe-view-rwd]"
```

## 完工條件

- [ ] ObserveView 結構為三層骨架
- [ ] 手機版 PlaybackPanel 透過 AppDrawer 呈現
- [ ] 手機版 BottomBar 含 4 顆主控制鍵
- [ ] 桌面版維持兩欄
- [ ] 難度選擇 modal 手機為底部 sheet
- [ ] `pnpm typecheck` + `pnpm test` 全綠

## 設計決策備註

- BottomBar 用 `md:hidden` 內部容器：桌面不顯示，但 BottomBar 容器本身仍存在（讓 v-if 不影響 layout 計算）。實際視覺上桌面看不到任何 BottomBar 內容
- HintOverlay 手機 / 桌面都顯示在棋盤下方（不分流），因觀摩模式步驟說明是核心資訊，桌面也應該看到。spec 中提到的「桌面右側」其實是 PlaybackPanel
- 抽屜內點 jumpTo 自動關抽屜：讓使用者跳完能立即看到棋盤變化
