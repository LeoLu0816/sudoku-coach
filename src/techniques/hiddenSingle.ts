import type { Cell, TechniqueSolver, TechniqueStep, UnitType } from '@/types'
import { getUnitCells } from '@/core/board'

/** unit 類型對應的人類可讀名稱 */
const UNIT_LABEL: Record<UnitType, string> = {
  row: '列',
  col: '欄',
  box: '宮',
}

/** unit 顯示名稱（如「R3 列」、「C5 欄」、「第 4 宮」） */
function unitDisplayName(unitType: UnitType, unitIndex: number): string {
  if (unitType === 'row') return `R${unitIndex + 1} ${UNIT_LABEL.row}`
  if (unitType === 'col') return `C${unitIndex + 1} ${UNIT_LABEL.col}`
  return `第 ${unitIndex + 1} ${UNIT_LABEL.box}`
}

/**
 * Hidden Single（隱單）
 * 在某 unit（列 / 欄 / 宮）中，某個數字只能填在唯一一格
 *
 * 注意：此 solver 假設 board.candidates 已是合法狀態（由 orchestrator 預先 recompute）
 */
export const hiddenSingleSolver: TechniqueSolver = {
  meta: {
    id: 'hidden-single',
    name: '隱單',
    shortDesc: '某數字在列/欄/宮中只能填在唯一一格',
  },

  apply(board) {
    const unitTypes: UnitType[] = ['row', 'col', 'box']

    for (const unitType of unitTypes) {
      for (let unitIndex = 0; unitIndex < 9; unitIndex++) {
        const cells = getUnitCells(board, unitType, unitIndex)
        const step = findInUnit(cells, unitType, unitIndex)
        if (step) return step
      }
    }

    return null
  },
}

/** 在一個 unit 內尋找 hidden single；找到回 step，否則 null */
function findInUnit(cells: Cell[], unitType: UnitType, unitIndex: number): TechniqueStep | null {
  for (let v = 1; v <= 9; v++) {
    const candidatesForV = cells.filter((c) => c.value === 0 && c.candidates.has(v))

    if (candidatesForV.length === 1) {
      const target = candidatesForV[0]
      const otherIndices = cells
        .filter((c) => c.index !== target.index && c.value === 0)
        .map((c) => c.index)

      return {
        technique: 'hidden-single',
        targets: [target.index],
        related: otherIndices,
        action: 'place',
        placements: [{ index: target.index, value: v }],
        explanation: `在${unitDisplayName(unitType, unitIndex)} 中，${v} 只能填在 R${target.row + 1}C${target.col + 1}（其他空格的候選都不含 ${v}）。`,
      }
    }
  }

  return null
}
