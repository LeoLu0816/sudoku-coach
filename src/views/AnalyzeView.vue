<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import type { Board, CellIndex, CellValue, Difficulty, Puzzle, TechniqueId } from '@/types'
import { createBoardFromGiven } from '@/core/board'
import { useAnalyzeStore } from '@/stores/analyze'
import { usePlaybackStore } from '@/stores/playback'
import { fixturePuzzles } from '@/fixtures'
import PuzzleInputPanel from '@/ui/PuzzleInputPanel.vue'

/**
 * AnalyzeView：分析模式
 * 流程：
 *  1. 玩家貼字串 / 手動點輸入 / 載入範例 → 設定 inputBoard
 *  2. 點分析 → analyzeStore.analyze(board) 判定唯一性 / 難度 / 步驟
 *  3. 唯一解 → 顯示結果（難度 + 技巧分布 + 進入觀摩按鈕）
 *  4. 進入觀摩 → 由 solveResult.finalBoard 組 Puzzle 灌入 playback store + 跳 /observe
 */

const router = useRouter()
const analyzeStore = useAnalyzeStore()
const playbackStore = usePlaybackStore()

const { result } = storeToRefs(analyzeStore)

/** 元件層狀態：輸入棋盤 + 選中格 */
const board = ref<Board | null>(null)
const selectedIndex = ref<CellIndex | null>(null)

/** PuzzleInputPanel 事件：更新 board */
function onUpdateBoard(next: Board): void {
  board.value = next
}

function onSelectCell(index: CellIndex): void {
  selectedIndex.value = index
}

/** 點分析 */
function onAnalyze(b: Board): void {
  analyzeStore.analyze(b)
}

/** 清空 */
function onClear(): void {
  board.value = createBoardFromGiven(new Array(81).fill(0) as CellValue[])
  selectedIndex.value = null
  analyzeStore.clear()
}

/** 載入範例：fixture easy-01 */
function onLoadSample(): void {
  const f = fixturePuzzles.find((p) => p.id === 'easy-01')
  if (!f) {
    return
  }
  const given = f.given.split('').map((c) => (c === '.' || c === '0' ? 0 : Number(c))) as CellValue[]
  board.value = createBoardFromGiven(given)
  selectedIndex.value = null
  analyzeStore.clear()
}

/** 進入觀摩：用分析結果建 Puzzle 灌入 playback store */
function enterObserve(): void {
  if (!result.value?.isUnique || !result.value.solveResult || !board.value) {
    return
  }
  // 從輸入 board 抽 given；從 solveResult.finalBoard 抽 solution
  const given = board.value.cells.map((c) => c.value) as CellValue[]
  const solution = result.value.solveResult.finalBoard.cells.map((c) => c.value) as CellValue[]
  const puzzle: Puzzle = {
    id: `analyzed-${Date.now()}`,
    difficulty: result.value.difficulty ?? 'easy',
    given,
    solution,
  }
  playbackStore.loadPuzzle(puzzle)
  router.push({ name: 'observe' })
}

function goHome(): void {
  router.push({ name: 'home' })
}

/** 技巧 ID → 中文名 */
const techNameMap: Record<TechniqueId, string> = {
  'naked-single': '裸單',
  'hidden-single': '隱單',
  'naked-pair': '裸對',
  'hidden-pair': '隱對',
  'naked-triple': '裸三',
  'pointing-pair': '指向對',
  'box-line-reduction': '區塊行列消除',
  backtrack: '暴力回溯',
}

/** 難度中文名 */
const difficultyLabel: Record<Difficulty, string> = {
  easy: '簡單',
  medium: '中等',
  hard: '困難',
  expert: '專家',
}

/** 技巧使用次數陣列（給結果區渲染） */
const techniqueUsageList = computed(() => {
  const usage = result.value?.solveResult?.techniqueUsage ?? {}
  return Object.entries(usage)
    .filter(([, count]) => (count ?? 0) > 0)
    .map(([id, count]) => ({
      id: id as TechniqueId,
      name: techNameMap[id as TechniqueId],
      count: count as number,
    }))
})
</script>

<template>
  <main class="analyze">
    <header class="header">
      <button class="link-btn" @click="goHome">← 首頁</button>
      <h1>分析模式</h1>
    </header>

    <section class="input-area">
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

    <!-- 分析結果區 -->
    <section v-if="result" class="result-area" data-testid="analyze-result">
      <!-- 錯誤訊息 -->
      <div v-if="result.error" class="result-error" data-testid="result-error">
        <p>{{ result.error }}</p>
      </div>

      <!-- 成功分析 -->
      <div v-else-if="result.isUnique" class="result-ok">
        <h2>分析結果</h2>
        <p class="result-row">
          <span>唯一解：</span><strong>是</strong>
        </p>
        <p class="result-row">
          <span>難度：</span>
          <strong data-testid="result-difficulty">{{ result.difficulty ? difficultyLabel[result.difficulty] : '-' }}</strong>
        </p>
        <p class="result-row">
          <span>解題步驟總數：</span>
          <strong>{{ result.solveResult?.steps.length ?? 0 }}</strong>
        </p>

        <div class="usage-block">
          <h3>使用技巧</h3>
          <ul class="usage-list" data-testid="usage-list">
            <li v-for="item in techniqueUsageList" :key="item.id">
              <span>{{ item.name }}</span>
              <span class="count">×{{ item.count }}</span>
            </li>
          </ul>
          <p v-if="result.solveResult?.fallbackUsed" class="fallback-note">
            ⚠ 使用了暴力回溯（超出可解技巧範圍）
          </p>
        </div>

        <button class="primary-btn" data-testid="btn-enter-observe" @click="enterObserve">
          進入觀摩模式 →
        </button>
      </div>
    </section>

    <section v-else class="hint">
      <p>請貼上 81 字串、手動輸入盤面，或點「載入範例」後按「分析」</p>
    </section>
  </main>
</template>

<style scoped>
.analyze {
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

.input-area {
  width: min(960px, 100%);
}

.result-area {
  width: min(960px, 100%);
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 16px rgb(15 23 42 / 6%);
}

.result-area h2 {
  margin: 0 0 12px;
  font-size: 1.2rem;
}

.result-row {
  margin: 4px 0;
  display: flex;
  gap: 8px;
}

.result-row strong {
  color: #1d4ed8;
}

.usage-block {
  margin-top: 16px;
}

.usage-block h3 {
  margin: 0 0 8px;
  font-size: 1rem;
  color: #475569;
}

.usage-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 6px;
}

.usage-list li {
  display: flex;
  justify-content: space-between;
  padding: 6px 10px;
  background: #f1f5f9;
  border-radius: 6px;
}

.usage-list .count {
  font-weight: 600;
  color: #2563eb;
}

.fallback-note {
  margin: 8px 0 0;
  color: #b45309;
  font-size: 0.85rem;
}

.primary-btn {
  margin-top: 16px;
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

.result-error {
  padding: 16px 20px;
  background: #fef2f2;
  border: 1px solid #fca5a5;
  border-radius: 8px;
  color: #b91c1c;
}

.result-error p {
  margin: 0;
}

.hint {
  width: min(960px, 100%);
  text-align: center;
  padding: 24px;
  color: #64748b;
}
</style>
