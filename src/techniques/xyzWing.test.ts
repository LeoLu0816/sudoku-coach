import { describe, it, expect } from 'vitest'
import type { Board } from '@/types'
import { createEmptyBoard, setCandidates } from '@/core/board'
import { xyzWingSolver } from './xyzWing'

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

describe('xyzWingSolver', () => {
  it('meta 正確', () => {
    expect(xyzWingSolver.meta.id).toBe('xyz-wing')
    expect(xyzWingSolver.meta.name).toBe('XYZ-Wing')
    expect(typeof xyzWingSolver.meta.shortDesc).toBe('string')
  })

  it('經典案例：pivot {1,2,3}、wing1 {2,3}、wing2 {1,3} 同 box，共同 peer 消去 Z=3', () => {
    // pivot R0C0(idx 0) = {1,2,3}
    // wing1 R0C1(idx 1) = {2,3}（與 pivot 同 row + 同 box，wing1 ⊂ pivot）
    // wing2 R1C0(idx 9) = {1,3}（與 pivot 同 col + 同 box，wing2 ⊂ pivot）
    // 三者皆在 box 0 → 共同 peer 包含 box 0 內其他 6 格
    // 預期 R1C1(idx 10) 保留 3 → 被消
    // 其他 box 0 內非三格的格清掉 3
    const setup: Record<number, number[]> = {
      0: [1, 2, 3], // pivot
      1: [2, 3], // wing1
      9: [1, 3], // wing2
      // box 0 內其他格清掉 3（避免被一起消，僅留 idx 10 作為目標）
      2: [4, 5, 6, 7, 8, 9], // R0C2
      10: [3, 4, 5], // R1C1 — 目標
      11: [4, 5, 6, 7, 8, 9], // R1C2
      18: [4, 5, 6, 7, 8, 9], // R2C0
      19: [4, 5, 6, 7, 8, 9], // R2C1
      20: [4, 5, 6, 7, 8, 9], // R2C2
    }
    const board = makeBoard(setup)
    const step = xyzWingSolver.apply(board)

    expect(step).not.toBeNull()
    if (step === null) {
      return
    }

    expect(step.technique).toBe('xyz-wing')
    expect(step.action).toBe('eliminate')
    expect(step.related.sort((a, b) => a - b)).toEqual([0, 1, 9])
    expect(step.targets).toContain(10)
    expect(step.eliminations).toBeDefined()
    const elim10 = step.eliminations?.find((e) => e.index === 10)
    expect(elim10?.values).toEqual([3])
    // 不應誤消 box 0 內其他不含 3 的格
    expect(step.targets).not.toContain(2)
    expect(step.targets).not.toContain(11)
    // explanation 應含 Z 值與 pivot 標籤
    expect(step.explanation).toContain('R1C1') // pivot R0C0 顯示為 R1C1
    expect(step.explanation).toContain('3')
  })

  it('雙 wing 同 row 配置：pivot 與兩 wing 皆在 row 0 + box 0', () => {
    // pivot R0C0(idx 0) = {1,2,3}
    // wing1 R0C1(idx 1) = {2,3}
    // wing2 R0C2(idx 2) = {1,3}
    // 三者同 row 0 + 同 box 0
    // 共同 peer 包括 row 0 其餘 6 格 + box 0 內其他 6 格（重疊去重）
    // 目標：R1C1(idx 10) 保留 3 → 被消；其它 box 0 內格清掉 3；row 0 之外
    // 注意 idx 3..8 (R0C3..R0C8) 為 row 0 內 peer，亦需清掉 3 避免被一起消
    const setup: Record<number, number[]> = {
      0: [1, 2, 3], // pivot
      1: [2, 3], // wing1
      2: [1, 3], // wing2
      // row 0 其餘格清掉 3
      3: [4, 5, 6, 7, 8, 9],
      4: [4, 5, 6, 7, 8, 9],
      5: [4, 5, 6, 7, 8, 9],
      6: [4, 5, 6, 7, 8, 9],
      7: [4, 5, 6, 7, 8, 9],
      8: [4, 5, 6, 7, 8, 9],
      // box 0 內其餘格：idx 9,10,11,18,19,20
      9: [4, 5, 6, 7, 8, 9],
      10: [3, 4, 5], // 目標
      11: [4, 5, 6, 7, 8, 9],
      18: [4, 5, 6, 7, 8, 9],
      19: [4, 5, 6, 7, 8, 9],
      20: [4, 5, 6, 7, 8, 9],
    }
    const board = makeBoard(setup)
    const step = xyzWingSolver.apply(board)

    expect(step).not.toBeNull()
    if (step === null) {
      return
    }

    expect(step.technique).toBe('xyz-wing')
    expect(step.action).toBe('eliminate')
    expect(step.related.sort((a, b) => a - b)).toEqual([0, 1, 2])
    expect(step.targets).toContain(10)
    const elim10 = step.eliminations?.find((e) => e.index === 10)
    expect(elim10?.values).toEqual([3])
  })

  it('negative：聯集超過 3 個數字 → 回傳 null', () => {
    // pivot {1,2,3}, wing1 {2,3}, wing2 {1,4}（wing2 不是 pivot 子集）
    // 聯集 {1,2,3,4}，非 XYZ-Wing
    const setup: Record<number, number[]> = {
      0: [1, 2, 3],
      1: [2, 3],
      9: [1, 4],
    }
    const board = makeBoard(setup)
    const step = xyzWingSolver.apply(board)
    expect(step).toBeNull()
  })

  it('negative：結構存在但共同 peer 無 Z 候選 → 回傳 null', () => {
    // 與經典案例相同 XYZ-Wing 結構，但讓所有可能的共同 peer 都不含 Z(=3)
    // pivot R0C0(idx 0)={1,2,3}、wing1 R0C1(idx 1)={2,3}、wing2 R1C0(idx 9)={1,3}
    // 三者共同 peer 範圍：box 0 內非三格的 6 格（idx 2,10,11,18,19,20）
    // 全部清掉 3
    const safeCands = [4, 5, 6, 7, 8, 9]
    const pivotIdx = 0
    const w1Idx = 1
    const w2Idx = 9
    const threeIdx = new Set([pivotIdx, w1Idx, w2Idx])

    const setup: Record<number, number[]> = {
      [pivotIdx]: [1, 2, 3],
      [w1Idx]: [2, 3],
      [w2Idx]: [1, 3],
    }

    // 蒐集要清的 index：box 0 內非三格、以及 pivot 所在 row 0 / col 0 內非三格
    // （避免任何潛在角色互換版本下出現含 Z 的共同 peer）
    const indicesToClean = new Set<number>()
    // row 0
    for (let c = 0; c < 9; c++) {
      indicesToClean.add(0 * 9 + c)
    }
    // row 1（wing2 所在）
    for (let c = 0; c < 9; c++) {
      indicesToClean.add(1 * 9 + c)
    }
    // col 0
    for (let r = 0; r < 9; r++) {
      indicesToClean.add(r * 9 + 0)
    }
    // col 1（wing1 所在）
    for (let r = 0; r < 9; r++) {
      indicesToClean.add(r * 9 + 1)
    }
    // box 0
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        indicesToClean.add(r * 9 + c)
      }
    }
    for (const idx of indicesToClean) {
      if (!threeIdx.has(idx)) {
        setup[idx] = safeCands
      }
    }

    const board = makeBoard(setup)
    const step = xyzWingSolver.apply(board)
    expect(step).toBeNull()
  })

  it('negative：沒有 3 候選 pivot → 回傳 null', () => {
    // 只有 bivalue，沒有 trivalue pivot
    const setup: Record<number, number[]> = {
      0: [1, 2],
      1: [2, 3],
      9: [1, 3],
    }
    const board = makeBoard(setup)
    const step = xyzWingSolver.apply(board)
    expect(step).toBeNull()
  })
})
