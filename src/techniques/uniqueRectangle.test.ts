import { describe, it, expect } from 'vitest'
import type { Board } from '@/types'
import { createEmptyBoard, setCandidates } from '@/core/board'
import { uniqueRectangleSolver } from './uniqueRectangle'

/**
 * 建立測試用盤面：所有空格預設候選 1..9，
 * 然後依 setup 指定特定格的候選
 */
function makeBoard(setup: Record<number, number[]>): Board {
  let board = createEmptyBoard()
  const defaultCands = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9])
  for (let i = 0; i < 81; i++) {
    board = setCandidates(board, i, defaultCands)
  }
  for (const [idxStr, cands] of Object.entries(setup)) {
    board = setCandidates(board, Number(idxStr), new Set(cands))
  }
  return board
}

describe('uniqueRectangleSolver', () => {
  it('meta 正確', () => {
    expect(uniqueRectangleSolver.meta.id).toBe('unique-rectangle')
    expect(uniqueRectangleSolver.meta.name).toBe('Unique Rectangle Type 1（唯一矩形 T1）')
    expect(typeof uniqueRectangleSolver.meta.shortDesc).toBe('string')
  })

  it('經典 URec T1（單一 box）：R0C0/R0C1/R1C0 皆 {1,2}，R1C1={1,2,3} → R1C1 消 {1,2}', () => {
    // 4 角皆位於 box 0
    // R0C0 (idx 0)、R0C1 (idx 1)、R1C0 (idx 9) 候選恰為 {1,2}
    // R1C1 (idx 10) 候選 {1,2,3}（含 a,b 並有 extra）
    const setup: Record<number, number[]> = {
      0: [1, 2],
      1: [1, 2],
      9: [1, 2],
      10: [1, 2, 3],
    }
    const board = makeBoard(setup)
    const step = uniqueRectangleSolver.apply(board)

    expect(step).not.toBeNull()
    if (step === null) {
      return
    }

    expect(step.technique).toBe('unique-rectangle')
    expect(step.action).toBe('eliminate')
    expect(step.targets).toEqual([10])
    expect(step.related.sort((a, b) => a - b)).toEqual([0, 1, 9, 10])

    expect(step.eliminations).toBeDefined()
    const elim = step.eliminations?.find((e) => e.index === 10)
    expect(elim).toBeDefined()
    expect(elim!.values.sort((a, b) => a - b)).toEqual([1, 2])

    expect(step.explanation).toContain('R1C1')
    expect(step.explanation).toContain('{1, 2}')
  })

  it('跨 2 個 box 的矩形：R0C0/R0C3/R1C0 皆 {4,5}，R1C3={4,5,7} → R1C3 消 {4,5}', () => {
    // R0C0 (idx 0, box 0)、R0C3 (idx 3, box 1)
    // R1C0 (idx 9, box 0)、R1C3 (idx 12, box 1) → 共 2 個 box，符合 ≤2
    const setup: Record<number, number[]> = {
      0: [4, 5],
      3: [4, 5],
      9: [4, 5],
      12: [4, 5, 7],
    }
    const board = makeBoard(setup)
    const step = uniqueRectangleSolver.apply(board)

    expect(step).not.toBeNull()
    if (step === null) {
      return
    }

    expect(step.technique).toBe('unique-rectangle')
    expect(step.action).toBe('eliminate')
    expect(step.targets).toEqual([12])

    const elim = step.eliminations?.find((e) => e.index === 12)
    expect(elim).toBeDefined()
    expect(elim!.values.sort((a, b) => a - b)).toEqual([4, 5])
  })

  it('negative：第 4 角候選也是 {a,b}（沒有 extra）→ null（T1 不適用）', () => {
    // 4 角皆 bivalue {1,2} → deadly pattern 雖然存在，但 T1 規則要求第 4 角須有 extra
    const setup: Record<number, number[]> = {
      0: [1, 2],
      1: [1, 2],
      9: [1, 2],
      10: [1, 2],
    }
    const board = makeBoard(setup)
    const step = uniqueRectangleSolver.apply(board)
    expect(step).toBeNull()
  })

  it('negative：矩形跨越 ≥3 個 box → null', () => {
    // R0C0 (box 0)、R0C5 (box 1)、R3C0 (box 3)、R3C5 (box 4) → 4 個 box
    const setup: Record<number, number[]> = {
      0: [1, 2],
      5: [1, 2],
      27: [1, 2],
      32: [1, 2, 3],
    }
    const board = makeBoard(setup)
    const step = uniqueRectangleSolver.apply(board)
    expect(step).toBeNull()
  })

  it('negative：三個 bivalue 同 {a,b} 但不構成 2×2 矩形 → null', () => {
    // R0C0、R1C1、R2C2（對角線分布，rows 與 cols 都是 3 種）
    const setup: Record<number, number[]> = {
      0: [1, 2],
      10: [1, 2],
      20: [1, 2],
    }
    const board = makeBoard(setup)
    const step = uniqueRectangleSolver.apply(board)
    expect(step).toBeNull()
  })

  it('negative：bivalue 不足 3 格 → null', () => {
    const setup: Record<number, number[]> = {
      0: [1, 2],
      1: [1, 2],
    }
    const board = makeBoard(setup)
    const step = uniqueRectangleSolver.apply(board)
    expect(step).toBeNull()
  })

  it('negative：完全空盤（預設全 {1..9}，無 bivalue）→ null', () => {
    const board = makeBoard({})
    const step = uniqueRectangleSolver.apply(board)
    expect(step).toBeNull()
  })
})
