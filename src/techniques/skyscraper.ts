import type { Board, CellIndex, TechniqueSolver, TechniqueStep } from '@/types'
import { getRowCells, getColCells, getPeers } from '@/core/board'

/**
 * Skyscraper（摩天樓）
 * 對某數字 d：
 * - Row-based：兩列各只有 2 個候選 d 位置，且共享恰好一個欄；
 *   兩個非共享端構成「樓頂兩端」，其共同 peer 中含 d 的候選可消去。
 * - Col-based：對偶（兩欄各 2 個候選 d，共享一列；兩個非共享端的共同 peer 含 d 可消去）。
 *
 * 注意：此 solver 假設 board.candidates 已是合法狀態（由 orchestrator 預先 recompute）
 */
export const skyscraperSolver: TechniqueSolver = {
  meta: {
    id: 'skyscraper',
    name: 'Skyscraper（摩天樓）',
    shortDesc:
      '某數字在兩列各 2 個位置且共享一欄（或對偶），非共享端的共同 peer 候選可消去',
  },

  apply(board) {
    // 對每個數字 d 同時掃 row-based 與 col-based
    for (let d = 1; d <= 9; d++) {
      const rowStep = findRowBasedSkyscraper(board, d)
      if (rowStep) {
        return rowStep
      }

      const colStep = findColBasedSkyscraper(board, d)
      if (colStep) {
        return colStep
      }
    }

    return null
  },
}

/**
 * 找出數字 d 的 row-based Skyscraper
 * 流程：
 * 1. 計算每列 d 的候選欄位置集合
 * 2. 收集恰好 2 個位置的列
 * 3. 對列兩兩配對；若欄位置交集為 1（共享欄）→ 構成 Skyscraper
 * 4. 兩個非共享端的共同 peer 中含 d 候選的格 → 消去
 */
function findRowBasedSkyscraper(board: Board, d: number): TechniqueStep | null {
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

  if (rowsWithTwo.length < 2) {
    return null
  }

  // 兩兩配對：找共享一欄的兩列
  for (let i = 0; i < rowsWithTwo.length - 1; i++) {
    for (let j = i + 1; j < rowsWithTwo.length; j++) {
      const r1 = rowsWithTwo[i]
      const r2 = rowsWithTwo[j]
      const cols1 = rowToCols.get(r1) as number[]
      const cols2 = rowToCols.get(r2) as number[]

      // 計算共享欄（交集）
      const shared: number[] = cols1.filter((c) => cols2.includes(c))

      // 共享數 = 0 → 無交集；= 2 → X-Wing 場景；皆跳過
      if (shared.length !== 1) {
        continue
      }

      const sharedCol = shared[0]
      const c1 = cols1.find((c) => c !== sharedCol) as number
      const c2 = cols2.find((c) => c !== sharedCol) as number

      // 非共享欄相同 → 退化為 X-Wing，跳過（理論上 shared.length === 1 不會發生，仍做保險）
      if (c1 === c2) {
        continue
      }

      const cell1Index = r1 * 9 + c1
      const cell2Index = r2 * 9 + c2

      // 計算兩個非共享端的共同 peer（排除自身）
      const eliminations = collectCommonPeerEliminations(board, cell1Index, cell2Index, d)

      if (eliminations.length === 0) {
        continue
      }

      // 四個樓結構格：共享端兩格 + 非共享端兩格
      const sharedCell1Index = r1 * 9 + sharedCol
      const sharedCell2Index = r2 * 9 + sharedCol
      const related: CellIndex[] = [
        sharedCell1Index,
        sharedCell2Index,
        cell1Index,
        cell2Index,
      ]

      const explanation =
        `數字 ${d} 在 R${r1 + 1} 列只能填於 C${cols1[0] + 1}、C${cols1[1] + 1}，` +
        `在 R${r2 + 1} 列只能填於 C${cols2[0] + 1}、C${cols2[1] + 1}，` +
        `共享 C${sharedCol + 1} 欄。` +
        `非共享端 R${r1 + 1}C${c1 + 1} 與 R${r2 + 1}C${c2 + 1} 的共同 peer 可消去 ${d}。`

      return {
        technique: 'skyscraper',
        targets: eliminations.map((e) => e.index),
        related,
        action: 'eliminate',
        eliminations,
        explanation,
      }
    }
  }

  return null
}

