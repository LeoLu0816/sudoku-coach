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
 * Naked Quad（裸四）
 * 若某 unit 中四格的候選聯集恰為同樣四個數字 {a,b,c,d}（每格 size 介於 2..4），
 * 則該 unit 其他格不可填 a/b/c/d。
 *
 * 注意：此 solver 假設 board.candidates 已是合法狀態（由 orchestrator 預先 recompute）
 */
export const nakedQuadSolver: TechniqueSolver = {
  meta: {
    id: 'naked-quad',
    name: '裸四',
    shortDesc: '四格候選聯集恰為四個數字，可從同 unit 其他格刪除這四個候選',
  },

  apply(board) {
    const unitTypes: UnitType[] = ['row', 'col', 'box']

    for (const unitType of unitTypes) {
      for (let unitIndex = 0; unitIndex < 9; unitIndex++) {
        const cells = getUnitCells(board, unitType, unitIndex)
        const step = findNakedQuadInUnit(cells, unitType, unitIndex)
        if (step) { return step }
      }
    }

    return null
  },
}

/**
 * 在單一 unit 中尋找裸四
 * 1. 收集候選 size 為 2/3/4 的空格集合 S
 * 2. 對 S 取四格組合 (i, j, k, l)
 * 3. 四格候選聯集 size === 4 → 視為裸四
 * 4. 對 unit 其他空格消除聯集中的候選
 */
function findNakedQuadInUnit(
  cells: Cell[],
  unitType: UnitType,
  unitIndex: number,
): TechniqueStep | null {
  const candidates = cells.filter(
    (c) => c.value === 0 && c.candidates.size >= 2 && c.candidates.size <= 4,
  )

  const n = candidates.length
  if (n < 4) { return null }

  // 四格組合
  for (let a = 0; a < n - 3; a++) {
    for (let b = a + 1; b < n - 2; b++) {
      for (let c = b + 1; c < n - 1; c++) {
        for (let d = c + 1; d < n; d++) {
          const quad = [candidates[a], candidates[b], candidates[c], candidates[d]]
          const step = tryQuad(quad, cells, unitType, unitIndex)
          if (step) { return step }
        }
      }
    }
  }

  return null
}

/**
 * 嘗試四格組合是否構成裸四
 * - 聯集 size 必須 === 4
 * - 對 unit 其他空格收集可消除的候選
 */
function tryQuad(
  quad: Cell[],
  allCells: Cell[],
  unitType: UnitType,
  unitIndex: number,
): TechniqueStep | null {
  const union = new Set<number>()
  for (const cell of quad) {
    for (const v of cell.candidates) {
      union.add(v)
    }
  }

  if (union.size !== 4) { return null }

  const quadIndices = new Set(quad.map((c) => c.index))

  const eliminations: { index: number; values: number[] }[] = []
  for (const cell of allCells) {
    if (cell.value !== 0) { continue }
    if (quadIndices.has(cell.index)) { continue }

    const toEliminate = [...cell.candidates].filter((v) => union.has(v))
    if (toEliminate.length > 0) {
      eliminations.push({ index: cell.index, values: toEliminate })
    }
  }

  if (eliminations.length === 0) { return null }

  const unionSorted = [...union].sort((a, b) => a - b)
  const unionStr = `{${unionSorted.join(',')}}`

  const quadDesc = quad
    .map((c) => {
      const vals = [...c.candidates].sort((a, b) => a - b).join(',')
      return `${cellLabel(c)}（{${vals}}）`
    })
    .join('、')

  const explanation =
    `在${unitDisplayName(unitType, unitIndex)} 中，` +
    `${quadDesc} 的候選聯集恰為 ${unionStr}。` +
    `因此這四格必填 ${unionSorted.join('、')}，` +
    `同 unit 其他格不可能有這些候選。`

  return {
    technique: 'naked-quad',
    targets: eliminations.map((e) => e.index),
    related: quad.map((c) => c.index),
    action: 'eliminate',
    eliminations,
    explanation,
  }
}
