<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import type { CellIndex, CellValue, Difficulty } from '@/types'
import { useGameStore } from '@/stores/game'
import SudokuBoard from '@/ui/SudokuBoard.vue'
import NumberPad from '@/ui/NumberPad.vue'
import ControlPanel from '@/ui/ControlPanel.vue'
import HintOverlay from '@/ui/HintOverlay.vue'
import AppHeader from '@/ui/AppHeader.vue'
import AppDrawer from '@/ui/AppDrawer.vue'
import BottomBar from '@/ui/BottomBar.vue'

/**
 * PlayView：遊戲模式 RWD 整合頁
 * 流程：
 *  1. mount 時若無 board 則彈出難度選單；有 board（persistence 還原）就直接玩
 *  2. 三層骨架：AppHeader / main / BottomBar
 *  3. 手機：HintOverlay 與「更多動作」走 AppDrawer；桌面維持兩欄
 *  4. 鍵盤事件：方向鍵移格、1-9 輸入、Backspace/Delete 清除
 */

const router = useRouter()
const store = useGameStore()
const { board, selectedIndex, pencilMode, currentHint } = storeToRefs(store)

// 衝突 / undo redo / 剩餘數量 / 已解開：以 computed 取 getter（避免 reactive 邊界問題）
const conflicts = computed(() => store.conflicts)
const canUndo = computed(() => store.canUndo)
const canRedo = computed(() => store.canRedo)
const remainingCounts = computed(() => store.remainingCounts)
const isSolved = computed(() => store.isSolved)
const wrongCells = computed(() => store.wrongCells)
const errorCount = computed(() => store.errorCount)

/** 是否顯示候選微網格：盤面上任一格有候選，或目前是鉛筆模式 */
const showCandidates = computed<boolean>(() => {
  if (pencilMode.value) {
    return true
  }
  if (!board.value) {
    return false
  }
  return board.value.cells.some((c) => c.candidates.size > 0)
})

/** 是否顯示難度選擇彈窗 */
const showDifficultyPicker = ref<boolean>(false)

/** 是否顯示錯誤檢查訊息 */
const errorBannerVisible = ref<boolean>(false)

/** 提示抽屜開關（手機版用，桌面版仍走 aside） */
const hintDrawerOpen = ref<boolean>(false)

/** 更多動作抽屜開關（手機版「⋯」用） */
const moreDrawerOpen = ref<boolean>(false)

/** 提示高亮（給 SudokuBoard 用） */
const hintHighlight = computed(() => {
  if (!currentHint.value) {
    return null
  }
  return {
    targets: currentHint.value.targets,
    related: currentHint.value.related,
  }
})

/** 判斷是否為手機版（< md 斷點 768px）— 用於避免桌面版多開提示抽屜 */
function isMobileViewport(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false
  }
  return window.matchMedia('(max-width: 767px)').matches
}

// 提示出現時自動打開抽屜：僅手機版才開（桌面已有右側 aside 顯示提示）
watch(currentHint, (next) => {
  if (next && isMobileViewport()) {
    hintDrawerOpen.value = true
  }
})

/** mount：若 store 還沒 board，預設彈難度選單 */
onMounted(() => {
  if (!board.value) {
    showDifficultyPicker.value = true
  }
})

/** 將鍵盤事件繫到 window，讓鍵盤輸入不需 focus 棋盤 */
function handleWindowKey(event: KeyboardEvent): void {
  if (!board.value || selectedIndex.value === null) {
    return
  }
  routeKey(event.key)
}

onMounted(() => {
  window.addEventListener('keydown', handleWindowKey)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleWindowKey)
})

/** SudokuBoard emit keyInput 時走同一路徑 */
function onBoardKey(payload: { index: CellIndex; key: string }): void {
  routeKey(payload.key)
}

/**
 * 鍵盤輸入分派：
 *  - 方向鍵 → 移動 selectedIndex
 *  - 數字 1-9 → store.inputNumber
 *  - Backspace / Delete → store.clearCell
 */
function routeKey(key: string): void {
  if (selectedIndex.value === null) {
    return
  }

  if (key === 'ArrowUp' || key === 'ArrowDown' || key === 'ArrowLeft' || key === 'ArrowRight') {
    moveSelection(key)
    return
  }

  if (/^[1-9]$/.test(key)) {
    store.inputNumber(Number(key) as CellValue)
    return
  }

  if (key === 'Backspace' || key === 'Delete') {
    store.clearCell()
  }
}

