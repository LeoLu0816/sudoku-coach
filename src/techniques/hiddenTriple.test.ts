// @vitest-environment node
import { describe, expect, it } from 'vitest'
import type { Board } from '@/types'
import { createEmptyBoard, setCandidates } from '@/core/board'
import { hiddenTripleSolver } from '@/techniques/hiddenTriple'

/**
 * 構建測試盤面：對指定 index 設定候選集合，未指定的格預設 {1..9}
 * 注意：此 helper 直接設 candidates，不走 recompute，方便構造特定 unit 結構
 * 預設 {1..9} 確保其他 unit 不會意外形成 hidden triple
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

describe('hiddenTripleSolver', () => {
  it('meta 正確', () => {
    expect(hiddenTripleSolver.meta.id).toBe('hidden-triple')
    expect(hiddenTripleSolver.meta.name).toBe('隱三')
  })

  it('列隱三：{1,2,3} 只能填在前三格 → 消去前三格其他候選', () => {
    // Row 0：前三格各含 1,2,3 + 雜訊；其餘格不含 1,2,3
    const board = makeBoard({
      0: [1, 2, 3, 4, 5],
      1: [1, 2, 3, 6, 7],
      2: [1, 2, 3, 8, 9],
      3: [4, 5, 6, 7, 8, 9],
      4: [4, 5, 6, 7, 8, 9],
      5: [4, 5, 6, 7, 8, 9],
      6: [4, 5, 6, 7, 8, 9],
      7: [4, 5, 6, 7, 8, 9],
      8: [4, 5, 6, 7, 8, 9],
    })

    const step = hiddenTripleSolver.apply(board)
    expect(step).not.toBeNull()
    expect(step!.technique).toBe('hidden-triple')
    expect(step!.action).toBe('eliminate')
    expect(step!.targets.sort((a, b) => a - b)).toEqual([0, 1, 2])

    const elimMap = new Map(step!.eliminations!.map((e) => [e.index, e.values.sort((a, b) => a - b)]))
    expect(elimMap.get(0)).toEqual([4, 5])
    expect(elimMap.get(1)).toEqual([6, 7])
    expect(elimMap.get(2)).toEqual([8, 9])

    expect(step!.explanation).toMatch(/列/)
  })

  it('欄隱三：{4,5,6} 只能填在 col 0 的前三列', () => {
    // Col 0（idx 0, 9, 18, 27, 36, 45, 54, 63, 72）
    const board = makeBoard({
      0: [4, 5, 6, 1, 2],
      9: [4, 5, 6, 7, 8],
      18: [4, 5, 6, 3, 9],
      27: [1, 2, 3, 7, 8, 9],
      36: [1, 2, 3, 7, 8, 9],
      45: [1, 2, 3, 7, 8, 9],
      54: [1, 2, 3, 7, 8, 9],
      63: [1, 2, 3, 7, 8, 9],
      72: [1, 2, 3, 7, 8, 9],
    })

    const step = hiddenTripleSolver.apply(board)
    expect(step).not.toBeNull()
    expect(step!.targets.sort((a, b) => a - b)).toEqual([0, 9, 18])
    expect(step!.explanation).toMatch(/欄/)
  })

  it('宮隱三：{7,8,9} 只能填在第 0 宮前三格', () => {
    // Box 0 = idx 0,1,2,9,10,11,18,19,20
    // 讓 row 0 其他格也含 7,8,9（避免 row 先匹配）
    // 讓 col 0/1/2 其他格也含 7,8,9（避免 col 先匹配）
    const board = makeBoard({
      // box 0 的 row 0 三格
      0: [7, 8, 9, 1, 2],
      1: [7, 8, 9, 3, 4],
      2: [7, 8, 9, 5, 6],
      // box 0 的其餘格不含 7,8,9
      9: [1, 2, 3, 4, 5, 6],
      10: [1, 2, 3, 4, 5, 6],
      11: [1, 2, 3, 4, 5, 6],
      18: [1, 2, 3, 4, 5, 6],
      19: [1, 2, 3, 4, 5, 6],
      20: [1, 2, 3, 4, 5, 6],
      // row 0 中 box 0 外（idx 3..8）含 7,8,9 → row 0 positions(7,8,9) 非僅 {0,1,2}
      3: [7, 8, 9, 1, 2, 3, 4, 5, 6],
      4: [7, 8, 9, 1, 2, 3, 4, 5, 6],
      5: [7, 8, 9, 1, 2, 3, 4, 5, 6],
      6: [7, 8, 9, 1, 2, 3, 4, 5, 6],
      7: [7, 8, 9, 1, 2, 3, 4, 5, 6],
      8: [7, 8, 9, 1, 2, 3, 4, 5, 6],
      // col 0/1/2 的其他格（idx 27,36,45,54,63,72 / 28,37... / 29,38...）也填滿避免欄先匹配
      27: [1, 2, 3, 4, 5, 6, 7, 8, 9],
      36: [1, 2, 3, 4, 5, 6, 7, 8, 9],
      45: [1, 2, 3, 4, 5, 6, 7, 8, 9],
      54: [1, 2, 3, 4, 5, 6, 7, 8, 9],
      63: [1, 2, 3, 4, 5, 6, 7, 8, 9],
      72: [1, 2, 3, 4, 5, 6, 7, 8, 9],
      28: [1, 2, 3, 4, 5, 6, 7, 8, 9],
      37: [1, 2, 3, 4, 5, 6, 7, 8, 9],
      46: [1, 2, 3, 4, 5, 6, 7, 8, 9],
      55: [1, 2, 3, 4, 5, 6, 7, 8, 9],
      64: [1, 2, 3, 4, 5, 6, 7, 8, 9],
      73: [1, 2, 3, 4, 5, 6, 7, 8, 9],
      29: [1, 2, 3, 4, 5, 6, 7, 8, 9],
      38: [1, 2, 3, 4, 5, 6, 7, 8, 9],
      47: [1, 2, 3, 4, 5, 6, 7, 8, 9],
      56: [1, 2, 3, 4, 5, 6, 7, 8, 9],
      65: [1, 2, 3, 4, 5, 6, 7, 8, 9],
      74: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    })

    const step = hiddenTripleSolver.apply(board)
    expect(step).not.toBeNull()
    expect(step!.targets.sort((a, b) => a - b)).toEqual([0, 1, 2])
    expect(step!.explanation).toMatch(/宮/)
  })

  it('退化情形：三數其一只在兩格出現也算（union 仍 = 3）', () => {
    // {1,2,3} 中 1 只出現在格 0 與 1；2 只在 1 與 2；3 只在 0 與 2 → union={0,1,2}
    const board = makeBoard({
      0: [1, 3, 5, 7],
      1: [1, 2, 6, 8],
      2: [2, 3, 4, 9],
      3: [4, 5, 6, 7, 8, 9],
      4: [4, 5, 6, 7, 8, 9],
      5: [4, 5, 6, 7, 8, 9],
      6: [4, 5, 6, 7, 8, 9],
      7: [4, 5, 6, 7, 8, 9],
      8: [4, 5, 6, 7, 8, 9],
    })

    const step = hiddenTripleSolver.apply(board)
    expect(step).not.toBeNull()
    expect(step!.targets.sort((a, b) => a - b)).toEqual([0, 1, 2])
  })

  it('無 hidden triple 場景回 null（候選均勻分布）', () => {
    // 所有 81 格皆有 {1..9} 候選 → 每個 v 的 positions size 都是 9，不會被當 hidden triple 候選
    const setup: Record<number, number[]> = {}
    for (let i = 0; i < 81; i++) {
      setup[i] = [1, 2, 3, 4, 5, 6, 7, 8, 9]
    }
    const board = makeBoard(setup)

    expect(hiddenTripleSolver.apply(board)).toBeNull()
  })
})
