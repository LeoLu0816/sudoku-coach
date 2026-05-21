import { defineStore } from 'pinia'
import type { Board, CellIndex, CellValue, Conflict, Difficulty, Puzzle, TechniqueStep } from '@/types'
import {
  clearCell as boardClearCell,
  createBoardFromGiven,
  getPeers,
  setCandidates,
  setCellValue,
  toggleCandidate as boardToggleCandidate,
} from '@/core/board'
import { findConflicts, isSolved as boardIsSolved, recomputeAllCandidates } from '@/core/validator'
import { generatePuzzle } from '@/generator/puzzleGenerator'
import { applyStepAndUpdate, nextHintStep, nextHintStepWithFallback } from '@/solver/orchestrator'

/** 遊戲狀態 */
export interface GameState {
  puzzle: Puzzle | null
  board: Board | null
  selectedIndex: CellIndex | null
  pencilMode: boolean
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
      this.board = board
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

    /**
     * 輸入數字
     * - 鉛筆模式：切換該格候選
     * - 非鉛筆模式：填值；錯誤判定 +1；對候選做「增量更新」
     *   （清自身候選 + 從 peer 候選移除此值），不整盤 recompute → 不會抹掉先前 hint eliminate 的結果
     */
    inputNumber(value: number): void {
      if (!this.board || this.selectedIndex === null) return
      const cell = this.board.cells[this.selectedIndex]
      if (cell.isGiven) return

      if (this.pencilMode) {
        const next = boardToggleCandidate(this.board, this.selectedIndex, value)
        this._pushChange(next)
      } else {
        // 1. 錯誤判定
        if (value >= 1 && value <= 9 && this._isWrongInput(this.selectedIndex, value)) {
          this.errorCount += 1
        }
        // 2. 套用填值 + 增量候選更新
        let next = setCellValue(this.board, this.selectedIndex, value as CellValue)
        next = this._incrementalCandidateUpdateAfterPlace(next, this.selectedIndex, value)
        this._pushChange(next)
      }
    },

    /**
     * 在 index 放入 value 後，做增量候選更新：
     *   1. 清空 index 自身候選
     *   2. 從同行/欄/宮的 peer 候選中移除 value
     * 若整盤候選原本就空（使用者未按過自動候選），此 helper 也安全 — no-op-ish
     */
    _incrementalCandidateUpdateAfterPlace(board: Board, index: CellIndex, value: number): Board {
      let next = board
      // 清自身候選
      if (next.cells[index].candidates.size > 0) {
        next = setCandidates(next, index, new Set())
      }
      // peer 候選移除
      for (const peer of getPeers(next, index)) {
        if (peer.value !== 0) continue
        if (!peer.candidates.has(value)) continue
        const newCands = new Set(peer.candidates)
        newCands.delete(value)
        next = setCandidates(next, peer.index, newCands)
      }
      return next
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

    /** 清除選中格（值清為 0，候選不動） */
    clearCell(): void {
      if (!this.board || this.selectedIndex === null) return
      const cell = this.board.cells[this.selectedIndex]
      if (cell.isGiven) return

      const next = boardClearCell(this.board, this.selectedIndex)
      this._pushChange(next)
    },

    /**
     * 一次清空所有錯誤格（與 puzzle.solution 不符）的值
     * - 合併為單筆 history（可用 undo 一次還原）
     * - 不重置 errorCount（這是歷史錯誤計數）
     * - wrongCells 為空時 no-op
     */
    clearWrongCells(): void {
      if (!this.board || !this.puzzle) return
      const wrongs = this.wrongCells
      if (wrongs.length === 0) return

      let next = this.board
      for (const idx of wrongs) {
        next = boardClearCell(next, idx)
      }
      this._pushChange(next)
    },

    /**
     * 自動填入所有候選：對每個空格計算合法候選並寫入，覆蓋現有候選
     * - 使用者中途呼叫一次即可看到所有候選
     * - 推進 history → 可 undo 還原
     */
    fillAllCandidates(): void {
      if (!this.board) return
      const next = recomputeAllCandidates(this.board)
      this._pushChange(next)
    },

    /**
     * 移除所有鉛筆：把每格候選都清空（值不動）
     * - 推進 history → 可 undo 還原
     * - 整盤候選都已是空時 no-op
     */
    clearAllCandidates(): void {
      if (!this.board) return
      let next = this.board
      let changed = false
      for (const cell of this.board.cells) {
        if (cell.candidates.size > 0) {
          next = setCandidates(next, cell.index, new Set())
          changed = true
        }
      }
      if (!changed) return
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

    /**
     * 呼叫 orchestrator 取得下一步提示
     * 有 puzzle.solution 時走 fallback 版（技巧失效會給暴力回溯提示），避免玩家卡關；
     * 沒 puzzle（理論上不會發生於遊戲模式）退化為純技巧版
     */
    requestHint(): void {
      if (!this.board) return
      if (this.puzzle) {
        this.currentHint = nextHintStepWithFallback(this.board, this.puzzle.solution)
      } else {
        this.currentHint = nextHintStep(this.board)
      }
    },

    /**
     * 套用當前 hint
     * 流程：
     *   1. eliminate 類技巧（裸對 / 隱對 / X-Wing 等）只動候選；若 board 候選全空（使用者沒按過自動候選），eliminate 將 no-op → 先補上完整候選。
     *   2. 使用 applyStepAndUpdate 做「增量」更新，**不可** 用 recomputeAllCandidates 取代整盤重算，否則 eliminate 步驟剛消去的候選會被一筆抹回（這正是原本套用裸對沒反應的根因）。
     *   3. 套用完成後自動求下一步提示，讓使用者「套用 → 看到下一步」連貫；無剩餘提示則 currentHint=null（顯示空狀態）。
     */
    applyHint(): void {
      if (!this.board || !this.currentHint) return
      const step = this.currentHint

      // 若 board 候選全空（使用者沒按過自動候選），eliminate 將 no-op → 先補上完整候選
      if (step.action === 'eliminate') {
        const hasAnyCandidates = this.board.cells.some((c) => c.candidates.size > 0)
        if (!hasAnyCandidates) {
          this.board = recomputeAllCandidates(this.board)
        }
      }

      const next = applyStepAndUpdate(this.board, step)
      // _pushChange 會把 currentHint 清成 null；之後再自動求下一步
      this._pushChange(next)
      // 自動推進下一步也要走 fallback 版，否則套完暴力回溯這一格後若技巧仍失效會「無提示」
      if (this.puzzle) {
        this.currentHint = nextHintStepWithFallback(this.board, this.puzzle.solution)
      } else {
        this.currentHint = nextHintStep(this.board)
      }
    },

    clearHint(): void {
      this.currentHint = null
    },
  },
})
