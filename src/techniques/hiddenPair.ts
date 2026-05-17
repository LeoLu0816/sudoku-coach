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

/** 格子座標的人類可讀名稱（如「R3C5」） */
function cellDisplayName(cell: Cell): string {
  return `R${cell.row + 1}C${cell.col + 1}`
}

/**
 * Hidden Pair（隱對）
 * 若某 unit 中有兩個數字 {a, b} 只能填在同樣的兩格，
 * 那兩格的其他候選可消除（只保留 a, b）。
 *
 * 注意：此 solver 假設 board.candidates 已是合法狀態（由 orchestrator 預先 recompute）
 */
export const hiddenPairSolver: TechniqueSolver = {
  meta: {
    id: 'hidden-pair',
    name: '隱對',
    shortDesc: '某兩數字在列/欄/宮中只能填在同樣兩格，可消除這兩格的其他候選',
  },

  apply(board) {
    const unitTypes: UnitType[] = ['row', 'col', 'box']

    for (const unitType of unitTypes) {
      for (let unitIndex = 0; unitIndex < 9; unitIndex++) {
        const cells = getUnitCells(board, unitType, unitIndex)
        const step = findHiddenPairInUnit(cells, unitType, unitIndex)
        if (step) return step
      }
    }

    return null
  },
}

/**
 * 在一個 unit 內尋找 hidden pair
 * 流程：
 * 1. 找出所有空格
 * 2. 對數字組合 (a, b)，a < b，找候選含 a 的格集合 S_a 與含 b 的格集合 S_b
 * 3. 若 S_a === S_b 且大小 === 2，且這兩格還有除 a, b 外的候選 → 產生 step
 */
function findHiddenPairInUnit(
  cells: Cell[],
  unitType: UnitType,
  unitIndex: number,
): TechniqueStep | null {
  // 只考慮空格
  const emptyCells = cells.filter((c) => c.value === 0)

  // 對每個數字組合 (a, b)，a < b
  for (let a = 1; a <= 8; a++) {
    for (let b = a + 1; b <= 9; b++) {
      // S_a：此 unit 空格中候選含 a 的格
      const sA = emptyCells.filter((c) => c.candidates.has(a))
      // S_b：此 unit 空格中候選含 b 的格
      const sB = emptyCells.filter((c) => c.candidates.has(b))

      // 兩集合大小皆須為 2
      if (sA.length !== 2 || sB.length !== 2) continue

      // 兩集合所含格的 index 必須相同（集合相等）
      if (sA[0].index !== sB[0].index || sA[1].index !== sB[1].index) continue

      // 這兩格就是隱對的候選格
      const pairCells = sA

      // 確認這兩格確實還有除 a, b 外的候選需要消除
      const eliminations: { index: number; values: number[] }[] = []

      for (const cell of pairCells) {
        const extraValues = [...cell.candidates].filter((v) => v !== a && v !== b)
        if (extraValues.length > 0) {
          eliminations.push({ index: cell.index, values: extraValues })
        }
      }

      // 若無消除目標，此對雖存在但無作用（可能已整理過）
      if (eliminations.length === 0) continue

      // related：unit 中除這兩格之外的空格
      const pairIndices = new Set(pairCells.map((c) => c.index))
      const related = emptyCells.filter((c) => !pairIndices.has(c.index)).map((c) => c.index)

      const [cell0, cell1] = pairCells
      const explanation =
        `在${unitDisplayName(unitType, unitIndex)}中，` +
        `${a} 與 ${b} 只能填在 ${cellDisplayName(cell0)} 與 ${cellDisplayName(cell1)} 兩格。` +
        `因此這兩格只可能是 ${a} 或 ${b}，可消去其他候選。`

      return {
        technique: 'hidden-pair',
        targets: pairCells.map((c) => c.index),
        related,
        action: 'eliminate',
        eliminations,
        explanation,
      }
    }
  }

  return null
}
