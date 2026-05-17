import { describe, expect, it } from 'vitest'
import { createBoardFromGiven, createEmptyBoard, setCellValue } from '@/core/board'
import {
  findConflicts,
  getLegalCandidates,
  hasConflicts,
  isPlacementLegal,
  isSolved,
  recomputeAllCandidates,
} from '@/core/validator'
import type { CellValue } from '@/types'

function parseGiven(input: string): CellValue[] {
  return input.split('').map((char) => (char === '.' || char === '0' ? 0 : Number(char))) as CellValue[]
}

describe('getLegalCandidates', () => {
  it('空盤每格候選 = {1..9}', () => {
    const board = createEmptyBoard()
    const c = getLegalCandidates(board, 40)
    expect([...c].sort()).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9])
  })

  it('填一格 5 後，同 peer 候選不含 5', () => {
    const board = setCellValue(createEmptyBoard(), 40, 5)
    expect(getLegalCandidates(board, 41).has(5)).toBe(false) // 同 row
    expect(getLegalCandidates(board, 4).has(5)).toBe(false) // 同 col
    expect(getLegalCandidates(board, 30).has(5)).toBe(false) // 同 box
    expect(getLegalCandidates(board, 0).has(5)).toBe(true) // 不同 peer
  })

  it('已填格回空 set', () => {
    const board = setCellValue(createEmptyBoard(), 40, 5)
    expect(getLegalCandidates(board, 40).size).toBe(0)
  })
})

describe('recomputeAllCandidates', () => {
  it('空格 candidates 寫入合法候選；已填格清空', () => {
    const board = setCellValue(createEmptyBoard(), 40, 5)
    const next = recomputeAllCandidates(board)
    expect(next.cells[40].candidates.size).toBe(0)
    expect(next.cells[0].candidates.has(5)).toBe(true)
    expect(next.cells[41].candidates.has(5)).toBe(false)
  })
})

describe('findConflicts / hasConflicts', () => {
  it('無衝突回空陣列', () => {
    const board = createEmptyBoard()
    expect(findConflicts(board)).toEqual([])
    expect(hasConflicts(board)).toBe(false)
  })

  it('同 row 兩個 5 → 兩個都衝突', () => {
    let b = createEmptyBoard()
    b = setCellValue(b, 0, 5)
    b = setCellValue(b, 5, 5)
    const conflicts = findConflicts(b)
    expect(conflicts).toHaveLength(2)
    expect(conflicts[0].index).toBe(0)
    expect(conflicts[0].conflictWith).toContain(5)
    expect(conflicts[1].index).toBe(5)
    expect(conflicts[1].conflictWith).toContain(0)
    expect(hasConflicts(b)).toBe(true)
  })

  it('同 col 衝突', () => {
    let b = createEmptyBoard()
    b = setCellValue(b, 0, 5)
    b = setCellValue(b, 9, 5) // R1C0 = same col
    expect(hasConflicts(b)).toBe(true)
  })

  it('同 box 衝突', () => {
    let b = createEmptyBoard()
    b = setCellValue(b, 0, 5)
    b = setCellValue(b, 10, 5) // R1C1 = same box
    expect(hasConflicts(b)).toBe(true)
  })
})

describe('isSolved', () => {
  const solution = '534678912672195348198342567859761423426853791713924856961537284287419635345286179'

  it('合法完整解 → true', () => {
    const board = createBoardFromGiven(parseGiven(solution))
    expect(isSolved(board)).toBe(true)
  })

  it('完整但含衝突 → false', () => {
    let b = createBoardFromGiven(parseGiven(solution))
    b = setCellValue(b, 0, 6) // 故意改錯造成衝突
    expect(isSolved(b)).toBe(false)
  })

  it('未完成 → false', () => {
    const board = createEmptyBoard()
    expect(isSolved(board)).toBe(false)
  })
})

describe('isPlacementLegal', () => {
  it('peer 已有同值 → false', () => {
    const board = setCellValue(createEmptyBoard(), 0, 5)
    expect(isPlacementLegal(board, 1, 5)).toBe(false)
  })

  it('peer 無同值 → true', () => {
    const board = setCellValue(createEmptyBoard(), 0, 5)
    expect(isPlacementLegal(board, 80, 5)).toBe(true)
  })

  it('out of range', () => {
    const board = createEmptyBoard()
    expect(isPlacementLegal(board, 0, 0)).toBe(false)
    expect(isPlacementLegal(board, 0, 10)).toBe(false)
  })
})
