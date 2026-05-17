import { describe, expect, it } from 'vitest'
import type {
  Board,
  Cell,
  Puzzle,
  SolveResult,
  TechniqueSolver,
  TechniqueStep,
} from '@/types'

describe('types', () => {
  const cells: Cell[] = Array.from({ length: 81 }, (_, i) => ({
    index: i,
    row: Math.floor(i / 9),
    col: i % 9,
    box: Math.floor(Math.floor(i / 9) / 3) * 3 + Math.floor((i % 9) / 3),
    value: 0,
    isGiven: false,
    candidates: new Set<number>(),
  }))
  const placeStep: TechniqueStep = {
    technique: 'naked-single',
    targets: [0],
    related: [1, 2],
    action: 'place',
    placements: [{ index: 0, value: 5 }],
    explanation: '此格僅剩唯一候選，因此可直接填入 5。',
  }

  it('可建立合法 Board', () => {
    const board: Board = { cells }

    expect(board.cells).toHaveLength(81)
  })

  it('可建立 place 類型的 TechniqueStep', () => {
    const step: TechniqueStep = placeStep

    expect(step.action).toBe('place')
  })

  it('可建立 eliminate 類型的 TechniqueStep', () => {
    const step: TechniqueStep = {
      technique: 'hidden-pair',
      targets: [10, 11],
      related: [9, 12],
      action: 'eliminate',
      eliminations: [{ index: 10, values: [3, 7] }],
      explanation: '此步可排除不可能的候選數。',
    }

    expect(step.action).toBe('eliminate')
  })

  it('TechniqueSolver 介面可被滿足', () => {
    const solver: TechniqueSolver = {
      meta: {
        id: 'backtrack',
        name: '回溯',
        shortDesc: '當一般技巧無法推進時使用。',
      },
      apply: () => placeStep,
    }

    expect(solver.apply({ cells })).toEqual(placeStep)
  })

  it('可建立合法 Puzzle', () => {
    const puzzle: Puzzle = {
      id: 'puzzle-001',
      difficulty: 'easy',
      given: Array.from({ length: 81 }, () => 0),
      solution: Array.from({ length: 81 }, (_, i) => ((i % 9) + 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9),
    }

    expect(puzzle.given).toHaveLength(81)
    expect(puzzle.solution).toHaveLength(81)
  })

  it('可建立合法 SolveResult', () => {
    const finalBoard: Board = { cells }
    const result: SolveResult = {
      solved: true,
      finalBoard,
      steps: [placeStep],
      techniqueUsage: {
        'naked-single': 1,
      },
      fallbackUsed: false,
    }

    expect(result.solved).toBe(true)
    expect(result.finalBoard.cells).toHaveLength(81)
    expect(result.steps).toEqual([placeStep])
  })
})
