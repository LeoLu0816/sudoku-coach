import { describe, expect, it } from 'vitest'
import {
  clearCell,
  cloneBoard,
  createBoardFromGiven,
  createEmptyBoard,
  getBoxCells,
  getCell,
  getColCells,
  getEmptyCells,
  getPeers,
  getRowCells,
  getUnitCells,
  indexToBox,
  indexToRowCol,
  isComplete,
  rowColToIndex,
  setCandidates,
  setCellValue,
  toggleCandidate,
} from '@/core/board'
import type { CellValue } from '@/types'

/** 把 81 字串轉成 CellValue[]（'.'/'0' = 0） */
function parseGiven(input: string): CellValue[] {
  return input.split('').map((char) => (char === '.' || char === '0' ? 0 : Number(char))) as CellValue[]
}

describe('index <-> row/col / box 轉換', () => {
  it('indexToRowCol', () => {
    expect(indexToRowCol(0)).toEqual({ row: 0, col: 0 })
    expect(indexToRowCol(40)).toEqual({ row: 4, col: 4 })
    expect(indexToRowCol(80)).toEqual({ row: 8, col: 8 })
  })

  it('rowColToIndex', () => {
    expect(rowColToIndex(0, 0)).toBe(0)
    expect(rowColToIndex(4, 4)).toBe(40)
    expect(rowColToIndex(8, 8)).toBe(80)
  })

  it('indexToBox', () => {
    expect(indexToBox(0)).toBe(0) // R0C0
    expect(indexToBox(4)).toBe(1) // R0C4
    expect(indexToBox(40)).toBe(4) // R4C4 中央宮
    expect(indexToBox(80)).toBe(8) // R8C8
  })
})

describe('createEmptyBoard', () => {
  it('回傳 81 格全空的 Board', () => {
    const board = createEmptyBoard()
    expect(board.cells).toHaveLength(81)
    expect(board.cells.every((c) => c.value === 0)).toBe(true)
    expect(board.cells.every((c) => !c.isGiven)).toBe(true)
    expect(board.cells.every((c) => c.candidates.size === 0)).toBe(true)
  })

  it('每格的 row/col/box 計算正確', () => {
    const board = createEmptyBoard()
    expect(board.cells[40]).toMatchObject({ index: 40, row: 4, col: 4, box: 4 })
    expect(board.cells[0]).toMatchObject({ index: 0, row: 0, col: 0, box: 0 })
    expect(board.cells[80]).toMatchObject({ index: 80, row: 8, col: 8, box: 8 })
  })
})

describe('createBoardFromGiven', () => {
  it('依 given 建 Board，非 0 格 isGiven=true', () => {
    const given = parseGiven('5346.891..7.1...4.....42..78.976.4...26...7.171...4.56.61.3728..87..9.3534.......')
    const board = createBoardFromGiven(given)
    expect(board.cells[0].value).toBe(5)
    expect(board.cells[0].isGiven).toBe(true)
    expect(board.cells[4].value).toBe(0)
    expect(board.cells[4].isGiven).toBe(false)
  })

  it('length !== 81 拋錯', () => {
    expect(() => createBoardFromGiven([1, 2, 3] as CellValue[])).toThrow()
  })
})

describe('cloneBoard', () => {
  it('結構深拷貝，原 Board 不受影響', () => {
    const original = createEmptyBoard()
    const cloned = cloneBoard(original)
    cloned.cells[0].candidates.add(5)
    expect(original.cells[0].candidates.has(5)).toBe(false)
  })
})

describe('查詢 API', () => {
  const given = parseGiven('123456789'.repeat(9))
  const board = createBoardFromGiven(given)

  it('getCell', () => {
    expect(getCell(board, 40).value).toBe(5)
  })

  it('getRowCells 回 9 格、同 row', () => {
    const row = getRowCells(board, 3)
    expect(row).toHaveLength(9)
    expect(row.every((c) => c.row === 3)).toBe(true)
  })

  it('getColCells 回 9 格、同 col', () => {
    const col = getColCells(board, 3)
    expect(col).toHaveLength(9)
    expect(col.every((c) => c.col === 3)).toBe(true)
  })

  it('getBoxCells 回 9 格、同 box', () => {
    const box = getBoxCells(board, 4)
    expect(box).toHaveLength(9)
    expect(box.every((c) => c.box === 4)).toBe(true)
  })

  it('getUnitCells 依 type 分派', () => {
    expect(getUnitCells(board, 'row', 0).every((c) => c.row === 0)).toBe(true)
    expect(getUnitCells(board, 'col', 0).every((c) => c.col === 0)).toBe(true)
    expect(getUnitCells(board, 'box', 0).every((c) => c.box === 0)).toBe(true)
  })

  it('getPeers 回 20 格（同行 8 + 同列 8 + 同宮 4，去重）', () => {
    const peers = getPeers(board, 40) // R4C4 中央
    expect(peers).toHaveLength(20)
    expect(peers.every((c) => c.index !== 40)).toBe(true)
    // 至少包含同 row / col / box 的 cell
    expect(peers.some((c) => c.row === 4 && c.col !== 4)).toBe(true)
    expect(peers.some((c) => c.col === 4 && c.row !== 4)).toBe(true)
    expect(peers.some((c) => c.box === 4 && c.index !== 40)).toBe(true)
  })

  it('getEmptyCells 只回空格', () => {
    const sparse = parseGiven('5'.padEnd(81, '.'))
    const board = createBoardFromGiven(sparse)
    expect(getEmptyCells(board)).toHaveLength(80)
  })

  it('isComplete', () => {
    expect(isComplete(board)).toBe(true)
    const empty = createEmptyBoard()
    expect(isComplete(empty)).toBe(false)
  })
})

describe('操作 API（immutable）', () => {
  it('setCellValue 不影響原 Board', () => {
    const board = createEmptyBoard()
    const next = setCellValue(board, 0, 5)
    expect(next.cells[0].value).toBe(5)
    expect(board.cells[0].value).toBe(0)
  })

  it('toggleCandidate 切換', () => {
    const board = createEmptyBoard()
    const added = toggleCandidate(board, 0, 5)
    expect(added.cells[0].candidates.has(5)).toBe(true)
    const removed = toggleCandidate(added, 0, 5)
    expect(removed.cells[0].candidates.has(5)).toBe(false)
  })

  it('setCandidates 整批設定', () => {
    const board = createEmptyBoard()
    const next = setCandidates(board, 0, new Set([1, 3, 5]))
    expect([...next.cells[0].candidates].sort()).toEqual([1, 3, 5])
  })

  it('clearCell 值與候選都歸零', () => {
    const board = setCellValue(setCandidates(createEmptyBoard(), 0, new Set([1, 2])), 0, 5)
    const cleared = clearCell(board, 0)
    expect(cleared.cells[0].value).toBe(0)
    expect(cleared.cells[0].candidates.size).toBe(0)
  })
})
