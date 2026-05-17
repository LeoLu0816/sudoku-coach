import type { Cell, TechniqueSolver, TechniqueStep, UnitType } from '@/types'
import { getUnitCells } from '@/core/board'

/** unit 類型對應的人類可讀名稱 */
const UNIT_LABEL: Record<UnitType, string> = {
  row: '列',
  col: '欄',
  box: '宮',
}

/** unit 顯示名稱（如「第 1 列」、「第 1 欄」、「第 1 宮」） */
function unitDisplayName(unitType: UnitType, unitIndex: number): string {
  if (unitType === 'row') return `第 ${unitIndex + 1} ${UNIT_LABEL.row}`
  if (unitType === 'col') return `第 ${unitIndex + 1} ${UNIT_LABEL.col}`
  return `第 ${unitIndex + 1} ${UNIT_LABEL.box}`
}

/** 格的人類可讀座標（如 R1C3） */
function cellLabel(cell: Cell): string {
  return `R${cell.row + 1}C${cell.col + 1}`
}

/**
 * 在指定 unit 中嘗試找出 Naked Pair
 * 流程：
 * 1. 篩出候選恰好 2 個的空格
 * 2. 兩兩配對，比較候選集合是否完全相同
 * 3. 若相同，對 unit 其他空格消去 pair 的兩個候選
 * 4. 有消去才回傳 step
 */
function findNakedPairInUnit(
  cells: Cell[],
  unitType: UnitType,
  unitIndex: number,
): TechniqueStep | null {
  // 1. 篩出候選恰好 2 個的空格
  const twoCandCells = cells.filter((c) => c.value === 0 && c.candidates.size === 2)

  if (twoCandCells.length < 2) {
    return null
  }

  // 2. 兩兩配對
  for (let i = 0; i < twoCandCells.length - 1; i++) {
    for (let j = i + 1; j < twoCandCells.length; j++) {
      const cellA = twoCandCells[i]
      const cellB = twoCandCells[j]
      const candsA = [...cellA.candidates]
      const candsB = [...cellB.candidates]

      // 比對候選集合是否完全相同
      const isNakedPair =
        candsA.length === 2 && candsA.every((v) => cellB.candidates.has(v))

      if (!isNakedPair) {
        continue
      }

      const [valX, valY] = candsA.sort((a, b) => a - b)

      // 3. 對 unit 其他空格收集可消去的候選
      const eliminations: { index: number; values: number[] }[] = []

      for (const cell of cells) {
        // 跳過 pair 本身與已填格
        if (cell.index === cellA.index || cell.index === cellB.index) {
          continue
        }
        if (cell.value !== 0) {
          continue
        }

        const toElim: number[] = []
        if (cell.candidates.has(valX)) {
          toElim.push(valX)
        }
        if (cell.candidates.has(valY)) {
          toElim.push(valY)
        }

        if (toElim.length > 0) {
          eliminations.push({ index: cell.index, values: toElim })
        }
      }

      // 4. 有消去才回傳 step
      if (eliminations.length === 0) {
        continue
      }

      const targets = eliminations.map((e) => e.index)
      const related = [cellA.index, cellB.index]

      return {
        technique: 'naked-pair',
        targets,
        related,
        action: 'eliminate',
        eliminations,
        explanation:
          `在${unitDisplayName(unitType, unitIndex)} 中，${cellLabel(cellA)} 與 ${cellLabel(cellB)} 的候選都只剩 {${valX}, ${valY}}，` +
          `因此這兩個位置之一必為 ${valX}，另一必為 ${valY}。同 unit 其他格的候選可消去 ${valX} 與 ${valY}。`,
      }
    }
  }

  return null
}

/**
 * Naked Pair（裸對）Solver
 * 若某 unit 中有兩格的候選都恰好是同樣的兩個數字 {a, b}，
 * 則該 unit 其他格不可能填 a 或 b，可從候選中消除
 */
export const nakedPairSolver: TechniqueSolver = {
  meta: {
    id: 'naked-pair',
    name: '裸對',
    shortDesc: '某 unit 中兩格候選完全相同（只剩兩個數字），可消去同 unit 其他格的相同候選',
  },

  apply(board) {
    const unitTypes: UnitType[] = ['row', 'col', 'box']

    for (const unitType of unitTypes) {
      for (let unitIndex = 0; unitIndex < 9; unitIndex++) {
        const cells = getUnitCells(board, unitType, unitIndex)
        const step = findNakedPairInUnit(cells, unitType, unitIndex)
        if (step) {
          return step
        }
      }
    }

    return null
  },
}
