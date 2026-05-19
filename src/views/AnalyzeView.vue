<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import type { Board, CellIndex, CellValue, Difficulty, Puzzle, TechniqueId } from '@/types'
import { createBoardFromGiven } from '@/core/board'
import { useAnalyzeStore } from '@/stores/analyze'
import { useGameStore } from '@/stores/game'
import { usePlaybackStore } from '@/stores/playback'
import { fixturePuzzles } from '@/fixtures'
import PuzzleInputPanel from '@/ui/PuzzleInputPanel.vue'
import AppHeader from '@/ui/AppHeader.vue'

/**
 * AnalyzeView：分析模式 RWD
 * 流程：
 *  1. 玩家貼字串 / 手動點輸入 / 載入範例 → 設定 inputBoard
 *  2. 點分析 → analyzeStore.analyze(board) 判定唯一性 / 難度 / 步驟
 *  3. 唯一解 → 顯示結果（難度 + 技巧分布 + 進入觀摩按鈕）
 *  4. 進入觀摩 → 由 solveResult.finalBoard 組 Puzzle 灌入 playback store + 跳 /observe
 *  5. 手機：Tabs 切換輸入 / 結果；桌面：上下排列
 */

const router = useRouter()
const analyzeStore = useAnalyzeStore()
const gameStore = useGameStore()
const playbackStore = usePlaybackStore()

const { result } = storeToRefs(analyzeStore)

/** 元件層狀態：輸入棋盤 + 選中格 */
const board = ref<Board | null>(null)
const selectedIndex = ref<CellIndex | null>(null)

/** 手機版 Tab：'input' | 'result'，桌面忽略此狀態（兩者皆顯示） */
const activeTab = ref<'input' | 'result'>('input')

/** 分析成功 / 失敗後自動切到結果 Tab（桌面亦切，無視覺影響） */
watch(result, (next) => {
  if (next && (next.isUnique || next.error)) {
    activeTab.value = 'result'
  }
})

/** Tab 切換 */
function setTab(tab: 'input' | 'result'): void {
  activeTab.value = tab
}

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
  activeTab.value = 'input'
}

/** 載入範例：fixture easy-01 */
function onLoadSample(): void {
  const f = fixturePuzzles.find((p) => p.id === 'easy-01')
  if (!f) {
    return
  }
  const given = f.given
    .split('')
    .map((c) => (c === '.' || c === '0' ? 0 : Number(c))) as CellValue[]
  board.value = createBoardFromGiven(given)
  selectedIndex.value = null
  analyzeStore.clear()
}

/** 由當前分析結果組裝 Puzzle；無唯一解或無輸入則回 null */
function buildPuzzleFromResult(): Puzzle | null {
  if (!result.value?.isUnique || !result.value.solveResult || !board.value) {
    return null
  }
  const given = board.value.cells.map((c) => c.value) as CellValue[]
  const solution = result.value.solveResult.finalBoard.cells.map((c) => c.value) as CellValue[]
  return {
    id: `analyzed-${Date.now()}`,
    difficulty: result.value.difficulty ?? 'easy',
    given,
    solution,
  }
}

/** 進入觀摩：用分析結果建 Puzzle 灌入 playback store */
function enterObserve(): void {
  const puzzle = buildPuzzleFromResult()
  if (!puzzle) {
    return
  }
  playbackStore.loadPuzzle(puzzle)
  router.push({ name: 'observe' })
}

/** 進入遊戲：用分析結果建 Puzzle 灌入 game store；若有進行中且未解開的局先確認 */
function enterPlay(): void {
  const puzzle = buildPuzzleFromResult()
  if (!puzzle) {
    return
  }
  if (gameStore.puzzle && !gameStore.isSolved) {
    const ok = window.confirm('目前有進行中的局，載入新題目會覆蓋進度，確定繼續？')
    if (!ok) {
      return
    }
  }
  gameStore.loadPuzzle(puzzle)
  router.push({ name: 'play' })
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
  'hidden-triple': '隱三',
  'naked-quad': '裸四',
  'x-wing': 'X-Wing',
  swordfish: 'Swordfish',
  'xy-wing': 'XY-Wing',
  skyscraper: 'Skyscraper',
  'simple-coloring': 'Simple Coloring',
  'unique-rectangle': 'Unique Rectangle',
  'xyz-wing': 'XYZ-Wing',
  backtrack: '暴力回溯',
}

/** 難度中文名 */
const difficultyLabel: Record<Difficulty, string> = {
  easy: '簡單',
  medium: '中等',
  hard: '困難',
  expert: '專家',
  master: '大師',
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
  <div class="flex min-h-screen flex-col bg-slate-50 text-slate-800">
    <AppHeader title="分析模式" @back="goHome" />

    <!-- 手機版 Tabs：只在 < md 顯示 -->
    <nav class="sticky top-[57px] z-[5] flex border-b border-slate-200 bg-white md:hidden">
      <button
        class="flex-1 py-3 text-sm"
        :class="
          activeTab === 'input'
            ? 'border-b-2 border-blue-600 font-semibold text-blue-600'
            : 'text-slate-600'
        "
        data-testid="tab-input"
        @click="setTab('input')"
      >
        輸入
      </button>
      <button
        class="flex-1 py-3 text-sm"
        :class="
          activeTab === 'result'
            ? 'border-b-2 border-blue-600 font-semibold text-blue-600'
            : 'text-slate-600'
        "
        data-testid="tab-result"
        @click="setTab('result')"
      >
        結果
      </button>
    </nav>

    <main
      class="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center gap-4 px-3 py-4 md:px-6"
    >
      <!-- 輸入區：手機只在 activeTab='input' 顯示；桌面永遠顯示 -->
      <section v-show="activeTab === 'input'" class="w-full md:block">
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

      <!-- 結果區：手機只在 activeTab='result' 顯示；桌面永遠顯示 -->
      <section v-show="activeTab === 'result'" class="w-full md:block">
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
              <p
                v-if="result.solveResult?.outOfTechniqueScope"
                class="mt-2 text-sm text-amber-700"
                data-testid="out-of-technique-scope-note"
              >
                ⚠ 此題超出已實作技巧範圍：技巧層用盡後以暴力回溯（backtrack）填入剩餘格
              </p>
            </div>

            <div class="mt-4 flex flex-wrap gap-2">
              <button
                class="rounded bg-emerald-600 px-5 py-2 text-white hover:bg-emerald-700"
                data-testid="btn-enter-play"
                @click="enterPlay"
              >
                進入遊戲模式 →
              </button>
              <button
                class="rounded bg-blue-600 px-5 py-2 text-white hover:bg-blue-700"
                data-testid="btn-enter-observe"
                @click="enterObserve"
              >
                進入觀摩模式 →
              </button>
            </div>
          </div>
        </div>

        <div v-else class="rounded-lg bg-white px-6 py-8 text-center text-slate-500">
          <p class="m-0">尚未分析，請回到「輸入」貼上盤面後按「分析」</p>
        </div>
      </section>

      <!-- 桌面：無 result 時的 hint（手機已有 Tab 引導） -->
      <section v-if="!result" class="hidden w-full text-center text-slate-500 md:block">
        <p>請貼上 81 字串、手動輸入盤面，或點「載入範例」後按「分析」</p>
      </section>
    </main>
  </div>
</template>
