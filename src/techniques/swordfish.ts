import type { Board, CellIndex, TechniqueSolver, TechniqueStep } from '@/types'
import { getColCells, getRowCells } from '@/core/board'

/**
 * Swordfish（劍魚）
 *
 * X-Wing 的 3×3 推廣：對某數字 d
 * - Row-based：若三列中數字 d 的候選位置（欄）皆 ⊆ 同三欄，且三列欄聯集恰為 3 欄，
 *   則這三欄其他列中含 d 的候選可消去。
 * - Col-based：對偶（三欄 × 三列）。
 *
 * 嚴格要求欄/列聯集 size === 3，排除退化為 X-Wing（size === 2）。
 *
 * 注意：此 solver 假設 board.candidates 已是合法狀態（由 orchestrator 預先 recompute）
 */
export const swordfishSolver: TechniqueSolver = {
  meta: {
    id: 'swordfish',
    name: 'Swordfish（劍魚）',
    shortDesc: '某數字在三列只能填於同三欄（或對偶），可消去這三欄其他列的該候選',
  },

  apply(board) {
    // 1. 嘗試 row-based
    for (let d = 1; d <= 9; d++) {
      const step = findRowBasedSwordfish(board, d)
      if (step) { return step }
    }

    // 2. 嘗試 col-based（對偶）
    for (let d = 1; d <= 9; d++) {
      const step = findColBasedSwordfish(board, d)
      if (step) { return step }
    }

    return null
  },
}

/**
 * Row-based Swordfish 搜尋
 * 流程：
 * 1. 對每列收集 d 候選的欄位置（限值為空格）
 * 2. 收集 size ∈ [2,3] 的列為候選列
 * 3. 對候選列取三列組合，欄聯集恰為 3 欄 → 確認可消除
 * 4. 三欄中其他列（非該三列）含 d 候選 → 列入 eliminations
 */
function findRowBasedSwordfish(board: Board, d: number): TechniqueStep | null {
  // 蒐集每列 d 候選的欄位置
  const rowCandCols: Array<number[]> = []
  for (let r = 0; r < 9; r++) {
    const cells = getRowCells(board, r)
    const cols: number[] = []
    for (const cell of cells) {
      if (cell.value === 0 && cell.candidates.has(d)) {
        cols.push(cell.col)
      }
    }
    rowCandCols.push(cols)
  }

  // 候選列：欄位置數 ∈ [2,3]
  const candRows: number[] = []
  for (let r = 0; r < 9; r++) {
    const size = rowCandCols[r].length
    if (size >= 2 && size <= 3) {
      candRows.push(r)
    }
  }

  if (candRows.length < 3) { return null }

  // 三列組合
  for (let i = 0; i < candRows.length - 2; i++) {
    for (let j = i + 1; j < candRows.length - 1; j++) {
      for (let k = j + 1; k < candRows.length; k++) {
        const r1 = candRows[i]
        const r2 = candRows[j]
        const r3 = candRows[k]

        // 欄聯集
        const colsUnion = new Set<number>([
          ...rowCandCols[r1],
          ...rowCandCols[r2],
          ...rowCandCols[r3],
        ])

        // 嚴格要求 size === 3（排除退化為 X-Wing 的 size === 2）
        if (colsUnion.size !== 3) { continue }

        const colsArr = [...colsUnion].sort((a, b) => a - b)
        const rowSet = new Set([r1, r2, r3])

        // 三欄中其他列的 d 候選 → 可消去
        const eliminations: { index: CellIndex; values: number[] }[] = []
        for (const c of colsArr) {
          const colCells = getColCells(board, c)
          for (const cell of colCells) {
            if (cell.value !== 0) { continue }
            if (rowSet.has(cell.row)) { continue }
            if (cell.candidates.has(d)) {
              eliminations.push({ index: cell.index, values: [d] })
            }
          }
        }

        if (eliminations.length === 0) { continue }

        // related：結構中三列三欄交叉處實際含 d 候選的格
        const related: CellIndex[] = []
        for (const r of [r1, r2, r3]) {
          for (const c of rowCandCols[r]) {
            related.push(r * 9 + c)
          }
        }

        const rowsLabel = [r1, r2, r3].map((r) => `R${r + 1}`).join('、')
        const colsLabel = colsArr.map((c) => `C${c + 1}`).join('、')
        const perRowDesc = [r1, r2, r3]
          .map((r) => {
            const csStr = rowCandCols[r]
              .slice()
              .sort((a, b) => a - b)
              .map((c) => `C${c + 1}`)
              .join(',')
            return `R${r + 1}（{${csStr}}）`
          })
          .join('、')

        const explanation =
          `數字 ${d} 在 ${rowsLabel} 三列分別只能填在 ${perRowDesc}，` +
          `欄聯集恰為 {${colsLabel}}。` +
          `因此 ${colsLabel} 三欄其他列含 ${d} 的候選可消去。`

        return {
          technique: 'swordfish',
          targets: eliminations.map((e) => e.index),
          related: dedupSorted(related),
          action: 'eliminate',
          eliminations,
          explanation,
        }
      }
    }
  }

  return null
}

