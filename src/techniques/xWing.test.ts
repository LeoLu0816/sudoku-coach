// @vitest-environment node
import { describe, expect, it } from 'vitest'
import type { Board } from '@/types'
import { createEmptyBoard, setCandidates } from '@/core/board'
import { xWingSolver } from '@/techniques/xWing'

/**
 * 構建測試盤面：對指定 index 設定候選集合，未指定的格預設 {1..9}
 * 注意：此 helper 直接設 candidates，不走 recompute，方便構造特定盤面結構
 * 預設 {1..9} 可確保其他列/欄不會意外形成 X-Wing 結構
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

describe('xWingSolver', () => {
  it('meta 正確', () => {
    expect(xWingSolver.meta.id).toBe('x-wing')
    expect(xWingSolver.meta.name).toBe('X-Wing（雙線矩形）')
  })

  it('row-based：R2/R5 的數字 4 只在 C3/C7 → 消去 C3、C7 其他列的 4', () => {
    // 構建 R2 與 R5：數字 4 的候選只剩 C3 與 C7
    // 其他列保持 {1..9}（含 4 的位置 ≥ 3，不會被當作 X-Wing 結構）
    // C3 與 C7 在其他列預設含 4 → 會被當作消去目標
    const setup: Record<number, number[]> = {}
    // R2 除 C3、C7 外的其他 7 格 → 移除 4
    for (const c of [0, 1, 2, 4, 5, 6, 8]) {
      setup[rc(2, c)] = [1, 2, 3, 5, 6, 7, 8, 9]
    }
    // R5 除 C3、C7 外的其他 7 格 → 移除 4
    for (const c of [0, 1, 2, 4, 5, 6, 8]) {
      setup[rc(5, c)] = [1, 2, 3, 5, 6, 7, 8, 9]
    }

    const board = makeBoard(setup)
    const step = xWingSolver.apply(board)

    expect(step).not.toBeNull()
    if (!step) { return }

    expect(step.technique).toBe('x-wing')
    expect(step.action).toBe('eliminate')

    // 四角 related
    const expectedCorners = [rc(2, 3), rc(2, 7), rc(5, 3), rc(5, 7)]
    expect(step.related.sort((a, b) => a - b)).toEqual(expectedCorners)

    // 預期消去：C3 與 C7 中 R2、R5 以外的列，皆消去 4
    // C3：R0,R1,R3,R4,R6,R7,R8 → 7 格
    // C7：R0,R1,R3,R4,R6,R7,R8 → 7 格
    expect(step.eliminations).toBeDefined()
    expect(step.eliminations!.length).toBe(14)

    for (const elim of step.eliminations!) {
      expect(elim.values).toEqual([4])
    }

    const elimIndices = new Set(step.eliminations!.map((e) => e.index))
    for (const r of [0, 1, 3, 4, 6, 7, 8]) {
      expect(elimIndices.has(rc(r, 3))).toBe(true)
      expect(elimIndices.has(rc(r, 7))).toBe(true)
    }

    // explanation 必須是繁中且包含關鍵資訊
    expect(step.explanation).toContain('4')
    expect(step.explanation).toContain('R3') // R2 顯示為 R3（1-based）
    expect(step.explanation).toContain('R6') // R5 顯示為 R6
    expect(step.explanation).toContain('C4') // C3 顯示為 C4
    expect(step.explanation).toContain('C8') // C7 顯示為 C8
    expect(step.explanation).toContain('X-Wing')
  })

  it('col-based：C3/C7 的數字 4 只在 R2/R5 → 消去 R2、R5 其他欄的 4', () => {
    // 對偶版：C3 與 C7 數字 4 候選只剩 R2 與 R5
    // 其他欄保持預設（含 4 位置 ≥ 3，不會被當作 X-Wing 結構）
    // R2 與 R5 其他欄保持預設（含 4 → 會被當作消去目標）
    // 同時要確保 row-based 不會先匹配：每列 d=4 的位置數需 ≠ 2
    // 預設 R2 其他欄都含 4 → R2 共 9 個位置含 4，不會匹配 row-based ✓
    const setup: Record<number, number[]> = {}
    // C3 除 R2、R5 外的其他 7 格 → 移除 4
    for (const r of [0, 1, 3, 4, 6, 7, 8]) {
      setup[rc(r, 3)] = [1, 2, 3, 5, 6, 7, 8, 9]
    }
    // C7 除 R2、R5 外的其他 7 格 → 移除 4
    for (const r of [0, 1, 3, 4, 6, 7, 8]) {
      setup[rc(r, 7)] = [1, 2, 3, 5, 6, 7, 8, 9]
    }

    const board = makeBoard(setup)
    const step = xWingSolver.apply(board)

    expect(step).not.toBeNull()
    if (!step) { return }

    expect(step.technique).toBe('x-wing')
    expect(step.action).toBe('eliminate')

    // 四角 related
    const expectedCorners = [rc(2, 3), rc(2, 7), rc(5, 3), rc(5, 7)]
    expect(step.related.sort((a, b) => a - b)).toEqual(expectedCorners)

    // 預期消去：R2 與 R5 中 C3、C7 以外的欄，皆消去 4
    expect(step.eliminations).toBeDefined()
    expect(step.eliminations!.length).toBe(14)

    for (const elim of step.eliminations!) {
      expect(elim.values).toEqual([4])
    }

    const elimIndices = new Set(step.eliminations!.map((e) => e.index))
    for (const c of [0, 1, 2, 4, 5, 6, 8]) {
      expect(elimIndices.has(rc(2, c))).toBe(true)
      expect(elimIndices.has(rc(5, c))).toBe(true)
    }

    expect(step.explanation).toContain('4')
    expect(step.explanation).toContain('X-Wing')
  })

  it('negative：兩列各 2 個 d 候選但欄不同 → 不構成 X-Wing → null', () => {
    // R2 d=4 候選只在 C3、C7
    // R5 d=4 候選只在 C3、C4（與 R2 不同）
    const setup: Record<number, number[]> = {}
    for (const c of [0, 1, 2, 4, 5, 6, 8]) {
      setup[rc(2, c)] = [1, 2, 3, 5, 6, 7, 8, 9]
    }
    for (const c of [0, 1, 2, 5, 6, 7, 8]) {
      setup[rc(5, c)] = [1, 2, 3, 5, 6, 7, 8, 9]
    }

    const board = makeBoard(setup)
    const step = xWingSolver.apply(board)

    expect(step).toBeNull()
  })

  it('negative：結構成立但無可消去候選 → null', () => {
    // 完整 X-Wing 結構：R2/R5 d=4 只在 C3/C7；同時 C3/C7 d=4 也只在 R2/R5
    // 此時 row-based 與 col-based 都找到結構，但消去目標皆為空 → null
    const setup: Record<number, number[]> = {}
    // R2、R5 其他欄 → 移除 4
    for (const r of [2, 5]) {
      for (const c of [0, 1, 2, 4, 5, 6, 8]) {
        setup[rc(r, c)] = [1, 2, 3, 5, 6, 7, 8, 9]
      }
    }
    // C3、C7 其他列（R0,1,3,4,6,7,8）→ 移除 4
    for (const c of [3, 7]) {
      for (const r of [0, 1, 3, 4, 6, 7, 8]) {
        setup[rc(r, c)] = [1, 2, 3, 5, 6, 7, 8, 9]
      }
    }

    const board = makeBoard(setup)
    const step = xWingSolver.apply(board)

    expect(step).toBeNull()
  })
})
