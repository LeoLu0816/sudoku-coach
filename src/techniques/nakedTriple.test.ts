import { describe, expect, it } from 'vitest'
import { createEmptyBoard } from '@/core/board'
import { getScenariosFor } from '@/fixtures'
import { nakedTripleSolver } from '@/techniques/nakedTriple'
import { scenarioToBoard } from '@/techniques/testUtils'

describe('nakedTripleSolver', () => {
  it('meta 正確', () => {
    expect(nakedTripleSolver.meta.id).toBe('naked-triple')
    expect(nakedTripleSolver.meta.name).toBe('裸三')
  })

  it.each(getScenariosFor('naked-triple'))('$id: 通過 fixture 場景', (s) => {
    const board = scenarioToBoard(s)
    const step = nakedTripleSolver.apply(board)

    expect(step).not.toBeNull()
    expect(step!.technique).toBe('naked-triple')
    expect(step!.action).toBe('eliminate')

    // targets 需包含 expected.targets 中的所有格（順序無關）
    const expectedTargetSet = new Set(s.expected.targets)
    const actualTargetSet = new Set(step!.targets)
    for (const idx of expectedTargetSet) {
      expect(actualTargetSet.has(idx)).toBe(true)
    }

    // eliminations 逐格驗證（values 做集合比較，順序無關）
    const expectedElims = s.expected.eliminations!
    const actualElims = step!.eliminations!

    for (const expectedElim of expectedElims) {
      const actualElim = actualElims.find((e) => e.index === expectedElim.index)
      expect(actualElim).toBeDefined()
      expect(new Set(actualElim!.values)).toEqual(new Set(expectedElim.values))
    }
  })

  it('三格皆 size=3 的裸三情境（naked-triple-01）', () => {
    // R1C2(123)、R1C8(13)、R1C9(23) 聯集={1,2,3}，size 2/3 混合
    const s = getScenariosFor('naked-triple').find((x) => x.id === 'naked-triple-01')!
    const board = scenarioToBoard(s)
    const step = nakedTripleSolver.apply(board)
    expect(step).not.toBeNull()
    expect(step!.related.length).toBe(3)
  })

  it('混合 size=2 與 size=3 的裸三情境（naked-triple-02）', () => {
    // R3C1(123 size=3)、R8C1(23 size=2)、R9C1(13 size=2)
    const s = getScenariosFor('naked-triple').find((x) => x.id === 'naked-triple-02')!
    const board = scenarioToBoard(s)
    const step = nakedTripleSolver.apply(board)
    expect(step).not.toBeNull()
    expect(step!.action).toBe('eliminate')
  })

  it('空盤 → null（候選未設定，無法形成裸三）', () => {
    expect(nakedTripleSolver.apply(createEmptyBoard())).toBeNull()
  })
})
