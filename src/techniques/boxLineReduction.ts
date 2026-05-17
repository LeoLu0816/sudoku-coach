import type { TechniqueSolver, TechniqueStep } from '@/types'
import { getRowCells, getColCells, getBoxCells } from '@/core/board'
import type { Board } from '@/types'

/**
 * Box / Line Reduction（區塊行列消除）
 *
 * 演算法：
 * 1. 掃描每列（row 0..8）和每欄（col 0..8）
 * 2. 對每個數字 v（1..9）
 * 3. 找出列（或欄）中候選含 v 的空格集合 S
 * 4. 若 S 全部位於同一 box → 該 box 內不在此列（欄）的其他格若候選含 v → 加入消除
 * 5. 有消除則回傳 step
 */
export const boxLineReductionSolver: TechniqueSolver = {
  meta: {
    id: 'box-line-reduction',
    name: '區塊行列消除',
    shortDesc: '若某數字在某列/欄的候選全在同一宮，可消除該宮其他格的此數字',
  },

  apply(board: Board): TechniqueStep | null {
    // 1. 掃描每列
    for (let rowIdx = 0; rowIdx < 9; rowIdx++) {
      const step = findInRow(board, rowIdx)
      if (step !== null) {
        return step
      }
    }

    // 2. 掃描每欄
    for (let colIdx = 0; colIdx < 9; colIdx++) {
      const step = findInCol(board, colIdx)
      if (step !== null) {
        return step
      }
    }

    return null
  },
}

/**
 * 在指定列中尋找 box-line-reduction 機會（row → box 方向）
 * 若找到回傳 TechniqueStep，否則 null
 */
function findInRow(board: Board, rowIdx: number): TechniqueStep | null {
  const rowCells = getRowCells(board, rowIdx)

  for (let v = 1; v <= 9; v++) {
    // 找出此列中候選含 v 的空格
    const candidateCells = rowCells.filter((c) => c.value === 0 && c.candidates.has(v))

    if (candidateCells.length < 2) {
      // 少於 2 格無意義（1 格是 hidden single，0 格無候選）
      continue
    }

    // 確認這些格是否全在同一 box
    const boxes = new Set(candidateCells.map((c) => c.box))
    if (boxes.size !== 1) {
      continue
    }

    const boxIdx = candidateCells[0].box
    const candidateIndices = new Set(candidateCells.map((c) => c.index))

    // 找出此 box 中不在此列、且候選含 v 的格
    const boxCells = getBoxCells(board, boxIdx)
    const elimTargets = boxCells.filter(
      (c) => c.value === 0 && c.row !== rowIdx && c.candidates.has(v),
    )

    if (elimTargets.length === 0) {
      continue
    }

    // 組裝說明文字
    const relatedDesc = candidateCells.map((c) => `R${c.row + 1}C${c.col + 1}`).join('、')
    const explanation =
      `在 R${rowIdx + 1} 列中，${v} 只能填在 ${relatedDesc}，` +
      `皆位於第 ${boxIdx + 1} 宮。因此第 ${boxIdx + 1} 宮其他格（不在 R${rowIdx + 1} 列）不可能填 ${v}。`

    return {
      technique: 'box-line-reduction',
      targets: elimTargets.map((c) => c.index),
      related: [...candidateIndices],
      action: 'eliminate',
      eliminations: elimTargets.map((c) => ({ index: c.index, values: [v] })),
      explanation,
    }
  }

  return null
}

/**
 * 在指定欄中尋找 box-line-reduction 機會（col → box 方向）
 * 若找到回傳 TechniqueStep，否則 null
 */
function findInCol(board: Board, colIdx: number): TechniqueStep | null {
  const colCells = getColCells(board, colIdx)

  for (let v = 1; v <= 9; v++) {
    // 找出此欄中候選含 v 的空格
    const candidateCells = colCells.filter((c) => c.value === 0 && c.candidates.has(v))

    if (candidateCells.length < 2) {
      continue
    }

    // 確認這些格是否全在同一 box
    const boxes = new Set(candidateCells.map((c) => c.box))
    if (boxes.size !== 1) {
      continue
    }

    const boxIdx = candidateCells[0].box
    const candidateIndices = new Set(candidateCells.map((c) => c.index))

    // 找出此 box 中不在此欄、且候選含 v 的格
    const boxCells = getBoxCells(board, boxIdx)
    const elimTargets = boxCells.filter(
      (c) => c.value === 0 && c.col !== colIdx && c.candidates.has(v),
    )

    if (elimTargets.length === 0) {
      continue
    }

    // 組裝說明文字
    const relatedDesc = candidateCells.map((c) => `R${c.row + 1}C${c.col + 1}`).join('、')
    const explanation =
      `在 C${colIdx + 1} 欄中，${v} 只能填在 ${relatedDesc}，` +
      `皆位於第 ${boxIdx + 1} 宮。因此第 ${boxIdx + 1} 宮其他格（不在 C${colIdx + 1} 欄）不可能填 ${v}。`

    return {
      technique: 'box-line-reduction',
      targets: elimTargets.map((c) => c.index),
      related: [...candidateIndices],
      action: 'eliminate',
      eliminations: elimTargets.map((c) => ({ index: c.index, values: [v] })),
      explanation,
    }
  }

  return null
}
