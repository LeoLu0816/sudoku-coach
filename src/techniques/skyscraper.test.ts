// @vitest-environment node
import { describe, expect, it } from 'vitest'
import type { Board } from '@/types'
import { createEmptyBoard, setCandidates } from '@/core/board'
import { skyscraperSolver } from '@/techniques/skyscraper'

/**
 * 構建測試盤面：對指定 index 設定候選集合，未指定的格預設 {1..9}
 * 預設 {1..9} 可確保其他列/欄該數字位置數 ≥ 3，不會被誤認為 X-Wing 或其他結構
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

/** 由 colsToKeep 列出需要從某列其他欄移除 d 的候選 setup */
function restrictRowToCols(
  setup: Record<number, number[]>,
  row: number,
  colsToKeep: number[],
  d: number,
): void {
  const fullCands = [1, 2, 3, 4, 5, 6, 7, 8, 9]
  const without = fullCands.filter((v) => v !== d)
  for (let c = 0; c < 9; c++) {
    if (colsToKeep.includes(c)) {
      continue
    }
    setup[rc(row, c)] = without
  }
}

/** 由 rowsToKeep 列出需要從某欄其他列移除 d 的候選 setup */
function restrictColToRows(
  setup: Record<number, number[]>,
  col: number,
  rowsToKeep: number[],
  d: number,
): void {
  const fullCands = [1, 2, 3, 4, 5, 6, 7, 8, 9]
  const without = fullCands.filter((v) => v !== d)
  for (let r = 0; r < 9; r++) {
    if (rowsToKeep.includes(r)) {
      continue
    }
    setup[rc(r, col)] = without
  }
}

