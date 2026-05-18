import type { Cell, TechniqueSolver, TechniqueStep, UnitType } from '@/types'
import { getUnitCells } from '@/core/board'

/** unit 類型對應的人類可讀名稱 */
const UNIT_LABEL: Record<UnitType, string> = {
  row: '列',
  col: '欄',
  box: '宮',
}

/** unit 顯示名稱 */
function unitDisplayName(unitType: UnitType, unitIndex: number): string {
  if (unitType === 'row') { return `R${unitIndex + 1} ${UNIT_LABEL.row}` }
  if (unitType === 'col') { return `C${unitIndex + 1} ${UNIT_LABEL.col}` }
  return `第 ${unitIndex + 1} ${UNIT_LABEL.box}`
}

/** 格子的 R?C? 標示 */
function cellLabel(cell: Cell): string {
  return `R${cell.row + 1}C${cell.col + 1}`
}

/**
 * Hidden Triple（隱三）
 * 若某 unit 中三個數字 {a,b,c} 只可填在同樣三格中（且任一格至少含其一），
 * 則這三格可消去除 {a,b,c} 外的候選。
 *
 * 注意：此 solver 假設 board.candidates 已是合法狀態（由 orchestrator 預先 recompute）
 */
export const hiddenTripleSolver: TechniqueSolver = {
  meta: {
    id: 'hidden-triple',
    name: '隱三',
    shortDesc: '三數字在列/欄/宮中只能填在同樣三格，可消去這三格的其他候選',
  },

  apply(board) {
    const unitTypes: UnitType[] = ['row', 'col', 'box']

    for (const unitType of unitTypes) {
      for (let unitIndex = 0; unitIndex < 9; unitIndex++) {
        const cells = getUnitCells(board, unitType, unitIndex)
        const step = findHiddenTripleInUnit(cells, unitType, unitIndex)
        if (step) { return step }
      }
    }

    return null
  },
}

/**
 * 在單一 unit 內尋找隱三
 * 1. 取空格列表
 * 2. 計算每個數字 1..9 在此 unit 中可填位置集合 P[v]
 * 3. 過濾 1 < |P[v]| <= 3 的數字（=1 屬 hidden single；>3 不可能成 triple）
 * 4. 對三數字組合 (a,b,c)，union = P[a] ∪ P[b] ∪ P[c]，若 |union| === 3 → 隱三
 * 5. 對 union 中三格消除非 {a,b,c} 的候選
 */
function findHiddenTripleInUnit(
  cells: Cell[],
  unitType: UnitType,
  unitIndex: number,
): TechniqueStep | null {
  const emptyCells = cells.filter((c) => c.value === 0)
  if (emptyCells.length < 3) { return null }

  // P[v]：value v 在此 unit 中可填的格 index 集合
  const positions: Map<number, Set<number>> = new Map()
  for (let v = 1; v <= 9; v++) {
    const s = new Set<number>()
    for (const c of emptyCells) {
      if (c.candidates.has(v)) { s.add(c.index) }
    }
    positions.set(v, s)
  }

  // 篩出 |P[v]| 介於 2..3 的數字（隱三候選）
  const candidateDigits: number[] = []
  for (let v = 1; v <= 9; v++) {
    const size = positions.get(v)!.size
    if (size >= 2 && size <= 3) { candidateDigits.push(v) }
  }
  if (candidateDigits.length < 3) { return null }

  // 對三數字組合
  const n = candidateDigits.length
  for (let i = 0; i < n - 2; i++) {
    for (let j = i + 1; j < n - 1; j++) {
      for (let k = j + 1; k < n; k++) {
        const a = candidateDigits[i]
        const b = candidateDigits[j]
        const c = candidateDigits[k]
        const union = new Set<number>([
          ...positions.get(a)!,
          ...positions.get(b)!,
          ...positions.get(c)!,
        ])
        if (union.size !== 3) { continue }

        // 取得三格的 Cell 引用
        const tripleCells = emptyCells.filter((cell) => union.has(cell.index))

        // 收集需消除的候選（非 {a,b,c} 的候選）
        const tripleSet = new Set([a, b, c])
        const eliminations: { index: number; values: number[] }[] = []
        for (const cell of tripleCells) {
          const extra = [...cell.candidates].filter((v) => !tripleSet.has(v))
          if (extra.length > 0) {
            eliminations.push({ index: cell.index, values: extra })
          }
        }

        if (eliminations.length === 0) { continue }

        const tripleSorted = [a, b, c].sort((x, y) => x - y)
        const cellsDesc = tripleCells.map(cellLabel).join('、')
        const explanation =
          `在${unitDisplayName(unitType, unitIndex)} 中，` +
          `${tripleSorted.join('、')} 只能填在 ${cellsDesc} 三格。` +
          `因此這三格的其他候選可消去。`

        return {
          technique: 'hidden-triple',
          targets: eliminations.map((e) => e.index),
          related: [...union],
          action: 'eliminate',
          eliminations,
          explanation,
        }
      }
    }
  }

  return null
}
