// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { fixturePuzzles } from '@/fixtures'
import { parseBoardString, toBoardString } from '@/core/serializer'
import { isSolved } from '@/core/validator'
import { countSolutions, solve } from '@/solver/backtrack'

describe('solve', () => {
  it('解出全部 fixture 題目（20 題，含 expert）', () => {
    for (const p of fixturePuzzles) {
      const board = parseBoardString(p.given)
      const solution = solve(board)
      expect(solution).not.toBeNull()
      expect(toBoardString(solution!)).toBe(p.solution)
      expect(isSolved(solution!)).toBe(true)
    }
  })

  it('含矛盾的盤回 null', () => {
    const grid = '55' + '.'.repeat(79)
    const board = parseBoardString(grid)
    expect(solve(board)).toBeNull()
  })
})

describe('countSolutions', () => {
  it('全部 fixture 題目皆唯一解', () => {
    for (const p of fixturePuzzles) {
      const board = parseBoardString(p.given)
      expect(countSolutions(board, 2)).toBe(1)
    }
  })

  it('幾乎空盤 → >= limit', () => {
    const board = parseBoardString('.'.repeat(81))
    expect(countSolutions(board, 2)).toBe(2)
  })

  it('矛盾盤 → 0', () => {
    const grid = '55' + '.'.repeat(79)
    const board = parseBoardString(grid)
    expect(countSolutions(board, 2)).toBe(0)
  })
})

describe('效能基準', () => {
  it('簡單題 < 100ms', () => {
    const easyP = fixturePuzzles.find((p) => p.difficulty === 'easy')!
    const board = parseBoardString(easyP.given)
    const start = Date.now()
    solve(board)
    expect(Date.now() - start).toBeLessThan(100)
  })

  it('專家題 < 1000ms', () => {
    const expertP = fixturePuzzles.find((p) => p.difficulty === 'expert')!
    const board = parseBoardString(expertP.given)
    const start = Date.now()
    solve(board)
    expect(Date.now() - start).toBeLessThan(1000)
  })
})
