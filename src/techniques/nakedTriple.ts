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
  if (unitType === 'row') { return `R${unitIndex + 1} ${UNIT_LABEL.row}` }
  if (unitType === 'col') { return `C${unitIndex + 1} ${UNIT_LABEL.col}` }
  return `第 ${unitIndex + 1} ${UNIT_LABEL.box}`
}

/** 格子的 R?C? 標示（1-based） */
function cellLabel(cell: Cell): string {
  return `R${cell.row + 1}C${cell.col + 1}`
}

/**
 * Naked Triple（裸三）
 * 若某 unit 中三格的候選聯集恰好是同樣三個數字 {a,b,c}（每格為子集，size 2 或 3），
 * 則該 unit 其他格不能填 a/b/c。
 *
 * 注意：此 solver 假設 board.candidates 已是合法狀態（由 orchestrator 預先 recompute）
 */
export const nakedTripleSolver: TechniqueSolver = {
  meta: {
    id: 'naked-triple',
    name: '裸三',
    shortDesc: '三格候選聯集恰為三個數字，可從同 unit 其他格刪除這三個候選',
  },

  apply(board) {
    const unitTypes: UnitType[] = ['row', 'col', 'box']

    for (const unitType of unitTypes) {
      for (let unitIndex = 0; unitIndex < 9; unitIndex++) {
        const cells = getUnitCells(board, unitType, unitIndex)
        const step = findNakedTripleInUnit(cells, unitType, unitIndex)
        if (step) { return step }
      }
    }

    return null
  },
}

/**
 * 在單一 unit 中尋找裸三
 * 1. 收集候選 size 為 2 或 3 的空格集合 S
 * 2. 對 S 取三格組合 (i, j, k)
 * 3. 三格候選聯集 size === 3 → 視為裸三
 * 4. 對 unit 其他空格消除聯集中出現的候選數
 */
function findNakedTripleInUnit(
  cells: Cell[],
  unitType: UnitType,
  unitIndex: number,
): TechniqueStep | null {
  // 收集候選 size 為 2 或 3 的空格
  const candidates = cells.filter(
    (c) => c.value === 0 && c.candidates.size >= 2 && c.candidates.size <= 3,
  )

  const n = candidates.length
  if (n < 3) { return null }

  // 對 candidates 取三格組合
  for (let a = 0; a < n - 2; a++) {
    for (let b = a + 1; b < n - 1; b++) {
      for (let c = b + 1; c < n; c++) {
        const triple = [candidates[a], candidates[b], candidates[c]]
        const step = tryTriple(triple, cells, unitType, unitIndex)
        if (step) { return step }
      }
    }
  }

  return null
}

/**
 * 嘗試三格組合是否構成裸三
 * - 三格候選聯集 size === 3 → 裸三
 * - 對 unit 其他空格收集可消除的候選
 * - 有消除則回 step，否則 null
 */
function tryTriple(
  triple: Cell[],
  allCells: Cell[],
  unitType: UnitType,
  unitIndex: number,
): TechniqueStep | null {
  // 計算三格候選聯集
  const union = new Set<number>()
  for (const cell of triple) {
    for (const v of cell.candidates) {
      union.add(v)
    }
  }

  // 聯集 size 必須恰好為 3
  if (union.size !== 3) { return null }

  // 收集裸三格的 index，供比對排除
  const tripleIndices = new Set(triple.map((c) => c.index))

  // 對 unit 內其他空格找可消除的候選
  const eliminations: { index: number; values: number[] }[] = []
  for (const cell of allCells) {
    if (cell.value !== 0) { continue }
    if (tripleIndices.has(cell.index)) { continue }

    // 找出此格中屬於聯集的候選數
    const toEliminate = [...cell.candidates].filter((v) => union.has(v))
    if (toEliminate.length > 0) {
      eliminations.push({ index: cell.index, values: toEliminate })
    }
  }

  if (eliminations.length === 0) { return null }

  // 組裝聯集數字字串（如 {1,2,3}）
  const unionSorted = [...union].sort((a, b) => a - b)
  const unionStr = `{${unionSorted.join(',')}}`

  // 裸三格的各自候選字串（如 {1,3}、{2,3}）
  const tripleDesc = triple
    .map((c) => {
      const vals = [...c.candidates].sort((a, b) => a - b).join(',')
      return `${cellLabel(c)}（{${vals}}）`
    })
    .join('、')

  const explanation =
    `在${unitDisplayName(unitType, unitIndex)} 中，` +
    `${tripleDesc} 的候選聯集恰為 ${unionStr}。` +
    `因此這三格必填 ${unionSorted.join('、')}，` +
    `同 unit 其他格不可能有這些候選。`

  return {
    technique: 'naked-triple',
    targets: eliminations.map((e) => e.index),
    related: triple.map((c) => c.index),
    action: 'eliminate',
    eliminations,
    explanation,
  }
}
