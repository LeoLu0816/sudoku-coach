// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { createEmptyBoard } from '@/core/board'
import { recomputeAllCandidates } from '@/core/validator'
import { parseBoardString } from '@/core/serializer'
import { getScenariosFor } from '@/fixtures'
import { hiddenPairSolver } from '@/techniques/hiddenPair'
import { scenarioToBoard } from '@/techniques/testUtils'

describe('hiddenPairSolver', () => {
  it('meta 正確', () => {
    expect(hiddenPairSolver.meta.id).toBe('hidden-pair')
    expect(hiddenPairSolver.meta.name).toBe('隱對')
  })

  it.each(getScenariosFor('hidden-pair'))('$id: eliminations 與 expected 一致', (s) => {
    const board = scenarioToBoard(s)
    const step = hiddenPairSolver.apply(board)

    expect(step).not.toBeNull()
    expect(step!.technique).toBe('hidden-pair')
    expect(step!.action).toBe('eliminate')

    // targets 與 expected 一致（不在意順序）
    expect(step!.targets.sort()).toEqual(s.expected.targets.slice().sort())

    // eliminations 比對：每個 expected elimination 的 index + values 必須出現在 step
    const actualElimMap = new Map(step!.eliminations!.map((e) => [e.index, e.values]))
    for (const expectedElim of s.expected.eliminations!) {
      const actualValues = actualElimMap.get(expectedElim.index)
      expect(actualValues).toBeDefined()
      expect(actualValues!.slice().sort()).toEqual(expectedElim.values.slice().sort())
    }
  })

  it('列隱對（hidden-pair-01）：正確辨識列場景', () => {
    const scenarios = getScenariosFor('hidden-pair')
    const s = scenarios.find((sc) => sc.id === 'hidden-pair-01')!
    const board = scenarioToBoard(s)
    const step = hiddenPairSolver.apply(board)

    expect(step).not.toBeNull()
    expect(step!.explanation).toMatch(/列/)
  })

  it('欄隱對（hidden-pair-02）：正確辨識欄場景', () => {
    const scenarios = getScenariosFor('hidden-pair')
    const s = scenarios.find((sc) => sc.id === 'hidden-pair-02')!
    const board = scenarioToBoard(s)
    const step = hiddenPairSolver.apply(board)

    expect(step).not.toBeNull()
    expect(step!.explanation).toMatch(/欄/)
  })

  it('宮隱對（hidden-pair-03）：正確辨識宮場景', () => {
    const scenarios = getScenariosFor('hidden-pair')
    const s = scenarios.find((sc) => sc.id === 'hidden-pair-03')!
    const board = scenarioToBoard(s)
    const step = hiddenPairSolver.apply(board)

    expect(step).not.toBeNull()
    expect(step!.explanation).toMatch(/宮/)
  })

  it('找不到隱對時回傳 null（空盤無候選）', () => {
    expect(hiddenPairSolver.apply(createEmptyBoard())).toBeNull()
  })

  it('已解完盤面 → null', () => {
    const solution = '534678912672195348198342567859761423426853791713924856961537284287419635345286179'
    const board = recomputeAllCandidates(parseBoardString(solution))
    expect(hiddenPairSolver.apply(board)).toBeNull()
  })
})
