import type { Board, TechniqueSolver, TechniqueStep } from '@/types'
import { getRowCells, getColCells } from '@/core/board'

/**
 * X-Wing（雙線矩形）
 * 對某數字 d：
 * - Row-based：若兩列各自 d 候選只剩相同的兩欄 → 這兩欄其他列含 d 的格可消去
 * - Col-based：對偶，兩欄各自 d 候選只剩相同的兩列 → 這兩列其他欄含 d 的格可消去
 *
 * 注意：此 solver 假設 board.candidates 已是合法狀態（由 orchestrator 預先 recompute）
 */
export const xWingSolver: TechniqueSolver = {
  meta: {
    id: 'x-wing',
    name: 'X-Wing（雙線矩形）',
    shortDesc: '某數字在兩列只能填於相同兩欄（或反之），矩形四角外的同欄/列候選可消去',
  },

  apply(board) {
    // 對每個數字 d 同時掃 row-based 與 col-based
    for (let d = 1; d <= 9; d++) {
      const rowStep = findRowBasedXWing(board, d)
      if (rowStep) { return rowStep }

      const colStep = findColBasedXWing(board, d)
      if (colStep) { return colStep }
    }

    return null
  },
}

/**
 * 找出數字 d 的 row-based X-Wing
 * 流程：
 * 1. 計算每列 d 的候選欄位置集合
 * 2. 收集恰好 2 個位置的列
 * 3. 對列兩兩配對；若欄位置完全相同 → 構成 X-Wing
 * 4. 對這兩欄其他列含 d 的格產生消去步驟
 */
function findRowBasedXWing(board: Board, d: number): TechniqueStep | null {
  // 收集每列 d 候選的欄位置（僅針對空格）
  const rowToCols: Map<number, number[]> = new Map()

  for (let r = 0; r < 9; r++) {
    const cells = getRowCells(board, r)
    const cols: number[] = []
    for (const cell of cells) {
      if (cell.value === 0 && cell.candidates.has(d)) {
        cols.push(cell.col)
      }
    }
    rowToCols.set(r, cols)
  }

  // 篩出剛好 2 個 d 候選位置的列
  const rowsWithTwo: number[] = []
  for (const [r, cols] of rowToCols) {
    if (cols.length === 2) {
      rowsWithTwo.push(r)
    }
  }

  if (rowsWithTwo.length < 2) { return null }

  // 兩兩配對檢查欄位置是否相同
  for (let i = 0; i < rowsWithTwo.length - 1; i++) {
    for (let j = i + 1; j < rowsWithTwo.length; j++) {
      const r1 = rowsWithTwo[i]
      const r2 = rowsWithTwo[j]
      const cols1 = rowToCols.get(r1) as number[]
      const cols2 = rowToCols.get(r2) as number[]

      // 兩列欄位置必須完全相同
      if (cols1[0] !== cols2[0] || cols1[1] !== cols2[1]) { continue }

      const [c1, c2] = cols1

      // 對兩欄收集其他列（r1、r2 以外）含 d 的格作為消去目標
      const eliminations: { index: number; values: number[] }[] = []
      for (const c of [c1, c2]) {
        const colCells = getColCells(board, c)
        for (const cell of colCells) {
          if (cell.row === r1 || cell.row === r2) { continue }
          if (cell.value !== 0) { continue }
          if (cell.candidates.has(d)) {
            eliminations.push({ index: cell.index, values: [d] })
          }
        }
      }

      if (eliminations.length === 0) { continue }

      // 矩形四角 index（依 row-major 排序）
      const cornerIndices = [
        r1 * 9 + c1,
        r1 * 9 + c2,
        r2 * 9 + c1,
        r2 * 9 + c2,
      ]

      const explanation =
        `數字 ${d} 在 R${r1 + 1} 列只能填在 C${c1 + 1}、C${c2 + 1}，` +
        `在 R${r2 + 1} 列也只能填在 C${c1 + 1}、C${c2 + 1}。` +
        `四角 R${r1 + 1}C${c1 + 1}、R${r1 + 1}C${c2 + 1}、R${r2 + 1}C${c1 + 1}、R${r2 + 1}C${c2 + 1} 形成 X-Wing。` +
        `C${c1 + 1} 與 C${c2 + 1} 欄其他列的 ${d} 候選可消去。`

      return {
        technique: 'x-wing',
        targets: eliminations.map((e) => e.index),
        related: cornerIndices,
        action: 'eliminate',
        eliminations,
        explanation,
      }
    }
  }

  return null
}

/**
 * 找出數字 d 的 col-based X-Wing（row-based 對偶）
 * 流程：
 * 1. 計算每欄 d 的候選列位置集合
 * 2. 收集恰好 2 個位置的欄
 * 3. 對欄兩兩配對；若列位置完全相同 → 構成 X-Wing
 * 4. 對這兩列其他欄含 d 的格產生消去步驟
 */
function findColBasedXWing(board: Board, d: number): TechniqueStep | null {
  // 收集每欄 d 候選的列位置（僅針對空格）
  const colToRows: Map<number, number[]> = new Map()

  for (let c = 0; c < 9; c++) {
    const cells = getColCells(board, c)
    const rows: number[] = []
    for (const cell of cells) {
      if (cell.value === 0 && cell.candidates.has(d)) {
        rows.push(cell.row)
      }
    }
    colToRows.set(c, rows)
  }

  // 篩出剛好 2 個 d 候選位置的欄
  const colsWithTwo: number[] = []
  for (const [c, rows] of colToRows) {
    if (rows.length === 2) {
      colsWithTwo.push(c)
    }
  }

  if (colsWithTwo.length < 2) { return null }

  // 兩兩配對檢查列位置是否相同
  for (let i = 0; i < colsWithTwo.length - 1; i++) {
    for (let j = i + 1; j < colsWithTwo.length; j++) {
      const c1 = colsWithTwo[i]
      const c2 = colsWithTwo[j]
      const rows1 = colToRows.get(c1) as number[]
      const rows2 = colToRows.get(c2) as number[]

      if (rows1[0] !== rows2[0] || rows1[1] !== rows2[1]) { continue }

      const [r1, r2] = rows1

      // 對兩列收集其他欄（c1、c2 以外）含 d 的格作為消去目標
      const eliminations: { index: number; values: number[] }[] = []
      for (const r of [r1, r2]) {
        const rowCells = getRowCells(board, r)
        for (const cell of rowCells) {
          if (cell.col === c1 || cell.col === c2) { continue }
          if (cell.value !== 0) { continue }
          if (cell.candidates.has(d)) {
            eliminations.push({ index: cell.index, values: [d] })
          }
        }
      }

      if (eliminations.length === 0) { continue }

      const cornerIndices = [
        r1 * 9 + c1,
        r1 * 9 + c2,
        r2 * 9 + c1,
        r2 * 9 + c2,
      ]

      const explanation =
        `數字 ${d} 在 C${c1 + 1} 欄只能填在 R${r1 + 1}、R${r2 + 1}，` +
        `在 C${c2 + 1} 欄也只能填在 R${r1 + 1}、R${r2 + 1}。` +
        `四角 R${r1 + 1}C${c1 + 1}、R${r1 + 1}C${c2 + 1}、R${r2 + 1}C${c1 + 1}、R${r2 + 1}C${c2 + 1} 形成 X-Wing。` +
        `R${r1 + 1} 與 R${r2 + 1} 列其他欄的 ${d} 候選可消去。`

      return {
        technique: 'x-wing',
        targets: eliminations.map((e) => e.index),
        related: cornerIndices,
        action: 'eliminate',
        eliminations,
        explanation,
      }
    }
  }

  return null
}

