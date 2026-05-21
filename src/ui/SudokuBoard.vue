<script setup lang="ts">
import { computed } from 'vue'
import type { Board, CellIndex, Conflict } from '@/types'

// ────────────────────────────────────────────────
// Props / Emits 定義
// ────────────────────────────────────────────────

interface Props {
  board: Board
  selectedIndex: CellIndex | null
  conflicts: Conflict[]
  showCandidates: boolean
  /** 提示高亮：targets=主目標格、related=參考格；null=無提示 */
  hintHighlight?: { targets: CellIndex[]; related: CellIndex[] } | null
  /** 錯誤格（與 solution 不符或違反規則）— 顯示紅字 */
  wrongCells?: CellIndex[]
}

const props = withDefaults(defineProps<Props>(), {
  hintHighlight: null,
  wrongCells: () => [],
})

const emit = defineEmits<{
  /** 玩家點擊選格 */
  selectCell: [index: CellIndex]
  /** 鍵盤輸入（方向鍵 / 數字 / 退格）轉發給父元件 */
  keyInput: [payload: { index: CellIndex; key: string }]
}>()

// ────────────────────────────────────────────────
// 計算衍生狀態
// ────────────────────────────────────────────────

/** 衝突格 index 集合（O(1) 查詢） */
const conflictSet = computed<Set<CellIndex>>(() => {
  const s = new Set<CellIndex>()
  for (const c of props.conflicts) {
    s.add(c.index)
  }
  return s
})

/** 選中格的 peer 集合（同行、同列、同宮，共 20 格） */
const peerSet = computed<Set<CellIndex>>(() => {
  if (props.selectedIndex === null) {
    return new Set()
  }
  const target = props.board.cells[props.selectedIndex]
  const s = new Set<CellIndex>()
  for (const cell of props.board.cells) {
    if (cell.index === props.selectedIndex) {
      continue
    }
    if (cell.row === target.row || cell.col === target.col || cell.box === target.box) {
      s.add(cell.index)
    }
  }
  return s
})

/** 選中格的值（用於同值高亮） */
const selectedValue = computed<number | null>(() => {
  if (props.selectedIndex === null) {
    return null
  }
  const v = props.board.cells[props.selectedIndex].value
  return v === 0 ? null : v
})

/** 提示 targets 集合 */
const hintTargetSet = computed<Set<CellIndex>>(() => {
  if (!props.hintHighlight) {
    return new Set()
  }
  return new Set(props.hintHighlight.targets)
})

/** 提示 related 集合 */
const hintRelatedSet = computed<Set<CellIndex>>(() => {
  if (!props.hintHighlight) {
    return new Set()
  }
  return new Set(props.hintHighlight.related)
})

/** 錯誤格集合 */
const wrongSet = computed<Set<CellIndex>>(() => new Set(props.wrongCells))

// ────────────────────────────────────────────────
// 取得單格的 CSS class 清單
// 1. 基本 cell class
// 2. given / user 狀態
// 3. 選中、peer、同值、衝突、提示高亮
// ────────────────────────────────────────────────

function getCellClasses(index: CellIndex): Record<string, boolean> {
  const cell = props.board.cells[index]
  const isSelected = props.selectedIndex === index
  const isSameValue =
    !isSelected &&
    selectedValue.value !== null &&
    cell.value !== 0 &&
    cell.value === selectedValue.value

  return {
    cell: true,
    'is-given': cell.isGiven,
    'is-user': !cell.isGiven && cell.value !== 0,
    'is-selected': isSelected,
    'is-peer': !isSelected && peerSet.value.has(index),
    'is-same-value': isSameValue,
    'is-conflict': conflictSet.value.has(index),
    'is-wrong': wrongSet.value.has(index),
    'is-hint-target': hintTargetSet.value.has(index),
    'is-hint-related': hintRelatedSet.value.has(index),
  }
}

// ────────────────────────────────────────────────
// 候選數輔助：取得 3x3 微網格位置的候選值
// ────────────────────────────────────────────────

/** 取得 index 格、位置 pos（1..9）的候選數是否存在 */
function hasCandidate(index: CellIndex, pos: number): boolean {
  return props.board.cells[index].candidates.has(pos)
}

// ────────────────────────────────────────────────
// 互動處理
// ────────────────────────────────────────────────

