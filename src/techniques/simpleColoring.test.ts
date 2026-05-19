// @vitest-environment node
import { describe, expect, it } from 'vitest'
import type { Board } from '@/types'
import { createEmptyBoard, setCandidates } from '@/core/board'
import { simpleColoringSolver } from '@/techniques/simpleColoring'

/**
 * 構建測試盤面：對指定 index 設定候選集合，未指定的格預設 {1..9}
 * 注意：此 helper 直接設 candidates，不走 recompute，方便構造特定盤面結構
 * 預設 {1..9} 可避免其他 row/col/box 意外形成 strong link
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

/** 由 (row, col) 取 index（0-based） */
function rc(row: number, col: number): number {
  return row * 9 + col
}

/** 預設候選 {1..9} 但移除特定數字 */
function without(removed: number[]): number[] {
  const all = [1, 2, 3, 4, 5, 6, 7, 8, 9]
  return all.filter((v) => !removed.includes(v))
}

describe('simpleColoringSolver', () => {
  it('meta 正確', () => {
    expect(simpleColoringSolver.meta.id).toBe('simple-coloring')
    expect(simpleColoringSolver.meta.name).toBe('Simple Coloring（單數字著色）')
    expect(simpleColoringSolver.meta.shortDesc).toBeTruthy()
  })

  it('規則 1（同色衝突）：兩個同色 B 落在同 row → 消去該色 d 候選', () => {
    // 構造 d=4 的著色鏈：
    //   col 0 strong:  R0C0 - R5C0
    //   box 3 strong:  R5C0 - R3C2
    //   col 2 strong:  R3C2 - R7C2
    //   row 7 strong:  R7C2 - R7C5
    //   col 5 strong:  R7C5 - R5C5
    // 著色：A = {R0C0, R3C2, R7C5}; B = {R5C0, R7C2, R5C5}
    // R5C0 與 R5C5 同 row 5（row 5 中 d=4 候選 ≥3，非 strong link）→ 同色 B 衝突
    // 期望：消去 B 色三格的 4
    const setup: Record<number, number[]> = {}
    const d = 4

    // col 0 strong link: R0C0, R5C0；其他 7 格移除 4
    for (const r of [1, 2, 3, 4, 6, 7, 8]) {
      setup[rc(r, 0)] = without([d])
    }
    // box 3 strong link: R5C0, R3C2；其他 7 格移除 4
    //   R3C0, R4C0 已由 col 0 移除
    setup[rc(3, 1)] = without([d])
    setup[rc(4, 1)] = without([d])
    setup[rc(4, 2)] = without([d])
    setup[rc(5, 1)] = without([d])
    setup[rc(5, 2)] = without([d])
    // col 2 strong link: R3C2, R7C2；其他 7 格移除 4
    //   R4C2, R5C2 已移除
    for (const r of [0, 1, 2, 6, 8]) {
      setup[rc(r, 2)] = without([d])
    }
    // row 7 strong link: R7C2, R7C5；其他 7 格移除 4
    //   R7C0 已移除
    for (const c of [1, 3, 4, 6, 7, 8]) {
      setup[rc(7, c)] = without([d])
    }
    // col 5 strong link: R7C5, R5C5；其他 7 格移除 4
    for (const r of [0, 1, 2, 3, 4, 6, 8]) {
      setup[rc(r, 5)] = without([d])
    }

    const board = makeBoard(setup)
    const step = simpleColoringSolver.apply(board)

    expect(step).not.toBeNull()
    if (!step) { return }

    expect(step.technique).toBe('simple-coloring')
    expect(step.action).toBe('eliminate')

    // 期望 B 色三格被消去
    const expectedTargets = [rc(5, 0), rc(5, 5), rc(7, 2)].sort((a, b) => a - b)
    expect([...step.targets].sort((a, b) => a - b)).toEqual(expectedTargets)

    // related 應為 A 色三格
    const expectedRelated = [rc(0, 0), rc(3, 2), rc(7, 5)].sort((a, b) => a - b)
    expect([...step.related].sort((a, b) => a - b)).toEqual(expectedRelated)

    expect(step.eliminations).toBeDefined()
    expect(step.eliminations!.length).toBe(3)
    for (const elim of step.eliminations!) {
      expect(elim.values).toEqual([d])
    }
    const elimIndices = new Set(step.eliminations!.map((e) => e.index))
    expect(elimIndices.has(rc(5, 0))).toBe(true)
    expect(elimIndices.has(rc(5, 5))).toBe(true)
    expect(elimIndices.has(rc(7, 2))).toBe(true)

    expect(step.explanation).toContain('4')
    expect(step.explanation).toContain('R6') // row 5 1-based
  })

  it('規則 2（看到兩色）：外部格同時 peer A 與 B → 消去該格 d 候選', () => {
    // 構造 d=4 的著色鏈：
    //   col 0 strong:  R0C0 - R5C0
    //   row 5 strong:  R5C0 - R5C8
    //   col 8 strong:  R5C8 - R0C8
    // 著色：A = {R0C0, R5C8}; B = {R5C0, R0C8}
    // R0C1..R0C7 在 row 0：同時 peer A(R0C0) 與 B(R0C8)；row 0 非 strong link → 為消去目標
    const setup: Record<number, number[]> = {}
    const d = 4

    // col 0 strong link: R0C0, R5C0；其他 7 格移除 4
    for (const r of [1, 2, 3, 4, 6, 7, 8]) {
      setup[rc(r, 0)] = without([d])
    }
    // col 8 strong link: R0C8, R5C8；其他 7 格移除 4
    for (const r of [1, 2, 3, 4, 6, 7, 8]) {
      setup[rc(r, 8)] = without([d])
    }
    // row 5 strong link: R5C0, R5C8；其他 7 格移除 4
    for (const c of [1, 2, 3, 4, 5, 6, 7]) {
      setup[rc(5, c)] = without([d])
    }

    const board = makeBoard(setup)
    const step = simpleColoringSolver.apply(board)

    expect(step).not.toBeNull()
    if (!step) { return }

    expect(step.technique).toBe('simple-coloring')
    expect(step.action).toBe('eliminate')

    // 期望消去 R0C1..R0C7 的 4（7 格）
    expect(step.eliminations).toBeDefined()
    expect(step.eliminations!.length).toBe(7)
    const elimIndices = new Set(step.eliminations!.map((e) => e.index))
    for (const c of [1, 2, 3, 4, 5, 6, 7]) {
      expect(elimIndices.has(rc(0, c))).toBe(true)
    }
    for (const elim of step.eliminations!) {
      expect(elim.values).toEqual([d])
    }

    // related 應包含 chain 四格
    const relatedSet = new Set(step.related)
    expect(relatedSet.has(rc(0, 0))).toBe(true)
    expect(relatedSet.has(rc(5, 0))).toBe(true)
    expect(relatedSet.has(rc(5, 8))).toBe(true)
    expect(relatedSet.has(rc(0, 8))).toBe(true)

    expect(step.explanation).toContain('4')
    expect(step.explanation).toContain('(A)')
    expect(step.explanation).toContain('(B)')
  })

  it('negative：盤面無任何 strong link → null', () => {
    // 所有格保持預設 {1..9} → 每 unit d 候選 9 個，無 strong link
    const board = makeBoard({})
    const step = simpleColoringSolver.apply(board)
    expect(step).toBeNull()
  })

  it('negative：有 strong link 鏈但無同色衝突也無雙色 peer → null', () => {
    // 只構造單條 strong link：col 0 d=4 在 R0C0, R8C0
    // A = {R0C0}, B = {R8C0}
    // 規則 1 不命中（每色只 1 格）
    // 規則 2：peer R0C0 且 peer R8C0 的格必為 col 0 中（其他 row, col 不交集），但 col 0 其他格 d=4 已移除 → 無目標
    const setup: Record<number, number[]> = {}
    const d = 4
    for (const r of [1, 2, 3, 4, 5, 6, 7]) {
      setup[rc(r, 0)] = without([d])
    }

    const board = makeBoard(setup)
    const step = simpleColoringSolver.apply(board)
    expect(step).toBeNull()
  })
})
