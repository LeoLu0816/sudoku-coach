import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Board, Puzzle, TechniqueStep } from '@/types'
import { createBoardFromGiven } from '@/core/board'
import { recomputeAllCandidates } from '@/core/validator'
import { applyStepAndUpdate, solveWithSteps } from '@/solver/orchestrator'

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
  /** 此題技巧層用盡，必須 fallback 才能完成 → UI 標示「超出技巧範圍」 */
  const outOfTechniqueScope = ref<boolean>(false)

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
   * 3. 若 fallback 完成解題，從 finalBoard diff 出剩餘格，補成 backtrack 步驟，
   *    讓觀摩模式不會卡在「技巧層用盡但盤面尚未填完」
   * 4. 逐步套用步驟，建立 intermediateBoards 陣列
   * 5. 重設所有狀態
   */
  function loadPuzzle(p: Puzzle): void {
    // 1. 建初始 board
    const initialBoard = recomputeAllCandidates(createBoardFromGiven(p.given))

    // 2. 解題取得完整步驟
    const result = solveWithSteps(initialBoard)

    // 3. 組裝完整 step 序列：技巧步驟 + (若 fallback) 補上 backtrack place steps
    const allSteps: TechniqueStep[] = [...result.steps]
    if (result.fallbackUsed && result.solved) {
      // 先套用所有技巧步驟，得到「技巧層用盡」的盤面
      let postTech = initialBoard
      for (const s of result.steps) {
        postTech = applyStepAndUpdate(postTech, s)
      }
      // diff finalBoard 對 postTech，逐格補成 backtrack 步驟
      for (let i = 0; i < 81; i++) {
        const before = postTech.cells[i]
        const after = result.finalBoard.cells[i]
        if (before.value === 0 && after.value !== 0) {
          allSteps.push({
            technique: 'backtrack',
            targets: [i],
            related: [],
            action: 'place',
            placements: [{ index: i, value: after.value }],
            explanation: `技巧層已無法繼續推進，由回溯演算法填入 ${after.value}`,
          })
        }
      }
    }

    // 4. 逐步建立中間盤面陣列
    // boards[0] = 初始盤面，boards[i] = 套用前 i 步後的盤面
    // 用增量更新避免抹掉 eliminate 步驟的消去結果（裸對等技巧）
    const boards: Board[] = [initialBoard]
    let current = initialBoard
    for (const step of allSteps) {
      current = applyStepAndUpdate(current, step)
      boards.push(current)
    }

    // 5. 寫入狀態（先清除播放再更新）
    _clearInterval()
    puzzle.value = p
    steps.value = allSteps
    intermediateBoards.value = boards
    currentStepIndex.value = -1
    autoPlaying.value = false
    outOfTechniqueScope.value = result.outOfTechniqueScope
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
    outOfTechniqueScope,
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