describe('skyscraperSolver', () => {
  it('meta 正確', () => {
    expect(skyscraperSolver.meta.id).toBe('skyscraper')
    expect(skyscraperSolver.meta.name).toBe('Skyscraper（摩天樓）')
    expect(skyscraperSolver.meta.shortDesc).toContain('共同 peer')
  })

  it('row-based：R0 d=4 在 C0/C2、R2 d=4 在 C0/C1，共享 C0；非共享端 (0,2) 與 (2,1) 同 box → box 0 內可消去 4', () => {
    // R0 d=4 限制只在 C0、C2
    // R2 d=4 限制只在 C0、C1
    // 非共享端 (0,2) 與 (2,1) 同 box 0，共同 peer = box 0 其他 7 格
    // 共享端 (0,0) 與 (2,0) 亦在 box 0 → 也屬於共同 peer 範圍會被消去（合法推理）
    const setup: Record<number, number[]> = {}
    const d = 4
    restrictRowToCols(setup, 0, [0, 2], d)
    restrictRowToCols(setup, 2, [0, 1], d)

    const board = makeBoard(setup)
    const step = skyscraperSolver.apply(board)

    expect(step).not.toBeNull()
    if (!step) {
      return
    }

    expect(step.technique).toBe('skyscraper')
    expect(step.action).toBe('eliminate')

    // related 含 4 個結構格：共享端 (0,0)、(2,0) + 非共享端 (0,2)、(2,1)
    const expectedRelated = [rc(0, 0), rc(2, 0), rc(0, 2), rc(2, 1)].sort((a, b) => a - b)
    expect([...step.related].sort((a, b) => a - b)).toEqual(expectedRelated)

    // 預期消去：box 0 共同 peer 中仍含 d 的格
    // box 0 共同 peer（排除非共享端 (0,2)、(2,1)）= (0,0),(0,1),(1,0),(1,1),(1,2),(2,0),(2,2)
    // 但 restrictRowToCols(R0,[0,2]) 把 (0,1) 對 d 候選移除（C1 非 keep）
    // restrictRowToCols(R2,[0,1]) 把 (2,2) 對 d 候選移除（C2 非 keep）
    // → 仍含 d 的共同 peer：(0,0),(1,0),(1,1),(1,2),(2,0) = 5 格
    const expectedElimIndices = [
      rc(0, 0),
      rc(1, 0),
      rc(1, 1),
      rc(1, 2),
      rc(2, 0),
    ]
    expect(step.eliminations).toBeDefined()
    expect(step.eliminations!.length).toBe(expectedElimIndices.length)

    const elimIndices = new Set(step.eliminations!.map((e) => e.index))
    for (const idx of expectedElimIndices) {
      expect(elimIndices.has(idx)).toBe(true)
    }

    for (const elim of step.eliminations!) {
      expect(elim.values).toEqual([d])
    }

    // 非共享端自身不能在消去清單中
    expect(elimIndices.has(rc(0, 2))).toBe(false)
    expect(elimIndices.has(rc(2, 1))).toBe(false)
    // 已被預先移除 d 的格不在 elim 清單中
    expect(elimIndices.has(rc(0, 1))).toBe(false)
    expect(elimIndices.has(rc(2, 2))).toBe(false)

    // explanation 含關鍵 1-based 資訊
    expect(step.explanation).toContain('4')
    expect(step.explanation).toContain('R1') // R0 → R1
    expect(step.explanation).toContain('R3') // R2 → R3
    expect(step.explanation).toContain('C1') // 共享 C0 → C1
    expect(step.explanation).toContain('共同 peer')
  })

  it('col-based：C0 d=4 在 R0/R2、C2 d=4 在 R0/R1，共享 R0；非共享端 (2,0) 與 (1,2) 同 box → box 0 內可消去 4', () => {
    // C0 d=4 限制只在 R0、R2
    // C2 d=4 限制只在 R0、R1
    // 共享列 R0；非共享端 (2,0) 與 (1,2) 同 box 0
    // 為避免 row-based 先匹配：R0、R1、R2 對 d=4 的位置數不可為 2
    //   R0：C0、C2 含 d，C1 也預設含 d，其他 6 欄需移除 → 但這樣 R0 又會變 row 結構
    // 解法：只設定 C0 與 C2 的格，其他格保留預設 → 所有列含 d 的位置 ≥ 2
    //   但 row-based 也會掃 → R0 對 d=4 仍 9 個位置（其他 7 格預設）✓ 不是 2
    //   R1：C2 含 d，其他預設也含 d → 9 個 ✓
    //   R2：C0 含 d，其他預設也含 d → 9 個 ✓
    //   其他列：全預設 → 9 個 ✓
    //   → row-based rowsWithTwo 為空，不會匹配
    const setup: Record<number, number[]> = {}
    const d = 4
    restrictColToRows(setup, 0, [0, 2], d)
    restrictColToRows(setup, 2, [0, 1], d)

    const board = makeBoard(setup)
    const step = skyscraperSolver.apply(board)

    expect(step).not.toBeNull()
    if (!step) {
      return
    }

    expect(step.technique).toBe('skyscraper')
    expect(step.action).toBe('eliminate')

    // related 含 4 個結構格：共享端 (0,0)、(0,2) + 非共享端 (2,0)、(1,2)
    const expectedRelated = [rc(0, 0), rc(0, 2), rc(2, 0), rc(1, 2)].sort((a, b) => a - b)
    expect([...step.related].sort((a, b) => a - b)).toEqual(expectedRelated)

    // 預期消去：box 0 共同 peer 中仍含 d 的格
    // box 0 共同 peer（排除非共享端 (2,0)、(1,2)）= (0,0),(0,1),(0,2),(1,0),(1,1),(2,1),(2,2)
    // restrictColToRows(C0,[0,2]) 把 (1,0) 對 d 候選移除（R1 非 keep）
    // restrictColToRows(C2,[0,1]) 把 (2,2) 對 d 候選移除（R2 非 keep）
    // → 仍含 d 的共同 peer：(0,0),(0,1),(0,2),(1,1),(2,1) = 5 格
    const expectedElimIndices = [
      rc(0, 0),
      rc(0, 1),
      rc(0, 2),
      rc(1, 1),
      rc(2, 1),
    ]
    expect(step.eliminations).toBeDefined()
    expect(step.eliminations!.length).toBe(expectedElimIndices.length)

    const elimIndices = new Set(step.eliminations!.map((e) => e.index))
    for (const idx of expectedElimIndices) {
      expect(elimIndices.has(idx)).toBe(true)
    }

    for (const elim of step.eliminations!) {
      expect(elim.values).toEqual([d])
    }

    // 非共享端自身不能在消去清單中
    expect(elimIndices.has(rc(2, 0))).toBe(false)
    expect(elimIndices.has(rc(1, 2))).toBe(false)
    // 已被預先移除 d 的格不在 elim 清單中
    expect(elimIndices.has(rc(1, 0))).toBe(false)
    expect(elimIndices.has(rc(2, 2))).toBe(false)

    expect(step.explanation).toContain('4')
    expect(step.explanation).toContain('共同 peer')
  })

  it('negative：結構成立但所有共同 peer 對 d 的候選都已移除 → null', () => {
    // 構造 row-based 結構：R0 d=4 在 C0/C5；R2 d=4 在 C0/C8
    // 非共享端 (0,5) 與 (2,8)
    // 共同 peer：row 0 ∩ col 8 = (0,8)；row 2 ∩ col 5 = (2,5)
    //   box 不同（(0,5) box=1, (2,8) box=2 → 不同 box，共同 peer 僅交點兩格）
    // 共同 peer 也包含「(0,5) 同 box 1 與 (2,8) 同 box 2」交集 = ∅
    // 將 (0,8) 與 (2,5) 對 d=4 候選移除 → eliminations 空 → null
    const setup: Record<number, number[]> = {}
    const d = 4
    restrictRowToCols(setup, 0, [0, 5], d)
    restrictRowToCols(setup, 2, [0, 8], d)
    // 上面 restrictRowToCols 已把 R0 其他欄（含 C8）移除 d，R2 其他欄（含 C5）移除 d
    // 即 (0,8) 與 (2,5) 已不含 d → 共同 peer 中無可消去格

    const board = makeBoard(setup)
    const step = skyscraperSolver.apply(board)

    // 也需確保 col-based 不會誤判：C0 d=4 在 R0,R2（2 個）；其他欄各列 d 數量不為 2
    // C5：R0 含 d，其他列預設含 d → 9 個；C8：R2 含 d，其他列預設含 d → 9 個
    // C0 d=4 只在 R0,R2 → colsWithTwo 含 C0；但僅 1 個欄 → col-based 不匹配
    expect(step).toBeNull()
  })

  it('negative：兩列 d 候選欄完全不同（shared=0）→ null', () => {
    // R0 d=4 在 C0/C1；R2 d=4 在 C5/C6 → 交集 = ∅
    const setup: Record<number, number[]> = {}
    const d = 4
    restrictRowToCols(setup, 0, [0, 1], d)
    restrictRowToCols(setup, 2, [5, 6], d)

    const board = makeBoard(setup)
    const step = skyscraperSolver.apply(board)

    // col-based 也需檢查：對 C0、C1、C5、C6 而言，d=4 各只在哪幾列？
    //   C0：R0 含 d；R2 不含 d（被 restrictRowToCols(2,[5,6]) 移除）；其他列預設含 d
    //     → R2 之外含 d 的有 8 列 → 8 個，不為 2
    //   C5：R2 含 d；R0 不含 d；其他列預設 → 8 個
    //   其他欄類似
    // → colsWithTwo 為空 → col-based 不匹配 ✓
    expect(step).toBeNull()
  })

  it('negative：兩列 d 候選欄完全相同（shared=2，X-Wing 場景）→ null', () => {
    // R0 d=4 在 C0/C5；R2 d=4 在 C0/C5 → 交集 = {C0,C5} 兩個 → 跳過
    const setup: Record<number, number[]> = {}
    const d = 4
    restrictRowToCols(setup, 0, [0, 5], d)
    restrictRowToCols(setup, 2, [0, 5], d)

    const board = makeBoard(setup)
    const step = skyscraperSolver.apply(board)

    // col-based：對 C0、C5 而言，d=4 的列分佈：R0, R2 + 其他列預設皆含 → 9 個（不為 2）
    // 但等等：restrictRowToCols(0,[0,5]) 與 (2,[0,5]) 只動到 R0、R2 的其他欄
    //   C0 列分佈：R0 ✓、R1 預設 ✓、R2 ✓、R3..R8 預設 ✓ → 9 個，不為 2 ✓
    // → col-based 也不匹配
    expect(step).toBeNull()
  })
})
