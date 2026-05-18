import { describe, it, expect } from 'vitest'
import type { Board } from '@/types'
import { createEmptyBoard, setCandidates } from '@/core/board'
import { xyWingSolver } from './xyWing'

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

describe('xyWingSolver', () => {
  it('meta 正確', () => {
    expect(xyWingSolver.meta.id).toBe('xy-wing')
    expect(xyWingSolver.meta.name).toBe('XY-Wing（XY 樞紐）')
    expect(typeof xyWingSolver.meta.shortDesc).toBe('string')
  })

  it('經典案例 1：pivot 與兩 wing 皆同 box，消去共同 peer 中的 Z', () => {
    // pivot R0C0(idx 0) = {2,6}
    // wing1 R0C1(idx 1) = {2,3}（與 pivot 同 row + 同 box）
    // wing2 R2C0(idx 18) = {6,3}（與 pivot 同 col + 同 box）
    // 共同 peer 候選含 Z=3 的目標：只留 idx 19 (R2C1)
    // 其他 box 0 內非 pivot/wing 的格不含 3，以避免被一起消
    const setup: Record<number, number[]> = {
      0: [2, 6], // pivot
      1: [2, 3], // wing1
      18: [6, 3], // wing2
      // box 0 內其他格清掉 3
      2: [1, 4, 5, 7, 8, 9], // R0C2
      9: [1, 4, 5, 7, 8, 9], // R1C0
      10: [1, 4, 5, 7, 8, 9], // R1C1
      11: [1, 4, 5, 7, 8, 9], // R1C2
      20: [1, 4, 5, 7, 8, 9], // R2C2
      // 目標格保留 3
      19: [3, 4, 5], // R2C1
    }
    const board = makeBoard(setup)
    const step = xyWingSolver.apply(board)

    expect(step).not.toBeNull()
    if (step === null) return

    expect(step.technique).toBe('xy-wing')
    expect(step.action).toBe('eliminate')
    expect(step.related.sort((a, b) => a - b)).toEqual([0, 1, 18])
    expect(step.targets).toContain(19)
    expect(step.eliminations).toBeDefined()
    const elim19 = step.eliminations?.find((e) => e.index === 19)
    expect(elim19?.values).toEqual([3])
    expect(step.explanation).toContain('R1C1')
    // pivot 應出現
    expect(step.explanation).toContain('R1C1') // pivot R0C0 顯示為 R1C1
  })

  it('經典案例 2：pivot 與 wing 跨 row/col/box 不同配置', () => {
    // pivot R4C4(idx 40) = {1,2}
    // wing1 R4C7(idx 43) = {1,5}（與 pivot 同 row，不同 box）
    // wing2 R7C4(idx 67) = {2,5}（與 pivot 同 col，不同 box）
    // 共同 peer of w1(R4C7) 與 w2(R7C4)：R7C7(idx 70)（w1 同 col + w2 同 row）
    // 該格保留候選 5 → 被消
    const setup: Record<number, number[]> = {
      40: [1, 2], // pivot
      43: [1, 5], // wing1
      67: [2, 5], // wing2
      70: [3, 5, 9], // 目標：R7C7 含 5 → 應被消
    }
    // 為避免其它 bivalue 結構先被找到，將 pivot/wing 周邊潛在 bivalue 抹除。
    // 不過 default 1..9 候選不會是 bivalue，因此預設環境中只有上面四格之外都是 size=9 cells，
    // 不會構成其他 bivalue triple。

    const board = makeBoard(setup)
    const step = xyWingSolver.apply(board)

    expect(step).not.toBeNull()
    if (step === null) return

    expect(step.technique).toBe('xy-wing')
    expect(step.action).toBe('eliminate')
    expect(step.related.sort((a, b) => a - b)).toEqual([40, 43, 67])
    expect(step.targets).toContain(70)
    const elim70 = step.eliminations?.find((e) => e.index === 70)
    expect(elim70?.values).toEqual([5])
  })

  it('negative：三格候選聯集超過 3 個數字 → 回傳 null', () => {
    // pivot {2,6}, wing1 {2,3}, wing2 {6,4}（聯集 {2,3,4,6} size=4，非 XY-Wing）
    const setup: Record<number, number[]> = {
      0: [2, 6],
      1: [2, 3],
      18: [6, 4],
    }
    const board = makeBoard(setup)
    const step = xyWingSolver.apply(board)
    expect(step).toBeNull()
  })

  it('negative：結構存在但共同 peer 無 Z 候選 → 回傳 null', () => {
    // 與案例 1 相同 XY-Wing 結構（pivot=idx0, w1=idx1, w2=idx18），
    // 但要確保任何 pivot 角色互換版本下，兩 wing 的所有共同 peer 都不含 Z。
    // 把與三格相關的 row 0 / row 2 / col 0 / col 1 / box 0 內所有非三格本身的格，
    // 候選全部改成 [4,5,7,8,9]（不含 2/3/6，即任何可能的 Z）
    const safeCands = [4, 5, 7, 8, 9]
    const pivotIdx = 0
    const w1Idx = 1
    const w2Idx = 18
    const threeIdx = new Set([pivotIdx, w1Idx, w2Idx])

    const setup: Record<number, number[]> = {
      [pivotIdx]: [2, 6],
      [w1Idx]: [2, 3],
      [w2Idx]: [6, 3],
    }

    // 蒐集要清掉的 index：row 0, row 2, col 0, col 1, box 0 內非三格的
    const indicesToClean = new Set<number>()
    for (let c = 0; c < 9; c++) {
      indicesToClean.add(0 * 9 + c) // row 0
      indicesToClean.add(2 * 9 + c) // row 2
    }
    for (let r = 0; r < 9; r++) {
      indicesToClean.add(r * 9 + 0) // col 0
      indicesToClean.add(r * 9 + 1) // col 1
    }
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        indicesToClean.add(r * 9 + c) // box 0
      }
    }
    for (const idx of indicesToClean) {
      if (!threeIdx.has(idx)) {
        setup[idx] = safeCands
      }
    }

    const board = makeBoard(setup)
    const step = xyWingSolver.apply(board)
    expect(step).toBeNull()
  })

  it('negative：只有兩個 bivalue 格 → 回傳 null', () => {
    const setup: Record<number, number[]> = {
      0: [2, 6],
      1: [2, 3],
    }
    const board = makeBoard(setup)
    const step = xyWingSolver.apply(board)
    expect(step).toBeNull()
  })
})
