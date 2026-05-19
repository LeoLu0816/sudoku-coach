// @vitest-environment node
import { setActivePinia, createPinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import type { Puzzle } from '@/types'
import { parseBoardString } from '@/core/serializer'
import { recomputeAllCandidates, isSolved } from '@/core/validator'
import { solveWithSteps } from '@/solver/orchestrator'
import { usePlaybackStore } from '@/stores/playback'

/** 使用者回報的卡關題目：在第 31 步「指向對」處卡住 */
const USER_PUZZLE_GIVEN =
  '100800000054030000030006750070004020500003070810060000000000000709300800000609004'

/** 由 81 字串建出觀摩用 Puzzle */
function makePuzzle(): Puzzle {
  const board = recomputeAllCandidates(parseBoardString(USER_PUZZLE_GIVEN))
  const solveResult = solveWithSteps(board)
  return {
    id: 'user-bug-31',
    difficulty: 'expert',
    given: board.cells.map((c) => c.value) as Puzzle['given'],
    solution: solveResult.finalBoard.cells.map((c) => c.value) as Puzzle['solution'],
  }
}

describe('user-reported puzzle: 觀摩模式卡在指向對', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('solveWithSteps 確認此題技巧層用盡 + fallback 解出', () => {
    // 注意：即使 Phase 5 全部 Tier 1 + 5B 技巧（總計 9 個高階）註冊後，
    // 此題仍需 fallback。需要更深的 AIC / ALS / Forcing Chain 才可純技巧解出，
    // 暫定為「題目超出技巧範圍」由 outOfTechniqueScope 標示。
    const board = recomputeAllCandidates(parseBoardString(USER_PUZZLE_GIVEN))
    const result = solveWithSteps(board)
    expect(result.solved).toBe(true)
    expect(result.fallbackUsed).toBe(true)
    expect(result.outOfTechniqueScope).toBe(true)
    expect(isSolved(result.finalBoard)).toBe(true)
  })

  it('觀摩模式 loadPuzzle 後最後一步盤面應已完成（不會卡住）', () => {
    const store = usePlaybackStore()
    store.loadPuzzle(makePuzzle())

    // 跳到末步
    store.jumpTo(store.steps.length - 1)
    const finalBoard = store.currentBoard
    expect(finalBoard).not.toBeNull()
    expect(isSolved(finalBoard!)).toBe(true)
  })

  it('技巧層用盡後補的 fallback step 為 backtrack', () => {
    const store = usePlaybackStore()
    store.loadPuzzle(makePuzzle())

    const backtrackSteps = store.steps.filter((s) => s.technique === 'backtrack')
    // 此題技巧層解到第 31 步，剩 28 格需 backtrack 補
    expect(backtrackSteps.length).toBeGreaterThan(0)
    for (const s of backtrackSteps) {
      expect(s.action).toBe('place')
      expect(s.placements?.length).toBe(1)
    }
  })
})
