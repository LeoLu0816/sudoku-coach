import { defineStore } from 'pinia'
import type { Board, CellIndex, CellValue, Conflict, Difficulty, Puzzle, TechniqueStep } from '@/types'
import {
  clearCell as boardClearCell,
  createBoardFromGiven,
  setCellValue,
  toggleCandidate as boardToggleCandidate,
} from '@/core/board'
import { findConflicts, isSolved as boardIsSolved, recomputeAllCandidates } from '@/core/validator'
import { generatePuzzle } from '@/generator/puzzleGenerator'
import { applyStep, nextHintStep } from '@/solver/orchestrator'

/** 遊戲狀態 */
export interface GameState {
  puzzle: Puzzle | null
  board: Board | null
  selectedIndex: CellIndex | null
  pencilMode: boolean
  autoCandidates: boolean
  /** undo 堆疊（記錄改動前的 Board） */
  history: Board[]
  /** redo 堆疊 */
  future: Board[]
  currentHint: TechniqueStep | null
  /** 累計錯誤次數（每次輸入錯誤值 +1，含同格反覆改錯） */
  errorCount: number
}

/**
 * 遊戲狀態 store
 * - 不可變更給定格（isGiven=true）
 * - 每次改動 board 將舊版推入 history、清空 future
 * - undo / redo 移動 board 在 history ↔ future
 */
export const useGameStore = defineStore('game', {
  state: (): GameState => ({
    puzzle: null,
    board: null,
    selectedIndex: null,
    pencilMode: false,
    autoCandidates: false,
    history: [],
    future: [],
    currentHint: null,
    errorCount: 0,
  }),

  getters: {
    /** 衝突清單 */
    conflicts(state): Conflict[] {
      if (!state.board) return []
      return findConflicts(state.board)
    },

    /** 是否解開 */
    isSolved(state): boolean {
      if (!state.board) return false
      return boardIsSolved(state.board)
    },

    canUndo(state): boolean {
      return state.history.length > 0
    },

    canRedo(state): boolean {
      return state.future.length > 0
    },

    /**
     * 錯誤格 index 清單：玩家填的、非 0、且與 puzzle.solution 不符的格子
     * 給 SudokuBoard 紅字標示用
     */
    wrongCells(state): CellIndex[] {
      if (!state.board || !state.puzzle) {
        return []
      }
      const wrong: CellIndex[] = []
      for (const cell of state.board.cells) {
        if (cell.isGiven || cell.value === 0) {
          continue
        }
        if (cell.value !== state.puzzle.solution[cell.index]) {
          wrong.push(cell.index)
        }
      }
      return wrong
    },

    /** 各數字剩餘可填數量（[1..9] 各算；length 9） */
    remainingCounts(state): number[] {
      const counts = Array(9).fill(9)
      if (!state.board) return counts
      for (const cell of state.board.cells) {
        if (cell.value !== 0) {
          counts[cell.value - 1] -= 1
        }
      }
      return counts
    },
  },

  actions: {
    /** 開新局：依難度生成 puzzle，初始化 board */
    newGame(difficulty: Difficulty): void {
      const puzzle = generatePuzzle({ difficulty, timeoutMs: 8000 })
      const board = createBoardFromGiven(puzzle.given)
      this.puzzle = puzzle
      this.board = this.autoCandidates ? recomputeAllCandidates(board) : board
      this.selectedIndex = null
      this.history = []
      this.future = []
      this.currentHint = null
      this.errorCount = 0
    },

    /** 載入既有題目（給 persistence 還原或分析模式用） */
    loadPuzzle(puzzle: Puzzle, board?: Board): void {
      const initialBoard = board ?? createBoardFromGiven(puzzle.given)
      this.puzzle = puzzle
      this.board = initialBoard
      this.selectedIndex = null
      this.history = []
      this.future = []
      this.currentHint = null
      this.errorCount = 0
    },

    /** 選格 */
    selectCell(index: CellIndex): void {
      this.selectedIndex = index
    },

    /** 內部：套用改動，推入歷史 */
    _pushChange(newBoard: Board): void {
      if (!this.board) return
      this.history.push(this.board)
      this.board = newBoard
      this.future = []
      this.currentHint = null
    },

    /** 輸入數字：依 pencilMode 切換填值或候選 */
    inputNumber(value: number): void {
      if (!this.board || this.selectedIndex === null) return
      const cell = this.board.cells[this.selectedIndex]
      if (cell.isGiven) return

      if (this.pencilMode) {
        const next = boardToggleCandidate(this.board, this.selectedIndex, value)
        this._pushChange(next)
      } else {
        // 1. 先判定本次輸入是否為錯誤（與解不符 或 違反同行/欄/宮規則），若是則 errorCount +1
        if (value >= 1 && value <= 9 && this._isWrongInput(this.selectedIndex, value)) {
          this.errorCount += 1
        }
        // 2. 套用填值
        let next = setCellValue(this.board, this.selectedIndex, value as CellValue)
        if (this.autoCandidates) next = recomputeAllCandidates(next)
        this._pushChange(next)
      }
    },

    /**
     * 判斷在 index 填入 value 是否為錯誤：
     *   1. 與 puzzle.solution 不符
     *   2. 同行/欄/宮已有相同值（peer 中存在）
     * 任一成立即為錯
     */
    _isWrongInput(index: CellIndex, value: number): boolean {
      if (!this.board || !this.puzzle) return false

      // 條件 1：與最終解不符
      if (this.puzzle.solution[index] !== value) {
        return true
      }

      // 條件 2：peer 中已存在相同值（違反盤面規則）
      const target = this.board.cells[index]
      for (const other of this.board.cells) {
        if (other.index === index) continue
        if (other.value !== value) continue
        if (other.row === target.row || other.col === target.col || other.box === target.box) {
          return true
        }
      }
      return false
    },

    /** 清除選中格 */
    clearCell(): void {
      if (!this.board || this.selectedIndex === null) return
      const cell = this.board.cells[this.selectedIndex]
      if (cell.isGiven) return

      let next = boardClearCell(this.board, this.selectedIndex)
      if (this.autoCandidates) next = recomputeAllCandidates(next)
      this._pushChange(next)
    },

    undo(): void {
      if (!this.board || this.history.length === 0) return
      const prev = this.history.pop()!
      this.future.push(this.board)
      this.board = prev
      this.currentHint = null
    },

    redo(): void {
      if (!this.board || this.future.length === 0) return
      const next = this.future.pop()!
      this.history.push(this.board)
      this.board = next
      this.currentHint = null
    },

    togglePencil(): void {
      this.pencilMode = !this.pencilMode
    },

    toggleAutoCandidates(): void {
      this.autoCandidates = !this.autoCandidates
      if (this.autoCandidates && this.board) {
        this.board = recomputeAllCandidates(this.board)
      }
    },

    /** 呼叫 orchestrator 取得下一步提示 */
    requestHint(): void {
      if (!this.board) return
      this.currentHint = nextHintStep(this.board)
    },

    /** 套用當前 hint */
    applyHint(): void {
      if (!this.board || !this.currentHint) return
      const next = applyStep(this.board, this.currentHint)
      this._pushChange(this.autoCandidates ? recomputeAllCandidates(next) : next)
    },

    clearHint(): void {
      this.currentHint = null
    },
  },
})