/**
 * Col-based Swordfish 搜尋（row-based 的對偶）
 * 流程：
 * 1. 對每欄收集 d 候選的列位置
 * 2. 收集 size ∈ [2,3] 的欄為候選欄
 * 3. 對候選欄取三欄組合，列聯集恰為 3 列 → 確認可消除
 * 4. 三列中其他欄（非該三欄）含 d 候選 → 列入 eliminations
 */
function findColBasedSwordfish(board: Board, d: number): TechniqueStep | null {
  // 蒐集每欄 d 候選的列位置
  const colCandRows: Array<number[]> = []
  for (let c = 0; c < 9; c++) {
    const cells = getColCells(board, c)
    const rows: number[] = []
    for (const cell of cells) {
      if (cell.value === 0 && cell.candidates.has(d)) {
        rows.push(cell.row)
      }
    }
    colCandRows.push(rows)
  }

  // 候選欄：列位置數 ∈ [2,3]
  const candCols: number[] = []
  for (let c = 0; c < 9; c++) {
    const size = colCandRows[c].length
    if (size >= 2 && size <= 3) {
      candCols.push(c)
    }
  }

  if (candCols.length < 3) { return null }

  // 三欄組合
  for (let i = 0; i < candCols.length - 2; i++) {
    for (let j = i + 1; j < candCols.length - 1; j++) {
      for (let k = j + 1; k < candCols.length; k++) {
        const c1 = candCols[i]
        const c2 = candCols[j]
        const c3 = candCols[k]

        // 列聯集
        const rowsUnion = new Set<number>([
          ...colCandRows[c1],
          ...colCandRows[c2],
          ...colCandRows[c3],
        ])

        if (rowsUnion.size !== 3) { continue }

        const rowsArr = [...rowsUnion].sort((a, b) => a - b)
        const colSet = new Set([c1, c2, c3])

        // 三列中其他欄的 d 候選 → 可消去
        const eliminations: { index: CellIndex; values: number[] }[] = []
        for (const r of rowsArr) {
          const rowCells = getRowCells(board, r)
          for (const cell of rowCells) {
            if (cell.value !== 0) { continue }
            if (colSet.has(cell.col)) { continue }
            if (cell.candidates.has(d)) {
              eliminations.push({ index: cell.index, values: [d] })
            }
          }
        }

        if (eliminations.length === 0) { continue }

        const related: CellIndex[] = []
        for (const c of [c1, c2, c3]) {
          for (const r of colCandRows[c]) {
            related.push(r * 9 + c)
          }
        }

        const colsLabel = [c1, c2, c3].map((c) => `C${c + 1}`).join('、')
        const rowsLabel = rowsArr.map((r) => `R${r + 1}`).join('、')
        const perColDesc = [c1, c2, c3]
          .map((c) => {
            const rsStr = colCandRows[c]
              .slice()
              .sort((a, b) => a - b)
              .map((r) => `R${r + 1}`)
              .join(',')
            return `C${c + 1}（{${rsStr}}）`
          })
          .join('、')

        const explanation =
          `數字 ${d} 在 ${colsLabel} 三欄分別只能填在 ${perColDesc}，` +
          `列聯集恰為 {${rowsLabel}}。` +
          `因此 ${rowsLabel} 三列其他欄含 ${d} 的候選可消去。`

        return {
          technique: 'swordfish',
          targets: eliminations.map((e) => e.index),
          related: dedupSorted(related),
          action: 'eliminate',
          eliminations,
          explanation,
        }
      }
    }
  }

  return null
}

/** 陣列去重並升序排序 */
function dedupSorted(arr: number[]): number[] {
  return [...new Set(arr)].sort((a, b) => a - b)
}
