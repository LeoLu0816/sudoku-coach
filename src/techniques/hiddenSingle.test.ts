// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { createEmptyBoard } from '@/core/board'
import { recomputeAllCandidates } from '@/core/validator'
import { parseBoardString } from '@/core/serializer'
import { getScenariosFor } from '@/fixtures'
import { hiddenSingleSolver } from '@/techniques/hiddenSingle'
import { scenarioToBoard } from '@/techniques/testUtils'

describe('hiddenSingleSolver', () => {
  it('meta 正確', () => {
    expect(hiddenSingleSolver.meta.id).toBe('hidden-single')
    expect(hiddenSingleSolver.meta.name).toBe('隱單')
  })

  // 注意：fixture 中部分 hidden-single 場景同時存在多個有效 hidden single（如某 row 只剩 1 個空格也是 hidden single）
  // 因此這裡採「驗證 step 為合法 hidden single」而非比對特定 target
  it.each(getScenariosFor('hidden-single'))('$id: 產生合法 hidden single step', (s) => {
    const board = scenarioToBoard(s)
    const step = hiddenSingleSolver.apply(board)
    expect(step).not.toBeNull()
    expect(step!.technique).toBe('hidden-single')
    expect(step!.action).toBe('place')
    expect(step!.placements?.length).toBeGreaterThan(0)
    // 驗證 placements 中的值確實是該空格的候選之一
    for (const p of step!.placements!) {
      expect(board.cells[p.index].value).toBe(0)
      expect(board.cells[p.index].candidates.has(p.value)).toBe(true)
    }
  })

  it('空盤 → null（沒有候選資訊則無法判定 hidden single）', () => {
    expect(hiddenSingleSolver.apply(createEmptyBoard())).toBeNull()
  })

  it('已解完盤面 → null', () => {
    const solution = '534678912672195348198342567859761423426853791713924856961537284287419635345286179'
    const board = recomputeAllCandidates(parseBoardString(solution))
    expect(hiddenSingleSolver.apply(board)).toBeNull()
  })
})