/** 依方向鍵移動選格（邊界內 clamp） */
function moveSelection(key: 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight'): void {
  if (selectedIndex.value === null) {
    return
  }
  const idx = selectedIndex.value
  const row = Math.floor(idx / 9)
  const col = idx % 9
  let nextRow = row
  let nextCol = col
  if (key === 'ArrowUp') {
    nextRow = Math.max(0, row - 1)
  } else if (key === 'ArrowDown') {
    nextRow = Math.min(8, row + 1)
  } else if (key === 'ArrowLeft') {
    nextCol = Math.max(0, col - 1)
  } else if (key === 'ArrowRight') {
    nextCol = Math.min(8, col + 1)
  }
  store.selectCell(nextRow * 9 + nextCol)
}

/** 選格（SudokuBoard 點擊） */
function onSelectCell(index: CellIndex): void {
  store.selectCell(index)
}

/** NumberPad 數字輸入 */
function onNumber(value: number): void {
  store.inputNumber(value as CellValue)
}

/** NumberPad 清除 */
function onClear(): void {
  store.clearCell()
}

/** ControlPanel actions */
function onNewGame(): void {
  showDifficultyPicker.value = true
}

function onUndo(): void {
  store.undo()
}

function onRedo(): void {
  store.redo()
}

function onHint(): void {
  store.requestHint()
}

/** 自動填入所有候選（一次計算） */
function onFillCandidates(): void {
  store.fillAllCandidates()
}

/** 移除所有鉛筆（清空所有格的候選） */
function onClearCandidates(): void {
  store.clearAllCandidates()
}

/** 一次清空所有錯誤格（與解不符的格子） */
function onClearWrong(): void {
  store.clearWrongCells()
}

/** 檢查錯誤：閃一下訊息（衝突已在棋盤上紅色顯示） */
function onCheckErrors(): void {
  errorBannerVisible.value = true
  setTimeout(() => {
    errorBannerVisible.value = false
  }, 2000)
}

/** HintOverlay actions */
function onApplyHint(): void {
  store.applyHint()
}

function onNextHint(): void {
  store.requestHint()
}

function onCloseHint(): void {
  store.clearHint()
}

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
function onFillCandidatesFromDrawer(): void {
  moreDrawerOpen.value = false
  onFillCandidates()
}

/** 從抽屜內按「移除所有鉛筆」 */
function onClearCandidatesFromDrawer(): void {
  moreDrawerOpen.value = false
  onClearCandidates()
}

/** 從抽屜內按「檢查衝突」 */
function onCheckErrorsFromDrawer(): void {
  moreDrawerOpen.value = false
  onCheckErrors()
}

/** 難度選擇：開新局 */
function pickDifficulty(d: Difficulty): void {
  store.newGame(d)
  showDifficultyPicker.value = false
}

function cancelDifficulty(): void {
  showDifficultyPicker.value = false
}

/** 回首頁 */
function goHome(): void {
  router.push({ name: 'home' })
}

/** 解完後再玩一局 */
function playAgain(): void {
  showDifficultyPicker.value = true
}

/** 標題顯示的難度文字 */
const difficultyLabel = computed(() => {
  const map: Record<Difficulty, string> = {
    easy: '簡單',
    medium: '中等',
    hard: '困難',
    expert: '專家',
    master: '大師',
  }
  return store.puzzle ? map[store.puzzle.difficulty] : '未開始'
})
</script>

