import type { TechniqueSolver, TechniqueStep } from '@/types'
import { getBoxCells, getRowCells, getColCells } from '@/core/board'
import type { Board } from '@/types'

/**
 * 宮編號對應的人類可讀名稱（1-based）
 */
function boxDisplayName(box: number): string {
  return `第 ${box + 1} 宮`
}

/**
 * 在一個宮內針對數字 v 進行 pointing pair 判斷。
 * 1. 找宮內候選含 v 的空格集合 S
 * 2. 若 S 全在同一 row → 消除該 row 中宮外含 v 的格
 * 3. 若 S 全在同一 col → 消除該 col 中宮外含 v 的格
 */
function findInBox(board: Board, boxIndex: number, v: number): TechniqueStep | null {
  const boxCells = getBoxCells(board, boxIndex)
  // 找宮內候選含 v 的空格
  const candidates = boxCells.filter((c) => c.value === 0 && c.candidates.has(v))

  if (candidates.length < 2) {
    return null
  }

  const related = candidates.map((c) => c.index)

  // 檢查是否全在同一 row
  const rows = new Set(candidates.map((c) => c.row))
  if (rows.size === 1) {
    const row = [...rows][0]
    const rowCells = getRowCells(board, row)
    // 找宮外、該 row 上含 v 的空格 → 消除
    const elimCells = rowCells.filter(
      (c) => c.value === 0 && c.box !== boxIndex && c.candidates.has(v),
    )
    if (elimCells.length > 0) {
      const eliminations = elimCells.map((c) => ({ index: c.index, values: [v] }))
      const targets = elimCells.map((c) => c.index)
      const relatedDisplay = candidates.map((c) => `R${c.row + 1}C${c.col + 1}`).join(' 或 ')
      return {
        technique: 'pointing-pair',
        targets,
        related,
        action: 'eliminate',
        eliminations,
        explanation: `在${boxDisplayName(boxIndex)}中，${v} 只能填在 ${relatedDisplay}，皆位於第 ${row + 1} 列。因此第 ${row + 1} 列的宮外其他格不可能填 ${v}。`,
      }
    }
  }

  // 檢查是否全在同一 col
  const cols = new Set(candidates.map((c) => c.col))
  if (cols.size === 1) {
    const col = [...cols][0]
    const colCells = getColCells(board, col)
    // 找宮外、該 col 上含 v 的空格 → 消除
    const elimCells = colCells.filter(
      (c) => c.value === 0 && c.box !== boxIndex && c.candidates.has(v),
    )
    if (elimCells.length > 0) {
      const eliminations = elimCells.map((c) => ({ index: c.index, values: [v] }))
      const targets = elimCells.map((c) => c.index)
      const relatedDisplay = candidates.map((c) => `R${c.row + 1}C${c.col + 1}`).join(' 或 ')
      return {
        technique: 'pointing-pair',
        targets,
        related,
        action: 'eliminate',
        eliminations,
        explanation: `在${boxDisplayName(boxIndex)}中，${v} 只能填在 ${relatedDisplay}，皆位於第 ${col + 1} 欄。因此第 ${col + 1} 欄的宮外其他格不可能填 ${v}。`,
      }
    }
  }

  return null
}

/**
 * Pointing Pair（指向對）
 * 若某數字在某宮中的候選只落在同一列或同一欄，
 * 則該列/欄宮外的其他格不可能填此數字。
 *
 * action: 'eliminate'，targets 為宮外被消除的格，related 為宮內候選格。
 */
export const pointingPairSolver: TechniqueSolver = {
  meta: {
    id: 'pointing-pair',
    name: '指向對',
    shortDesc: '某數字在宮內只出現在同一列/欄，可消除該列/欄宮外的候選',
  },

  apply(board: Board): TechniqueStep | null {
    // 1. 依序掃描 9 個宮
    for (let boxIndex = 0; boxIndex < 9; boxIndex++) {
      // 2. 對每個數字 v 進行判斷
      for (let v = 1; v <= 9; v++) {
        const step = findInBox(board, boxIndex, v)
        if (step) {
          return step
        }
      }
    }
    return null
  },
}
