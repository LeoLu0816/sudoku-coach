<script setup lang="ts">
/**
 * 盤面輸入面板：提供兩種輸入方式
 * 1. 貼上 81 字串（上半 textarea 區域）
 * 2. 互動棋盤手動點格鍵入（下半 SudokuBoard）
 *
 * 純 prop-emit 設計，不持有 store 狀態
 */
import { ref, computed } from 'vue'
import type { Board, CellIndex, CellValue } from '@/types'
import { createEmptyBoard } from '@/core/board'
import { parseBoardString, SerializeError } from '@/core/serializer'
import SudokuBoard from '@/ui/SudokuBoard.vue'

// ────────────────────────────────────────────────
// Props / Emits
// ────────────────────────────────────────────────

interface Props {
  /** 目前輸入盤面（null = 空，元件內部會建空 board 顯示） */
  board: Board | null
  /** 目前選中格 */
  selectedIndex: number | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  /** 任何盤面改動都透過此事件回報新 board */
  'update:board': [board: Board]
  /** 玩家點選格子 */
  selectCell: [index: number]
  /** 點「分析」按鈕 */
  analyze: [board: Board]
  /** 點「清空」按鈕 */
  clear: []
  /** 點「載入範例」按鈕 */
  loadSample: []
}>()

// ────────────────────────────────────────────────
// 本地狀態
// ────────────────────────────────────────────────

/** textarea 的文字內容 */
const textInput = ref('')

/** 錯誤訊息（null = 無錯誤） */
const errorMsg = ref<string | null>(null)

/** 棋盤顯示用：若 board 為 null 則建空盤 */
const displayBoard = computed<Board>(() => props.board ?? createEmptyBoard())

/** 分析按鈕是否可用 */
const canAnalyze = computed<boolean>(() => props.board !== null)

// ────────────────────────────────────────────────
// 按鈕處理
// ────────────────────────────────────────────────

/**
 * 載入按鈕：解析 textarea 文字為 Board
 * 成功 → emit update:board；失敗 → 顯示中文錯誤訊息
 */
function handleLoad(): void {
  errorMsg.value = null
  try {
    const board = parseBoardString(textInput.value)
    // parseBoardString → createBoardFromGiven，非 0 格已 isGiven=true，符合需求
    emit('update:board', board)
  } catch (e) {
    if (e instanceof SerializeError) {
      if (e.reason === 'length') {
        errorMsg.value = '長度必須為 81 個字元（不含空白）'
      } else if (e.reason === 'invalid-char') {
        errorMsg.value = '含有非法字元，僅可用 0-9 與 . 或空白'
      } else {
        errorMsg.value = '解析失敗'
      }
    } else {
      errorMsg.value = '解析失敗'
    }
  }
}

/**
 * 清空按鈕：清除 textarea 與錯誤訊息，emit clear
 */
function handleClear(): void {
  textInput.value = ''
  errorMsg.value = null
  emit('clear')
}

/**
 * 載入範例按鈕：emit loadSample，由父元件負責填入題目
 */
function handleLoadSample(): void {
  errorMsg.value = null
  emit('loadSample')
}

/**
 * 分析按鈕：僅 board !== null 時可用，emit analyze
 */
function handleAnalyze(): void {
  if (props.board === null) {
    return
  }
  emit('analyze', props.board)
}

// ────────────────────────────────────────────────
// 棋盤互動處理
// ────────────────────────────────────────────────

/**
 * 棋盤點格 → 轉發 selectCell
 */
function handleSelectCell(index: CellIndex): void {
  emit('selectCell', index)
}

/**
 * 棋盤鍵盤輸入處理
 * - 數字 1-9：設定選中格 value=N, isGiven=true
 * - Backspace / Delete：清除選中格 value=0, isGiven=false
 * - 其他（方向鍵等）忽略
 *
 * setCellValue 不改 isGiven，需手動 map 設定
 */
