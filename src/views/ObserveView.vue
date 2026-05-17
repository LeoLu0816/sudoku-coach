<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import type { Difficulty, Puzzle, CellIndex } from '@/types'
import { useGameStore } from '@/stores/game'
import { usePlaybackStore, type PlaybackSpeed } from '@/stores/playback'
import { generatePuzzle } from '@/generator/puzzleGenerator'
import SudokuBoard from '@/ui/SudokuBoard.vue'
import PlaybackPanel from '@/ui/PlaybackPanel.vue'
import HintOverlay from '@/ui/HintOverlay.vue'

/**
 * ObserveView：觀摩模式
 * 流程：
 *  1. 取 gameStore 當前 puzzle（若有）→ 灌入 playbackStore
 *  2. 若都沒 puzzle 則顯示難度選擇 modal，選後生成題目並灌入
 *  3. 控制透過 PlaybackPanel 操作 playback store
 *  4. SudokuBoard 顯示 playback.currentBoard、用 currentStep 的 targets/related 做高亮
 */

const router = useRouter()
const gameStore = useGameStore()
const playbackStore = usePlaybackStore()

const {
  puzzle,
  steps,
  currentStepIndex,
  autoPlaying,
  speed,
} = storeToRefs(playbackStore)

const currentBoard = computed(() => playbackStore.currentBoard)
const currentStep = computed(() => playbackStore.currentStep)

/** 顯示難度選擇彈窗 */
import { ref } from 'vue'
const showDifficultyPicker = ref<boolean>(false)

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

/** 回首頁 */
function goHome(): void {
  router.push({ name: 'home' })
}

const difficultyLabel = computed(() => {
  const map: Record<Difficulty, string> = {
    easy: '簡單',
    medium: '中等',
    hard: '困難',
    expert: '專家',
  }
  return puzzle.value ? map[puzzle.value.difficulty] : '未選'
})
</script>

<template>
  <main class="observe">
    <header class="header">
      <button class="link-btn" @click="goHome">← 首頁</button>
      <h1>觀摩模式</h1>
      <span class="difficulty-tag">難度：{{ difficultyLabel }}</span>
    </header>

    <section v-if="currentBoard" class="layout" data-testid="observe-layout">
      <div class="board-area">
        <SudokuBoard
          :board="currentBoard"
          :selected-index="null"
          :conflicts="[]"
          :show-candidates="true"
          :hint-highlight="hintHighlight"
          @select-cell="onSelectCell"
        />

        <!-- 當前步驟說明（重用 HintOverlay） -->
        <HintOverlay :step="currentStep" @apply="onNext" @next="onNext" @close="goHome" />
      </div>

      <aside class="playback-area">
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

    <!-- 還沒題目且沒彈窗 -->
    <section v-if="!currentBoard && !showDifficultyPicker" class="empty-state">
      <p>尚未載入題目</p>
      <button class="primary-btn" @click="showDifficultyPicker = true">選難度生成</button>
    </section>

    <!-- 難度選擇 modal -->
    <div v-if="showDifficultyPicker" class="modal-backdrop" data-testid="difficulty-modal">
      <div class="modal">
        <h2>選擇難度</h2>
        <div class="difficulty-buttons">
          <button data-testid="pick-easy" @click="pickDifficulty('easy')">簡單</button>
          <button data-testid="pick-medium" @click="pickDifficulty('medium')">中等</button>
          <button data-testid="pick-hard" @click="pickDifficulty('hard')">困難</button>
          <button data-testid="pick-expert" @click="pickDifficulty('expert')">專家</button>
        </div>
        <button v-if="puzzle" class="link-btn" @click="cancelDifficulty">取消</button>
      </div>
    </div>
  </main>
</template>

<style scoped>
.observe {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #f6f8fb;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, sans-serif;
  color: #1f2937;
}

.header {
  display: flex;
  align-items: center;
  gap: 16px;
  width: min(1100px, 100%);
}

.header h1 {
  margin: 0;
  font-size: 1.4rem;
  flex: 1;
}

.difficulty-tag {
  font-size: 0.9rem;
  color: #475569;
}

.link-btn {
  background: none;
  border: none;
  color: #2563eb;
  cursor: pointer;
  font-size: 0.95rem;
  padding: 4px 8px;
}

.layout {
  display: grid;
  grid-template-columns: auto 320px;
  gap: 24px;
  width: min(1100px, 100%);
  align-items: start;
}

@media (max-width: 900px) {
  .layout {
    grid-template-columns: 1fr;
  }
}

.board-area {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
  padding: 48px;
}

.primary-btn {
  padding: 10px 20px;
  background: #2563eb;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.primary-btn:hover {
  background: #1d4ed8;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgb(15 23 42 / 35%);
  display: grid;
  place-items: center;
  z-index: 100;
}

.modal {
  background: #fff;
  padding: 32px;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  min-width: 320px;
}

.modal h2 {
  margin: 0;
}

.difficulty-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  width: 100%;
}

.difficulty-buttons button {
  padding: 12px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
  font-size: 1rem;
}

.difficulty-buttons button:hover {
  background: #f1f5f9;
}
</style>
