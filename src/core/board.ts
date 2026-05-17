import type { Board, Cell, CellIndex, CellValue, UnitType } from '@/types'

/** 將 0..80 的 index 拆成 row 與 col（皆 0..8） */
export function indexToRowCol(index: CellIndex): { row: number; col: number } {
  return { row: Math.floor(index / 9), col: index % 9 }
}

/** 將 row / col 組回 index */
export function rowColToIndex(row: number, col: number): CellIndex {
  return row * 9 + col
}

/** 由 index 取得所在宮編號（0..8，row-major：左上→右下） */
export function indexToBox(index: CellIndex): number {
  const { row, col } = indexToRowCol(index)
  return Math.floor(row / 3) * 3 + Math.floor(col / 3)
}

/** 建立一個全空的初始 Cell */
function makeEmptyCell(index: CellIndex): Cell {
  const { row, col } = indexToRowCol(index)
  return {
    index,
    row,
    col,
    box: indexToBox(index),
    value: 0,
    isGiven: false,
    candidates: new Set<number>(),
  }
}

/** 建立全空棋盤 */
export function createEmptyBoard(): Board {
  return {
    cells: Array.from({ length: 81 }, (_, i) => makeEmptyCell(i)),
  }
}

/** 由 81 個 CellValue 建立棋盤；非 0 格自動標 isGiven=true */
export function createBoardFromGiven(given: CellValue[]): Board {
  if (given.length !== 81) {
    throw new Error(`createBoardFromGiven: given length must be 81, got ${given.length}`)
  }

  return {
    cells: given.map((value, index) => {
      const { row, col } = indexToRowCol(index)
      return {
        index,
        row,
        col,
        box: indexToBox(index),
        value,
        isGiven: value !== 0,
        candidates: new Set<number>(),
      }
    }),
  }
}

/** 深拷貝棋盤（candidates Set 也拷貝） */
export function cloneBoard(board: Board): Board {
  return {
    cells: board.cells.map((cell) => ({
      ...cell,
      candidates: new Set(cell.candidates),
    })),
  }
}

/** 取得單格資料 */
export function getCell(board: Board, index: CellIndex): Cell {
  return board.cells[index]
}

/** 取得整列 9 格（依 col 順序） */
export function getRowCells(board: Board, row: number): Cell[] {
  return board.cells.filter((cell) => cell.row === row)
}

/** 取得整行 9 格（依 row 順序） */
export function getColCells(board: Board, col: number): Cell[] {
  return board.cells.filter((cell) => cell.col === col)
}

/** 取得單宮 9 格（依 row, col 順序） */
export function getBoxCells(board: Board, box: number): Cell[] {
  return board.cells.filter((cell) => cell.box === box)
}

/** 依 unit type 取對應 9 格 */
export function getUnitCells(board: Board, unit: UnitType, index: number): Cell[] {
  switch (unit) {
    case 'row':
      return getRowCells(board, index)
    case 'col':
      return getColCells(board, index)
    case 'box':
      return getBoxCells(board, index)
  }
}

/** 取得某格的所有 peer（同行 + 同列 + 同宮，去重，共 20 格） */
export function getPeers(board: Board, index: CellIndex): Cell[] {
  const target = getCell(board, index)
  const peerIndices = new Set<number>()

  // 同 row
  for (let c = 0; c < 9; c++) {
    peerIndices.add(rowColToIndex(target.row, c))
  }
  // 同 col
  for (let r = 0; r < 9; r++) {
    peerIndices.add(rowColToIndex(r, target.col))
  }
  // 同 box
  const boxRow = Math.floor(target.row / 3) * 3
  const boxCol = Math.floor(target.col / 3) * 3
  for (let r = boxRow; r < boxRow + 3; r++) {
    for (let c = boxCol; c < boxCol + 3; c++) {
      peerIndices.add(rowColToIndex(r, c))
    }
  }
  peerIndices.delete(index)

  return [...peerIndices].sort((a, b) => a - b).map((i) => board.cells[i])
}

/** 取得所有空格 */
export function getEmptyCells(board: Board): Cell[] {
  return board.cells.filter((cell) => cell.value === 0)
}

/** 判斷棋盤是否所有格皆已填（不檢查是否正確） */
export function isComplete(board: Board): boolean {
  return board.cells.every((cell) => cell.value !== 0)
}

/** 設定單格值，回傳新 Board（淺複製 cells，僅替換目標格） */
export function setCellValue(board: Board, index: CellIndex, value: CellValue): Board {
  const cells = board.cells.slice()
  cells[index] = {
    ...cells[index],
    value,
    candidates: new Set(cells[index].candidates),
  }
  return { cells }
}

/** 切換單格的某個候選數（已有則移除，無則加入） */
export function toggleCandidate(board: Board, index: CellIndex, value: number): Board {
  const cells = board.cells.slice()
  const newCandidates = new Set(cells[index].candidates)
  if (newCandidates.has(value)) {
    newCandidates.delete(value)
  } else {
    newCandidates.add(value)
  }
  cells[index] = { ...cells[index], candidates: newCandidates }
  return { cells }
}

/** 整批設定某格候選數 */
export function setCandidates(board: Board, index: CellIndex, candidates: Set<number>): Board {
  const cells = board.cells.slice()
  cells[index] = { ...cells[index], candidates: new Set(candidates) }
  return { cells }
}

/** 清除單格（值歸 0、候選清空），但 isGiven 不變（清空動作不可改變題目給定狀態） */
export function clearCell(board: Board, index: CellIndex): Board {
  const cells = board.cells.slice()
  cells[index] = {
    ...cells[index],
    value: 0,
    candidates: new Set<number>(),
  }
  return { cells }
}
