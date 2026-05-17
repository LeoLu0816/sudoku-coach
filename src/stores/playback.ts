import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Board, Puzzle, TechniqueStep } from '@/types'
import { createBoardFromGiven } from '@/core/board'
import { recomputeAllCandidates } from '@/core/validator'
import { applyStep, solveWithSteps } from '@/solver/orchestrator'

/** 自動播放速度 */
export type PlaybackSpeed = 'slow' | 'normal' | 'fast'

/** 速度對應毫秒 */
const SPEED_MS: Record<PlaybackSpeed, number> = {
  slow: 2000,
  normal: 1000,
  fast: 400,
}

/**
 * 觀摩模式 Pinia store（Setup 形式）
 * - loadPuzzle：解題並預先算出所有中間盤面
 * - next / prev / jumpTo：控制目前步驟
 * - play / pause / setSpeed：自動播放控制
 */
export const usePlaybackStore = defineStore('playback', () => {
  // ─── State ────────────────────────────────────────────────────────────
  const puzzle = ref<Puzzle | null>(null)
  const steps = ref<TechniqueStep[]>([])
  /** -1 = 初始盤面（尚未套用任何 step） */
  const currentStepIndex = ref<number>(-1)
  /** length = steps.length + 1；index 0 = 初始盤面，index N = 套用第 N-1 步後盤面 */
  const intermediateBoards = ref<Board[]>([])
  const autoPlaying = ref<boolean>(false)
  const speed = ref<PlaybackSpeed>('normal')

  /** interval handle，不暴露到 store 外部 */
  let _intervalId: ReturnType<typeof setInterval> | undefined

  // ─── Getters ──────────────────────────────────────────────────────────

  /**
   * 當前盤面
   * currentStepIndex=-1 → 初始盤面（index 0）
   * currentStepIndex=N  → 套用第 N 步後的盤面（index N+1）
   */
  const currentBoard = computed<Board | null>(
    () => intermediateBoards.value[currentStepIndex.value + 1] ?? null,
  )

  /** 當前步驟說明；初始盤面時為 null */
  const currentStep = computed<TechniqueStep | null>(() => {
    if (currentStepIndex.value < 0) return null
    return steps.value[currentStepIndex.value] ?? null
  })

  /** 是否已在最後一步 */
  const isAtEnd = computed<boolean>(
    () => currentStepIndex.value >= steps.value.length - 1,
  )

  /** 是否在初始盤面（尚未套用任何步驟） */
  const isAtStart = computed<boolean>(() => currentStepIndex.value === -1)

  // ─── Actions ──────────────────────────────────────────────────────────

  /** 內部：清除 interval */
  function _clearInterval(): void {
    if (_intervalId !== undefined) {
      clearInterval(_intervalId)
      _intervalId = undefined
    }
  }

  /** 內部：啟動 interval（每次推進一步，到末步自動暫停） */
  function _startInterval(): void {
    _clearInterval()
    const ms = SPEED_MS[speed.value]
    _intervalId = setInterval(() => {
      // 已在末步，停止播放
      if (currentStepIndex.value >= steps.value.length - 1) {
        pause()
        return
      }
      currentStepIndex.value += 1
      // 推進後若抵達末步，停止播放
      if (currentStepIndex.value >= steps.value.length - 1) {
        pause()
      }
    }, ms)
  }

  /**
   * 載入題目並預先解題
   * 1. 建立初始 board 並 recompute candidates
   * 2. 呼叫 solveWithSteps 取得完整步驟
   * 3. 逐步套用步驟，建立 intermediateBoards 陣列
   * 4. 重設所有狀態
   */
  function loadPuzzle(p: Puzzle): void {
    // 1. 建初始 board
    const initialBoard = recomputeAllCandidates(createBoardFromGiven(p.given))

    // 2. 解題取得完整步驟
    const result = solveWithSteps(initialBoard)

    // 3. 逐步建立中間盤面陣列
    // boards[0] = 初始盤面，boards[i] = 套用前 i 步後的盤面
    const boards: Board[] = [initialBoard]
    let current = initialBoard
    for (const step of result.steps) {
      current = recomputeAllCandidates(applyStep(current, step))
      boards.push(current)
    }

    // 4. 寫入狀態（先清除播放再更新）
    _clearInterval()
    puzzle.value = p
    steps.value = result.steps
    intermediateBoards.value = boards
    currentStepIndex.value = -1
    autoPlaying.value = false
  }

  /** 前進一步（末步後不 overflow） */
  function next(): void {
    if (currentStepIndex.value < steps.value.length - 1) {
      currentStepIndex.value += 1
    }
  }

  /** 後退一步（-1 後不再往前） */
  function prev(): void {
    if (currentStepIndex.value > -1) {
      currentStepIndex.value -= 1
    }
  }

  /**
   * 跳至指定步驟索引
   * 自動 clamp 至 [-1, steps.length - 1]
   */
  function jumpTo(index: number): void {
    const min = -1
    const max = steps.value.length - 1
    currentStepIndex.value = Math.max(min, Math.min(max, index))
  }

  /**
   * 開始自動播放
   * 以當前 speed 對應的毫秒設置 setInterval，每次推進一步；
   * 到末步後自動呼叫 pause
   */
  function play(): void {
    if (autoPlaying.value) return
    autoPlaying.value = true
    _startInterval()
  }

  /** 暫停自動播放 */
  function pause(): void {
    autoPlaying.value = false
    _clearInterval()
  }

  /**
   * 更新播放速度
   * 若正在播放，重啟 interval 以套用新速度
   */
  function setSpeed(s: PlaybackSpeed): void {
    speed.value = s
    if (autoPlaying.value) {
      _clearInterval()
      _startInterval()
    }
  }

  return {
    // state
    puzzle,
    steps,
    currentStepIndex,
    intermediateBoards,
    autoPlaying,
    speed,
    // getters
    currentBoard,
    currentStep,
    isAtEnd,
    isAtStart,
    // actions
    loadPuzzle,
    next,
    prev,
    jumpTo,
    play,
    pause,
    setSpeed,
  }
})