/**
 * 找出數字 d 的 col-based Skyscraper（row-based 對偶）
 * 流程：
 * 1. 計算每欄 d 的候選列位置集合
 * 2. 收集恰好 2 個位置的欄
 * 3. 對欄兩兩配對；若列位置交集為 1（共享列）→ 構成 Skyscraper
 * 4. 兩個非共享端的共同 peer 中含 d 候選的格 → 消去
 */
function findColBasedSkyscraper(board: Board, d: number): TechniqueStep | null {
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

  if (colsWithTwo.length < 2) {
    return null
  }

  // 兩兩配對：找共享一列的兩欄
  for (let i = 0; i < colsWithTwo.length - 1; i++) {
    for (let j = i + 1; j < colsWithTwo.length; j++) {
      const c1 = colsWithTwo[i]
      const c2 = colsWithTwo[j]
      const rows1 = colToRows.get(c1) as number[]
      const rows2 = colToRows.get(c2) as number[]

      // 計算共享列（交集）
      const shared: number[] = rows1.filter((r) => rows2.includes(r))

      // 共享數 = 0 → 無交集；= 2 → X-Wing 場景；皆跳過
      if (shared.length !== 1) {
        continue
      }

      const sharedRow = shared[0]
      const r1 = rows1.find((r) => r !== sharedRow) as number
      const r2 = rows2.find((r) => r !== sharedRow) as number

      // 非共享列相同 → 退化為 X-Wing，跳過（保險）
      if (r1 === r2) {
        continue
      }

      const cell1Index = r1 * 9 + c1
      const cell2Index = r2 * 9 + c2

      // 計算兩個非共享端的共同 peer（排除自身）
      const eliminations = collectCommonPeerEliminations(board, cell1Index, cell2Index, d)

      if (eliminations.length === 0) {
        continue
      }

      // 四個樓結構格：共享端兩格 + 非共享端兩格
      const sharedCell1Index = sharedRow * 9 + c1
      const sharedCell2Index = sharedRow * 9 + c2
      const related: CellIndex[] = [
        sharedCell1Index,
        sharedCell2Index,
        cell1Index,
        cell2Index,
      ]

      const explanation =
        `數字 ${d} 在 C${c1 + 1} 欄只能填於 R${rows1[0] + 1}、R${rows1[1] + 1}，` +
        `在 C${c2 + 1} 欄只能填於 R${rows2[0] + 1}、R${rows2[1] + 1}，` +
        `共享 R${sharedRow + 1} 列。` +
        `非共享端 R${r1 + 1}C${c1 + 1} 與 R${r2 + 1}C${c2 + 1} 的共同 peer 可消去 ${d}。`

      return {
        technique: 'skyscraper',
        targets: eliminations.map((e) => e.index),
        related,
        action: 'eliminate',
        eliminations,
        explanation,
      }
    }
  }

  return null
}

/**
 * 計算兩格的「共同 peer」中含 d 候選的格清單
 * 共同 peer = peers(a) ∩ peers(b)，排除 a、b 自身
 */
function collectCommonPeerEliminations(
  board: Board,
  aIndex: CellIndex,
  bIndex: CellIndex,
  d: number,
): { index: CellIndex; values: number[] }[] {
  const peersA = getPeers(board, aIndex)
  const peersBSet = new Set(getPeers(board, bIndex).map((c) => c.index))

  const eliminations: { index: CellIndex; values: number[] }[] = []
  for (const cell of peersA) {
    if (cell.index === aIndex || cell.index === bIndex) {
      continue
    }
    if (!peersBSet.has(cell.index)) {
      continue
    }
    if (cell.value !== 0 && cell.candidates.has(d)) {
      // 已填值的格不算
      continue
    }
    if (cell.value === 0 && cell.candidates.has(d)) {
      eliminations.push({ index: cell.index, values: [d] })
    }
  }

  return eliminations
}
