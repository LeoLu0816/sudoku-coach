// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { createBoardFromGiven } from '@/core/board'
import { countSolutions } from '@/solver/backtrack'
import { generatePuzzle } from '@/generator/puzzleGenerator'

describe('generatePuzzle', () => {
  it('easy 題：可生成且唯一解', () => {
    const puzzle = generatePuzzle({ difficulty: 'easy', seed: 1, timeoutMs: 5000 })
    expect(puzzle.difficulty).toBe('easy')
    expect(puzzle.given).toHaveLength(81)
    expect(puzzle.solution).toHaveLength(81)
    const board = createBoardFromGiven(puzzle.given)
    expect(countSolutions(board, 2)).toBe(1)
  })

  it('medium 題：可生成且唯一解', () => {
    const puzzle = generatePuzzle({ difficulty: 'medium', seed: 2, timeoutMs: 5000 })
    expect(puzzle.difficulty).toBe('medium')
    const board = createBoardFromGiven(puzzle.given)
    expect(countSolutions(board, 2)).toBe(1)
  })

  it('hard 題：可生成且唯一解', () => {
    const puzzle = generatePuzzle({ difficulty: 'hard', seed: 3, timeoutMs: 10000 })
    expect(puzzle.difficulty).toBe('hard')
    const board = createBoardFromGiven(puzzle.given)
    expect(countSolutions(board, 2)).toBe(1)
  })

  it('expert 題：可生成且唯一解', () => {
    const puzzle = generatePuzzle({ difficulty: 'expert', seed: 4, timeoutMs: 10000 })
    expect(puzzle.difficulty).toBe('expert')
    const board = createBoardFromGiven(puzzle.given)
    expect(countSolutions(board, 2)).toBe(1)
  })

  it('given 中為 0 表示空格', () => {
    const puzzle = generatePuzzle({ difficulty: 'easy', seed: 5, timeoutMs: 5000 })
    const blanks = puzzle.given.filter((v) => v === 0).length
    expect(blanks).toBeGreaterThan(0)
    expect(blanks).toBeLessThan(81)
  })

  it('solution 為完整解（無 0）', () => {
    const puzzle = generatePuzzle({ difficulty: 'easy', seed: 6, timeoutMs: 5000 })
    expect(puzzle.solution.every((v) => v >= 1 && v <= 9)).toBe(true)
  })

  it('same seed → same puzzle（deterministic）', () => {
    const p1 = generatePuzzle({ difficulty: 'easy', seed: 42, timeoutMs: 5000 })
    const p2 = generatePuzzle({ difficulty: 'easy', seed: 42, timeoutMs: 5000 })
    expect(p1.given).toEqual(p2.given)
    expect(p1.solution).toEqual(p2.solution)
  })
})