/** 點擊格子 → emit selectCell */
function handleCellClick(index: CellIndex): void {
  emit('selectCell', index)
}

/** 元件根 keydown → 轉發給父元件 */
function handleKeyDown(event: KeyboardEvent): void {
  if (props.selectedIndex === null) {
    return
  }

  const handled = [
    'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
    '1', '2', '3', '4', '5', '6', '7', '8', '9',
    'Backspace', 'Delete',
  ]

  if (handled.includes(event.key)) {
    event.preventDefault()
    emit('keyInput', { index: props.selectedIndex, key: event.key })
  }
}
</script>

<template>
  <!-- 棋盤根元素，監聽鍵盤事件並允許 focus -->
  <div
    class="sudoku-board"
    tabindex="0"
    @keydown="handleKeyDown"
  >
    <div
      v-for="cell in board.cells"
      :key="cell.index"
      :class="getCellClasses(cell.index)"
      :data-index="cell.index"
      @click="handleCellClick(cell.index)"
    >
      <!-- 已填入數字（given 或玩家輸入） -->
      <template v-if="cell.value !== 0">
        <span class="cell-value">{{ cell.value }}</span>
      </template>

      <!-- 空格且顯示候選數：3x3 微網格，候選數 1-9 -->
      <template v-else-if="showCandidates">
        <div class="candidates-grid">
          <span
            v-for="pos in 9"
            :key="pos"
            class="candidate"
          >{{ hasCandidate(cell.index, pos) ? pos : '' }}</span>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
/* ────────────────────────────────────────────────
   棋盤佈局
   使用 CSS Grid 9x9，透過 nth-child 設定 3x3 宮粗框
──────────────────────────────────────────────── */
.sudoku-board {
  display: grid;
  grid-template-columns: repeat(9, 1fr);
  grid-template-rows: repeat(9, 1fr);
  width: min(92vw, 560px);
  aspect-ratio: 1;
  border: 2px solid #333;
  outline: none;
  user-select: none;
}

/* ────────────────────────────────────────────────
   單格基礎樣式
──────────────────────────────────────────────── */
.cell {
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #bbb;
  cursor: pointer;
  position: relative;
  background-color: #fff;
  transition: background-color 0.1s;
}

/* ────────────────────────────────────────────────
   3x3 宮粗框（右邊框）
   第 3、6 列（0-based col 2、5）右框加粗
──────────────────────────────────────────────── */
.cell:nth-child(9n + 3),
.cell:nth-child(9n + 6) {
  border-right: 2px solid #333;
}

/* 第 3、6 行（row 2、5）下框加粗 */
.cell:nth-child(n + 19):nth-child(-n + 27),
.cell:nth-child(n + 46):nth-child(-n + 54) {
  border-bottom: 2px solid #333;
}

/* ────────────────────────────────────────────────
   數字顯示
──────────────────────────────────────────────── */
.cell-value {
  font-size: clamp(1rem, 4vw, 1.5rem);
  line-height: 1;
}

.is-given .cell-value {
  font-weight: bold;
  color: #111;
}

.is-user .cell-value {
  color: #1d6fd8;
}

/* ────────────────────────────────────────────────
   高亮狀態（優先順序：conflict > selected > hint-target > same-value > peer > hint-related）
──────────────────────────────────────────────── */
.is-conflict {
  background-color: #ffe0e0 !important;
  color: #d00;
}

.is-conflict .cell-value {
  color: #d00;
}

/* 錯誤格（與解不符或違反規則）— 紅字（不一定有紅底，conflict 才有紅底） */
.is-wrong .cell-value {
  color: #d00;
  font-weight: 600;
}

.is-selected {
  background-color: #bbdefb;
}

.is-hint-target {
  background-color: #ffe082;
}

.is-same-value {
  background-color: #fff9c4;
}

.is-peer {
  background-color: #e8f4fd;
}

.is-hint-related {
  background-color: #e8f5e9;
}

/* ────────────────────────────────────────────────
   候選數微網格
──────────────────────────────────────────────── */
.candidates-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
  width: 100%;
  height: 100%;
  padding: 1px;
  box-sizing: border-box;
}

.candidate {
  font-size: clamp(8px, 1.6vw, 11px);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  line-height: 1;
}
</style>
