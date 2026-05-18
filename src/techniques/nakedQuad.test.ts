// @vitest-environment node
import { describe, expect, it } from 'vitest'
import type { Board } from '@/types'
import { createEmptyBoard, setCandidates } from '@/core/board'
import { nakedQuadSolver } from '@/techniques/nakedQuad'

/**
 * 構建測試盤面：未指定的格預設 {1..9}，指定的覆寫
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

describe('nakedQuadSolver', () => {
  it('meta 正確', () => {
    expect(nakedQuadSolver.meta.id).toBe('naked-quad')
    expect(nakedQuadSolver.meta.name).toBe('裸四')
  })

  it('列裸四：四格候選聯集 = {1,2,3,4}，row 其他格應消去這四數', () => {
    // Row 0：前四格候選 ⊆ {1,2,3,4}，其餘格 {1..9}
    const board = makeBoard({
      0: [1, 2],
      1: [2, 3],
      2: [3, 4],
      3: [1, 4],
      // idx 4..8 預設 {1..9}
    })

    const step = nakedQuadSolver.apply(board)
    expect(step).not.toBeNull()
    expect(step!.technique).toBe('naked-quad')
    expect(step!.action).toBe('eliminate')
    expect(step!.related.sort((a, b) => a - b)).toEqual([0, 1, 2, 3])

    // 其餘 5 格 (idx 4..8) 應有 {1,2,3,4} 被消去
    const elimMap = new Map(step!.eliminations!.map((e) => [e.index, e.values.sort((a, b) => a - b)]))
    for (let i = 4; i <= 8; i++) {
      expect(elimMap.get(i)).toEqual([1, 2, 3, 4])
    }
    expect(step!.explanation).toMatch(/列/)
  })

  it('欄裸四：col 0 前四列形成裸四', () => {
    // Col 0 = idx 0, 9, 18, 27, ...
    const board = makeBoard({
      0: [5, 6],
      9: [6, 7],
      18: [7, 8],
      27: [5, 8],
      // idx 36..72 預設 {1..9}
    })

    const step = nakedQuadSolver.apply(board)
    expect(step).not.toBeNull()
    expect(step!.related.sort((a, b) => a - b)).toEqual([0, 9, 18, 27])
    expect(step!.explanation).toMatch(/欄/)
  })

  it('宮裸四：box 4 中四格形成裸四（box 中段，避開 row/col 先匹配）', () => {
    // Box 4 = idx 30,31,32, 39,40,41, 48,49,50（row 3-5, col 3-5）
    // 讓 box 4 中四格候選 ⊆ {1,2,3,4}，box 中其他格 {1..9}（這五格將被消去 1,2,3,4）
    const board = makeBoard({
      30: [1, 2],
      31: [2, 3],
      32: [3, 4],
      39: [1, 4],
      // 40, 41, 48, 49, 50 預設 {1..9}
    })

    const step = nakedQuadSolver.apply(board)
    expect(step).not.toBeNull()
    expect(step!.related.sort((a, b) => a - b)).toEqual([30, 31, 32, 39])
    // 由於 row 3 (idx 27..35) 也只有 30..32 三格被限制成 {1..4}，
    // row 3 不會 4 格聯集 {1..4}（idx 27..29, 33..35 都是 {1..9}），所以不是 naked quad
    // box 4 中前四格才是 naked quad
  })

  it('quad 包含 size=3 與 size=4 的格也算（聯集仍為 4）', () => {
    const board = makeBoard({
      0: [1, 2, 3],
      1: [2, 3, 4],
      2: [1, 4],
      3: [1, 2, 3, 4],
    })

    const step = nakedQuadSolver.apply(board)
    expect(step).not.toBeNull()
    expect(step!.related.sort((a, b) => a - b)).toEqual([0, 1, 2, 3])
  })

  it('無 naked quad 場景回 null', () => {
    // 全盤皆 {1..9}
    const setup: Record<number, number[]> = {}
    const board = makeBoard(setup)
    expect(nakedQuadSolver.apply(board)).toBeNull()
  })

  it('聯集 size > 4 不算 naked quad', () => {
    // 四格候選聯集 = {1..5}，不是 quad
    const board = makeBoard({
      0: [1, 2],
      1: [2, 3],
      2: [3, 4],
      3: [4, 5],
    })

    // 因為其他格也是 {1..9}，naked quad 不會發生
    // 但聯集 = {1..5}，size 5 ≠ 4
    const step = nakedQuadSolver.apply(board)
    // 可能其他 4 格組合滿足，但結構上不應有 quad；確認找到的 step（若有）union size === 4
    if (step !== null) {
      // 若找到，related 必然不是 [0,1,2,3]
      expect(step.related.sort((a, b) => a - b)).not.toEqual([0, 1, 2, 3])
    }
  })
})
