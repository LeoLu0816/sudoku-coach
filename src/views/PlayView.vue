<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import type { CellIndex, CellValue, Difficulty } from '@/types'
import { useGameStore } from '@/stores/game'
import SudokuBoard from '@/ui/SudokuBoard.vue'
import NumberPad from '@/ui/NumberPad.vue'
import ControlPanel from '@/ui/ControlPanel.vue'
import HintOverlay from '@/ui/HintOverlay.vue'

/**
 * PlayView：遊戲模式 MVP 整合頁
 * 流程：
 *  1. mount 時若無 board 則彈出難度選單；有 board（persistence 還原）就直接玩
 *  2. 整合 SudokuBoard / NumberPad / ControlPanel / HintOverlay 與 gameStore
 *  3. 鍵盤事件：方向鍵移格、1-9 輸入、Backspace/Delete 清除
 *  4. 解完後顯示「恭喜」+ 再來一局按鈕
 */

const router = useRouter()
const store = useGameStore()
const {
  board,
  selectedIndex,
  pencilMode,
  autoCandidates,
  currentHint,
} = storeToRefs(store)

// 衝突 / 可 undo redo / 剩餘數量 / 已解開：以 computed 取 getter（避免 reactive 邊界問題）
const conflicts = computed(() => store.conflicts)
const canUndo = computed(() => store.canUndo)
const canRedo = computed(() => store.canRedo)
const remainingCounts = computed(() => store.remainingCounts)
const isSolved = computed(() => store.isSolved)

/** 是否顯示難度選擇彈窗 */
const showDifficultyPicker = ref<boolean>(false)

/** 是否顯示錯誤檢查訊息 */
const errorBannerVisible = ref<boolean>(false)

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

function onToggleAutoCandidates(): void {
  store.toggleAutoCandidates()
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
  <main class="play">
    <!-- 上方標頭 -->
    <header class="header">
      <button class="link-btn" @click="goHome">← 首頁</button>
      <h1>遊戲模式</h1>
      <span class="difficulty-tag">難度：{{ difficultyLabel }}</span>
    </header>

    <!-- 主體：左邊棋盤 + 右邊提示面板 -->
    <section v-if="board" class="layout" data-testid="game-layout">
      <div class="board-area">
        <SudokuBoard
          :board="board"
          :selected-index="selectedIndex"
          :conflicts="conflicts"
          :show-candidates="autoCandidates || pencilMode"
          :hint-highlight="hintHighlight"
          @select-cell="onSelectCell"
          @key-input="onBoardKey"
        />

        <!-- 解開狀態 banner -->
        <div v-if="isSolved" class="solved-banner" data-testid="solved-banner">
          <p>🎉 恭喜，你解開了！</p>
          <button class="primary-btn" data-testid="btn-play-again" @click="playAgain">
            再來一局
          </button>
        </div>

        <!-- 檢查錯誤 banner -->
        <div v-if="errorBannerVisible" class="error-banner" data-testid="error-banner">
          {{ conflicts.length === 0 ? '目前沒有衝突' : `發現 ${conflicts.length} 處衝突（已紅色標示）` }}
        </div>
      </div>

      <aside class="hint-area">
        <HintOverlay
          :step="currentHint"
          @apply="onApplyHint"
          @next="onNextHint"
          @close="onCloseHint"
        />
      </aside>
    </section>

    <!-- 數字輸入盤 -->
    <section v-if="board" class="numberpad-row">
      <NumberPad
        :remaining-counts="remainingCounts"
        :pencil-mode="pencilMode"
        @number="onNumber"
        @clear="onClear"
        @toggle-pencil="store.togglePencil"
      />
    </section>

    <!-- 控制面板 -->
    <section v-if="board" class="control-row">
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
    </section>

    <!-- 沒有 board 且沒開啟難度選單時的空狀態 -->
    <section v-if="!board && !showDifficultyPicker" class="empty-state">
      <p>尚未開始任何題目</p>
      <button class="primary-btn" @click="onNewGame">開新局</button>
    </section>

    <!-- 難度選擇彈窗 -->
    <div v-if="showDifficultyPicker" class="modal-backdrop" data-testid="difficulty-modal">
      <div class="modal">
        <h2>選擇難度</h2>
        <div class="difficulty-buttons">
          <button data-testid="pick-easy" @click="pickDifficulty('easy')">簡單</button>
          <button data-testid="pick-medium" @click="pickDifficulty('medium')">中等</button>
          <button data-testid="pick-hard" @click="pickDifficulty('hard')">困難</button>
          <button data-testid="pick-expert" @click="pickDifficulty('expert')">專家</button>
        </div>
        <button v-if="board" class="link-btn" @click="cancelDifficulty">取消</button>
      </div>
    </div>
  </main>
</template>

<style scoped>
.play {
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
  width: min(960px, 100%);
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

.link-btn:hover {
  text-decoration: underline;
}

.layout {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 24px;
  width: min(960px, 100%);
  align-items: start;
}

@media (max-width: 768px) {
  .layout {
    grid-template-columns: 1fr;
  }
}

.board-area {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.hint-area {
  min-width: 280px;
}

.numberpad-row,
.control-row {
  width: min(960px, 100%);
  display: flex;
  justify-content: center;
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

.solved-banner {
  padding: 16px;
  background: #ecfdf5;
  border: 1px solid #6ee7b7;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 16px;
}

.solved-banner p {
  margin: 0;
  font-weight: 600;
  color: #047857;
}

.error-banner {
  padding: 8px 14px;
  background: #fff7ed;
  border: 1px solid #fdba74;
  border-radius: 6px;
  color: #9a3412;
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
