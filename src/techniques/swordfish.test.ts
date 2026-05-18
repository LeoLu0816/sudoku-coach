// @vitest-environment node
import { describe, expect, it } from 'vitest'
import type { Board } from '@/types'
import { createEmptyBoard, setCandidates } from '@/core/board'
import { swordfishSolver } from '@/techniques/swordfish'

/**
 * 構建測試盤面：所有格預設候選 {1..9}，再用 setup 覆寫指定格
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

/**
 * 將整盤中除指定列以外的列移除某個候選 d
 * 用途：構造特定的 row-based d 分佈，避免其他列形成更早的結構
 */
function stripDigitFromRowsExcept(
  board: Board,
  d: number,
  keepRows: number[],
  keepIndices?: Set<number>,
): Board {
  let next = board
  const keepRowSet = new Set(keepRows)
  for (let r = 0; r < 9; r++) {
    if (keepRowSet.has(r)) { continue }
    for (let c = 0; c < 9; c++) {
      const idx = r * 9 + c
      if (keepIndices && keepIndices.has(idx)) { continue }
      const cell = next.cells[idx]
      if (cell.candidates.has(d)) {
        const newCands = new Set(cell.candidates)
        newCands.delete(d)
        next = setCandidates(next, idx, newCands)
      }
    }
  }
  return next
}

/**
 * 將指定列中除指定欄外的所有格中的 d 移除
 */
function restrictRowDigit(board: Board, row: number, keepCols: number[], d: number): Board {
  let next = board
  const keepSet = new Set(keepCols)
  for (let c = 0; c < 9; c++) {
    if (keepSet.has(c)) { continue }
    const idx = row * 9 + c
    const cell = next.cells[idx]
    if (cell.candidates.has(d)) {
      const newCands = new Set(cell.candidates)
      newCands.delete(d)
      next = setCandidates(next, idx, newCands)
    }
  }
  return next
}