function handleKeyInput(payload: { index: CellIndex; key: string }): void {
  const currentBoard = props.board ?? createEmptyBoard()
  const { index, key } = payload

  if (key === 'Backspace' || key === 'Delete') {
    // 清除格子：value=0, isGiven=false, candidates 清空
    const newBoard: Board = {
      cells: currentBoard.cells.map((c) =>
        c.index === index
          ? { ...c, value: 0 as CellValue, isGiven: false, candidates: new Set() }
          : c,
      ),
    }
    emit('update:board', newBoard)
  } else if (key >= '1' && key <= '9') {
    const v = Number(key) as CellValue
    // 設定格子：value=N, isGiven=true（玩家輸入視為題目給定），candidates 清空
    const newBoard: Board = {
      cells: currentBoard.cells.map((c) =>
        c.index === index
          ? { ...c, value: v, isGiven: true, candidates: new Set() }
          : c,
      ),
    }
    emit('update:board', newBoard)
  }
  // 方向鍵等其他按鍵不處理
}
</script>

<template>
  <!-- 盤面輸入面板：上半文字區、下半棋盤 -->
  <div class="puzzle-input-panel">

    <!-- 上半：文字輸入區 -->
    <div class="input-section">
      <label class="section-label">貼上 81 字串（0 或 . 表示空格）</label>

      <textarea
        v-model="textInput"
        class="text-input"
        data-testid="text-input"
        rows="4"
        placeholder="例：530070000600195000098000060800060003400803001700020006060000280000419005000080079"
      />

      <!-- 錯誤訊息 -->
      <p
        v-if="errorMsg !== null"
        class="error-msg"
        data-testid="error-msg"
      >
        {{ errorMsg }}
      </p>

      <!-- 按鈕列 -->
      <div class="btn-row">
        <button
          class="btn btn-primary"
          data-testid="btn-load"
          @click="handleLoad"
        >
          載入
        </button>

        <button
          class="btn btn-secondary"
          data-testid="btn-clear"
          @click="handleClear"
        >
          清空
        </button>

        <button
          class="btn btn-secondary"
          data-testid="btn-sample"
          @click="handleLoadSample"
        >
          載入範例
        </button>

        <button
          class="btn btn-analyze"
          data-testid="btn-analyze"
          :disabled="!canAnalyze"
          @click="handleAnalyze"
        >
          分析
        </button>
      </div>
    </div>

    <!-- 下半：互動棋盤 -->
    <div class="board-section">
      <SudokuBoard
        :board="displayBoard"
        :selected-index="selectedIndex"
        :conflicts="[]"
        :show-candidates="false"
        @select-cell="handleSelectCell"
        @key-input="handleKeyInput"
      />
    </div>

  </div>
</template>

<style scoped>
/* 整體容器：垂直排列 */
.puzzle-input-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 520px;
}

/* 區段標題 */
.section-label {
  display: block;
  font-size: 0.85rem;
  color: #555;
  margin-bottom: 6px;
}

/* 上半文字區 */
.input-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* 文字輸入框 */
.text-input {
  width: 100%;
  box-sizing: border-box;
  padding: 8px 10px;
  font-size: 0.9rem;
  font-family: monospace;
  border: 1px solid #ccc;
  border-radius: 6px;
  resize: vertical;
}

.text-input:focus {
  outline: none;
  border-color: #1d6fd8;
  box-shadow: 0 0 0 2px rgba(29, 111, 216, 0.2);
}

/* 錯誤訊息 */
.error-msg {
  margin: 0;
  padding: 6px 10px;
  font-size: 0.85rem;
  color: #d00;
  background: #fff0f0;
  border: 1px solid #fcc;
  border-radius: 4px;
}

/* 按鈕列 */
.btn-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

/* 按鈕共用底色 */
.btn {
  padding: 8px 16px;
  font-size: 0.9rem;
  border: 1px solid #ccc;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.15s;
}

.btn-primary {
  background: #1d6fd8;
  color: #fff;
  border-color: #1558b0;
}

.btn-primary:hover {
  background: #1558b0;
}

.btn-secondary {
  background: #fff;
  color: #333;
}

.btn-secondary:hover {
  background: #f0f0f0;
}

.btn-analyze {
  background: #4caf50;
  color: #fff;
  border-color: #388e3c;
}

.btn-analyze:hover:not(:disabled) {
  background: #43a047;
}

.btn-analyze:disabled {
  background: #ccc;
  border-color: #bbb;
  color: #888;
  cursor: not-allowed;
}

/* 下半棋盤區 */
.board-section {
  display: flex;
  justify-content: center;
}
</style>