<template>
  <div class="flex min-h-screen flex-col text-slate-800">
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
          <!-- 錯誤次數狀態列：放在棋盤上方 -->
          <div
            class="game-card flex w-full max-w-[560px] items-center justify-between px-4 py-2 text-sm font-semibold text-slate-700"
            data-testid="game-status-bar"
          >
            <span>難度：<span class="text-blue-600">{{ difficultyLabel }}</span></span>
            <span
              :class="errorCount > 0 ? 'text-rose-600' : 'text-slate-500'"
              data-testid="error-count"
            >
              ❌ 錯誤：<span class="text-base">{{ errorCount }}</span> 次
            </span>
          </div>

          <SudokuBoard
            :board="board"
            :selected-index="selectedIndex"
            :conflicts="conflicts"
            :wrong-cells="wrongCells"
            :show-candidates="showCandidates"
            :hint-highlight="hintHighlight"
            @select-cell="onSelectCell"
            @key-input="onBoardKey"
          />

          <div
            v-if="isSolved"
            class="game-card flex animate-pulse items-center gap-3 border-emerald-300 bg-gradient-to-b from-emerald-50 to-emerald-100 px-5 py-4"
            data-testid="solved-banner"
          >
            <p class="m-0 text-lg font-bold text-emerald-700">🎉 恭喜，你解開了！</p>
            <button
              class="game-btn game-btn-primary px-5 py-2 text-sm"
              data-testid="btn-play-again"
              @click="playAgain"
            >
              再來一局
            </button>
          </div>

          <div
            v-if="errorBannerVisible"
            class="game-card border-orange-300 bg-gradient-to-b from-orange-50 to-orange-100 px-4 py-2 text-sm text-orange-800"
            data-testid="error-banner"
          >
            {{
              conflicts.length === 0 ? '目前沒有衝突' : `發現 ${conflicts.length} 處衝突（已紅色標示）`
            }}
          </div>
        </div>

        <!-- 桌面：右側提示面板 -->
        <aside class="hidden md:block md:min-w-[280px] md:max-w-[360px]">
          <HintOverlay
            :step="currentHint"
            @apply="onApplyHint"
            @next="onNextHint"
            @close="onCloseHint"
          />
        </aside>
      </section>

      <section
        v-if="!board && !showDifficultyPicker"
        class="flex flex-col items-center gap-3 py-12"
      >
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
            @new-game="onNewGame"
            @undo="onUndo"
            @redo="onRedo"
            @hint="onHint"
            @fill-candidates="onFillCandidates"
            @clear-candidates="onClearCandidates"
            @check-errors="onCheckErrors"
          />
        </div>
        <div class="flex justify-between gap-2 md:hidden">
          <button
            class="game-btn flex-1 px-2 py-2 text-sm"
            :disabled="!canUndo"
            @click="onUndo"
          >
            ↶ Undo
          </button>
          <button
            class="game-btn flex-1 px-2 py-2 text-sm"
            :disabled="!canRedo"
            @click="onRedo"
          >
            ↷ Redo
          </button>
          <button
            class="game-btn game-btn-emphasis flex-1 px-2 py-2 text-sm"
            @click="onHint"
          >
            💡 提示
          </button>
          <button
            class="game-btn game-btn-danger flex-1 px-2 py-2 text-sm"
            data-testid="btn-clear-wrong"
            :disabled="wrongCells.length === 0"
            @click="onClearWrong"
          >
            🧹 清錯
          </button>
        </div>
      </div>
    </BottomBar>

    <!-- 手機版提示抽屜：透明背景 + bare 模式，HintOverlay 卡片直接作為主體，無雙層 chrome -->
    <AppDrawer v-model:open="hintDrawerOpen" transparent-backdrop bare>
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
      <div class="flex flex-col gap-3">
        <button class="game-btn justify-start px-4 py-3 text-left" @click="onNewGameFromDrawer">
          🎲 新局
        </button>
        <button
          class="game-btn justify-start px-4 py-3 text-left"
          data-testid="btn-fill-candidates-drawer"
          @click="onFillCandidatesFromDrawer"
        >
          🔍 自動填入候選
        </button>
        <button
          class="game-btn justify-start px-4 py-3 text-left"
          data-testid="btn-clear-candidates-drawer"
          @click="onClearCandidatesFromDrawer"
        >
          🧽 移除所有鉛筆
        </button>
        <button
          class="game-btn game-btn-emphasis justify-start px-4 py-3 text-left"
          @click="onCheckErrorsFromDrawer"
        >
          ⚠️ 檢查衝突
        </button>
        <p class="px-1 pt-1 text-xs text-slate-500">目前難度：{{ difficultyLabel }}</p>
      </div>
    </AppDrawer>

    <!-- 難度選擇：手機底部 sheet、桌面置中卡片 -->
    <div
      v-if="showDifficultyPicker"
      class="fixed inset-0 z-40 flex items-end justify-center bg-slate-900/50 backdrop-blur-sm md:items-center"
      data-testid="difficulty-modal"
    >
      <div
        class="game-card w-full max-w-md rounded-t-3xl border-slate-200 p-6 md:rounded-3xl md:p-8"
      >
        <h2 class="mb-5 text-xl font-bold text-slate-800">🎯 選擇難度</h2>
        <div class="grid grid-cols-2 gap-3">
          <button class="diff-btn diff-easy" data-testid="pick-easy" @click="pickDifficulty('easy')">
            簡單
          </button>
          <button
            class="diff-btn diff-medium"
            data-testid="pick-medium"
            @click="pickDifficulty('medium')"
          >
            中等
          </button>
          <button class="diff-btn diff-hard" data-testid="pick-hard" @click="pickDifficulty('hard')">
            困難
          </button>
          <button
            class="diff-btn diff-expert"
            data-testid="pick-expert"
            @click="pickDifficulty('expert')"
          >
            專家
          </button>
          <button
            class="diff-btn diff-master col-span-2"
            data-testid="pick-master"
            @click="pickDifficulty('master')"
          >
            大師
          </button>
        </div>
        <button
          v-if="board"
          class="mt-5 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100"
          @click="cancelDifficulty"
        >
          取消
        </button>
      </div>
    </div>
  </div>
</template>