describe('swordfishSolver', () => {
  it('meta 正確', () => {
    expect(swordfishSolver.meta.id).toBe('swordfish')
    expect(swordfishSolver.meta.name).toBe('Swordfish（劍魚）')
  })

  it('row-based：數字 5 在 R0/R3/R5 形成 3×3 結構，三欄其他列 5 可消去', () => {
    let board = makeBoard({})
    // R0：5 候選限於 C1, C4
    board = restrictRowDigit(board, 0, [1, 4], 5)
    // R3：5 候選限於 C1, C7
    board = restrictRowDigit(board, 3, [1, 7], 5)
    // R5：5 候選限於 C4, C7
    board = restrictRowDigit(board, 5, [4, 7], 5)

    const step = swordfishSolver.apply(board)
    expect(step).not.toBeNull()
    expect(step!.technique).toBe('swordfish')
    expect(step!.action).toBe('eliminate')

    // related：三列三欄交叉處實際候選含 5 的格
    // R0: C1, C4; R3: C1, C7; R5: C4, C7
    const expectedRelated = [0 * 9 + 1, 0 * 9 + 4, 3 * 9 + 1, 3 * 9 + 7, 5 * 9 + 4, 5 * 9 + 7].sort(
      (a, b) => a - b,
    )
    expect(step!.related.slice().sort((a, b) => a - b)).toEqual(expectedRelated)

    // eliminations：三欄（C1,C4,C7）其他列（R1,R2,R4,R6,R7,R8）含 5 的格
    const elimIdxs = step!.eliminations!.map((e) => e.index).sort((a, b) => a - b)
    const expectedElim: number[] = []
    for (const r of [1, 2, 4, 6, 7, 8]) {
      for (const c of [1, 4, 7]) {
        expectedElim.push(r * 9 + c)
      }
    }
    expectedElim.sort((a, b) => a - b)
    expect(elimIdxs).toEqual(expectedElim)

    // 每筆 eliminations 的 values === [5]
    for (const e of step!.eliminations!) {
      expect(e.values).toEqual([5])
    }

    expect(step!.explanation).toMatch(/5/)
    expect(step!.explanation).toMatch(/R1/)
    expect(step!.explanation).toMatch(/C2|C5|C8/)
  })

  it('col-based：數字 7 在 C0/C3/C6 形成 3×3 結構，三列其他欄 7 可消去', () => {
    let board = makeBoard({})

    // 全盤先清除 7
    for (let i = 0; i < 81; i++) {
      const cands = new Set(board.cells[i].candidates)
      cands.delete(7)
      board = setCandidates(board, i, cands)
    }

    // 在 col-based Swordfish 結構六格加入 7
    // C0：R0, R3 | C3：R0, R5 | C6：R3, R5
    const structurePoints: Array<[number, number]> = [
      [0, 0],
      [3, 0],
      [0, 3],
      [5, 3],
      [3, 6],
      [5, 6],
    ]
    for (const [r, c] of structurePoints) {
      const idx = r * 9 + c
      const cands = new Set(board.cells[idx].candidates)
      cands.add(7)
      board = setCandidates(board, idx, cands)
    }

    // 在三列中各加一個「被消除目標」的格（非該三欄）
    // 注意：選擇的目標欄不能讓對應欄變成 size ∈ [2,3] 的候選欄
    // R0C1（C1 只含 R0）/ R3C2（C2 只含 R3）/ R5C4（C4 只含 R5）
    const elimTargets: Array<[number, number]> = [
      [0, 1],
      [3, 2],
      [5, 4],
    ]
    for (const [r, c] of elimTargets) {
      const idx = r * 9 + c
      const cands = new Set(board.cells[idx].candidates)
      cands.add(7)
      board = setCandidates(board, idx, cands)
    }

    const step = swordfishSolver.apply(board)
    expect(step).not.toBeNull()
    expect(step!.technique).toBe('swordfish')

    // related：三欄三列交叉處實際含 7 的格
    const expectedRelated = [
      0 * 9 + 0,
      3 * 9 + 0,
      0 * 9 + 3,
      5 * 9 + 3,
      3 * 9 + 6,
      5 * 9 + 6,
    ].sort((a, b) => a - b)
    expect(step!.related.slice().sort((a, b) => a - b)).toEqual(expectedRelated)

    // eliminations：R0C1, R3C2, R5C4 三格
    const elimIdxs = step!.eliminations!.map((e) => e.index).sort((a, b) => a - b)
    const expectedElim = [0 * 9 + 1, 3 * 9 + 2, 5 * 9 + 4].sort((a, b) => a - b)
    expect(elimIdxs).toEqual(expectedElim)

    for (const e of step!.eliminations!) {
      expect(e.values).toEqual([7])
    }

    expect(step!.explanation).toMatch(/7/)
  })

  it('negative：欄聯集 = 4 欄 → 無 Swordfish，回 null', () => {
    let board = makeBoard({})
    board = stripDigitFromRowsExcept(board, 5, [0, 3, 5])
    // R0：5 限於 C1, C4
    board = restrictRowDigit(board, 0, [1, 4], 5)
    // R3：5 限於 C2, C7
    board = restrictRowDigit(board, 3, [2, 7], 5)
    // R5：5 限於 C4, C7
    board = restrictRowDigit(board, 5, [4, 7], 5)
    // 欄聯集 = {C1,C2,C4,C7} size = 4 ≠ 3

    expect(swordfishSolver.apply(board)).toBeNull()
  })

  it('negative：欄聯集 = 2 欄（退化 X-Wing）→ 回 null', () => {
    let board = makeBoard({})
    board = stripDigitFromRowsExcept(board, 5, [0, 3, 5])
    // R0/R3/R5：5 皆限於 C1, C4
    board = restrictRowDigit(board, 0, [1, 4], 5)
    board = restrictRowDigit(board, 3, [1, 4], 5)
    board = restrictRowDigit(board, 5, [1, 4], 5)
    // 欄聯集 = {C1, C4} size = 2 → 退化 X-Wing，Swordfish 不應匹配

    expect(swordfishSolver.apply(board)).toBeNull()
  })

  it('negative：結構成立但其他列無 d 可消去 → 回 null', () => {
    let board = makeBoard({})
    // 先清除全盤 5
    for (let i = 0; i < 81; i++) {
      const cands = new Set(board.cells[i].candidates)
      cands.delete(5)
      board = setCandidates(board, i, cands)
    }
    // 僅在結構六格加入 5：R0(C1,C4), R3(C1,C7), R5(C4,C7)
    const addPoints = [
      [0, 1],
      [0, 4],
      [3, 1],
      [3, 7],
      [5, 4],
      [5, 7],
    ]
    for (const [r, c] of addPoints) {
      const idx = r * 9 + c
      const cands = new Set(board.cells[idx].candidates)
      cands.add(5)
      board = setCandidates(board, idx, cands)
    }
    // 三欄（C1,C4,C7）其他列皆不含 5 → 無可消去

    expect(swordfishSolver.apply(board)).toBeNull()
  })
})
