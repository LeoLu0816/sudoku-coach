import { describe, expect, it } from 'vitest'
import { createEmptyBoard } from '@/core/board'
import { recomputeAllCandidates } from '@/core/validator'
import { parseBoardString } from '@/core/serializer'
import { getScenariosFor } from '@/fixtures'
import { nakedSingleSolver } from '@/techniques/nakedSingle'
import { scenarioToBoard } from '@/techniques/testUtils'

describe('nakedSingleSolver', () => {
  it('meta 正確', () => {
    expect(nakedSingleSolver.meta.id).toBe('naked-single')
    expect(nakedSingleSolver.meta.name).toBe('裸單')
  })

  it.each(getScenariosFor('naked-single'))('$id: 通過 fixture 場景', (s) => {
    const board = scenarioToBoard(s)
    const step = nakedSingleSolver.apply(board)
    expect(step).not.toBeNull()
    expect(step!.technique).toBe('naked-single')
    expect(step!.targets).toEqual(s.expected.targets)
    expect(step!.action).toBe('place')
    expect(step!.placements).toEqual(s.expected.placements)
  })

  it('空盤 → null（無候選資訊則重算後仍無單候選格）', () => {
    expect(nakedSingleSolver.apply(createEmptyBoard())).toBeNull()
  })

  it('已解完盤面 → null', () => {
    const solution = '534678912672195348198342567859761423426853791713924856961537284287419635345286179'
    const board = recomputeAllCandidates(parseBoardString(solution))
    expect(nakedSingleSolver.apply(board)).toBeNull()
  })
})
