<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import type { Difficulty, Puzzle, CellIndex } from '@/types'
import { useGameStore } from '@/stores/game'
import { usePlaybackStore, type PlaybackSpeed } from '@/stores/playback'
import { generatePuzzle } from '@/generator/puzzleGenerator'
import SudokuBoard from '@/ui/SudokuBoard.vue'
import PlaybackPanel from '@/ui/PlaybackPanel.vue'
import HintOverlay from '@/ui/HintOverlay.vue'
import AppHeader from '@/ui/AppHeader.vue'
import AppDrawer from '@/ui/AppDrawer.vue'
import BottomBar from '@/ui/BottomBar.vue'

/**
 * ObserveView：觀摩模式 RWD
 * 流程：
 *  1. 取 gameStore 當前 puzzle（若有）→ 灌入 playbackStore
 *  2. 若都沒 puzzle 則顯示難度選擇 modal（手機底部 sheet / 桌面置中）
 *  3. 手機：PlaybackPanel 走抽屜，BottomBar 含 4 顆主控制鍵
 *  4. 桌面：維持兩欄
 */

const router = useRouter()
const gameStore = useGameStore()
const playbackStore = usePlaybackStore()

const { puzzle, steps, currentStepIndex, autoPlaying, speed, outOfTechniqueScope } =
  storeToRefs(playbackStore)

const currentBoard = computed(() => playbackStore.currentBoard)
const currentStep = computed(() => playbackStore.currentStep)

/** 顯示難度選擇彈窗 */
const showDifficultyPicker = ref<boolean>(false)

/** PlaybackPanel 抽屜開關（手機版用） */
const playbackDrawerOpen = ref<boolean>(false)

/** 提示高亮（用當前 step 推導，讓棋盤強調該步作用格） */
const hintHighlight = computed(() => {
  if (!currentStep.value) {
    return null
  }
  return {
    targets: currentStep.value.targets,
    related: currentStep.value.related,
  }
})

/** mount：若 playback store 沒題目，嘗試從 gameStore 接手；都沒就彈難度選 */
onMounted(() => {
  if (puzzle.value) {
    return
  }
  if (gameStore.puzzle) {
    playbackStore.loadPuzzle(gameStore.puzzle)
    return
  }
  showDifficultyPicker.value = true
})

/** 離開時暫停播放避免 timer 殘留 */
onUnmounted(() => {
  if (autoPlaying.value) {
    playbackStore.pause()
  }
})

/** 選難度 → 生成題目 → 灌入 playback store */
function pickDifficulty(d: Difficulty): void {
  const p: Puzzle = generatePuzzle({ difficulty: d, timeoutMs: 8000 })
  playbackStore.loadPuzzle(p)
  showDifficultyPicker.value = false
}

function cancelDifficulty(): void {
  showDifficultyPicker.value = false
}

/** 棋盤點擊：觀摩模式下不可填值，僅作觀察（無動作） */
function onSelectCell(_index: CellIndex): void {
  // 觀摩模式不接受編輯，僅顯示
}

/** PlaybackPanel 互動轉發到 store */
function onPrev(): void {
  playbackStore.prev()
}

function onNext(): void {
  playbackStore.next()
}

function onPlay(): void {
  playbackStore.play()
}

function onPause(): void {
  playbackStore.pause()
}

function onJumpTo(index: number): void {
  playbackStore.jumpTo(index)
}

function onSetSpeed(s: PlaybackSpeed): void {
  playbackStore.setSpeed(s)
}

/** 開步驟列表抽屜（手機版） */
function openPlaybackDrawer(): void {
  playbackDrawerOpen.value = true
}

/** 回首頁 */
function goHome(): void {
  router.push({ name: 'home' })
}

/** 重新選擇難度：開 picker，由使用者重新挑題 */
function reselectDifficulty(): void {
  if (autoPlaying.value) {
    playbackStore.pause()
  }
  showDifficultyPicker.value = true
}

const difficultyLabel = computed(() => {
  const map: Record<Difficulty, string> = {
    easy: '簡單',
    medium: '中等',
    hard: '困難',
    expert: '專家',
    master: '大師',
  }
  return puzzle.value ? map[puzzle.value.difficulty] : '未選'
})
</script>

<template>
  <div class="flex min-h-screen flex-col text-slate-800">
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
      <!-- 技巧層用盡警示（觀摩模式特有） -->
      <div
        v-if="currentBoard && outOfTechniqueScope"
        class="w-full max-w-5xl rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-800"
        data-testid="out-of-technique-scope-banner"
      >
        此題超出已實作技巧範圍：技巧層用盡後將以暴力回溯（backtrack）填入剩餘格。
      </div>

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

          <!-- 當前步驟說明（重用 HintOverlay，手機 / 桌面共用） -->
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

      <section
        v-if="!currentBoard && !showDifficultyPicker"
        class="flex flex-col items-center gap-3 py-12"
      >
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
        <button v-else class="flex-1 rounded bg-amber-500 py-2 text-sm text-white" @click="onPause">
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
          v-if="puzzle"
          class="mt-5 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100"
          @click="cancelDifficulty"
        >
          取消
        </button>
      </div>
    </div>
  </div>
</template>
