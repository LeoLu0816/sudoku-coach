import type { Cell, CellIndex, TechniqueSolver, TechniqueStep } from '@/types'
import { getEmptyCells, getPeers } from '@/core/board'

/** 格的人類可讀座標（如 R1C3） */
function cellLabel(cell: Cell): string {
  return `R${cell.row + 1}C${cell.col + 1}`
}

/** 將候選 Set 排序為陣列 */
function sortedCandidates(cell: Cell): number[] {
  return [...cell.candidates].sort((a, b) => a - b)
}

/**
 * 在 pivot 候選 {X,Y} 與 wing1 候選之間，找出唯一共同數字
 * 若候選恰有一個交集元素則回傳該值，否則回傳 null
 */
function singleIntersect(a: Set<number>, b: Set<number>): number | null {
  let found: number | null = null
  for (const v of a) {
    if (b.has(v)) {
      if (found !== null) {
        return null
      }
      found = v
    }
  }
  return found
}

/**
 * 在當前盤面尋找一個 XY-Wing 步驟
 * 流程：
 * 1. 取所有 bivalue（候選大小恰 2）空格
 * 2. 對每個 pivot：在其 peer 集合中找出 bivalue wings
 * 3. 對每對 (w1, w2)：驗證 pivot={X,Y}, w1={X,Z}, w2={Y,Z} 結構
 * 4. 取 w1 與 w2 共同 peer 中含 Z 的格作為消去目標
 * 5. 第一個有消去目標的結構即回傳
 */
function findXyWing(board: import('@/types').Board): TechniqueStep | null {
  const emptyCells = getEmptyCells(board)
  const bivalueCells = emptyCells.filter((c) => c.candidates.size === 2)

  if (bivalueCells.length < 3) {
    return null
  }

  // bivalue index 集合，方便 O(1) 判斷
  const bivalueIndexSet = new Set<CellIndex>(bivalueCells.map((c) => c.index))

  for (const pivot of bivalueCells) {
    // pivot 的 peer 中也是 bivalue 的格
    const pivotPeers = getPeers(board, pivot.index)
    const wingCandidates = pivotPeers.filter((c) => bivalueIndexSet.has(c.index))

    if (wingCandidates.length < 2) {
      continue
    }

    // 兩兩配對找 wing1, wing2
    for (let i = 0; i < wingCandidates.length - 1; i++) {
      for (let j = i + 1; j < wingCandidates.length; j++) {
        const w1 = wingCandidates[i]
        const w2 = wingCandidates[j]

        // pivot ∩ w1 必須恰一個數（X）
        const x = singleIntersect(pivot.candidates, w1.candidates)
        if (x === null) {
          continue
        }

        // pivot ∩ w2 必須恰一個數（Y）且 ≠ X
        const y = singleIntersect(pivot.candidates, w2.candidates)
        if (y === null || y === x) {
          continue
        }

        // w1 ∩ w2 必須恰一個數（Z）
        const z = singleIntersect(w1.candidates, w2.candidates)
        if (z === null || z === x || z === y) {
          continue
        }

        // 聯集大小必須為 3（理論上前述條件成立即滿足，這裡再保險檢查）
        const unionSet = new Set<number>([
          ...pivot.candidates,
          ...w1.candidates,
          ...w2.candidates,
        ])
        if (unionSet.size !== 3) {
          continue
        }

        // 找 w1 與 w2 共同 peer 中含 Z 的格（排除 pivot/w1/w2）
        const w1Peers = getPeers(board, w1.index)
        const w2PeerIndexSet = new Set<CellIndex>(
          getPeers(board, w2.index).map((c) => c.index),
        )
        const excludeIndexSet = new Set<CellIndex>([pivot.index, w1.index, w2.index])

        const eliminationCells = w1Peers.filter((c) => {
          if (excludeIndexSet.has(c.index)) {
            return false
          }
          if (!w2PeerIndexSet.has(c.index)) {
            return false
          }
          if (c.value !== 0) {
            return false
          }
          return c.candidates.has(z)
        })

        if (eliminationCells.length === 0) {
          continue
        }

        const eliminations = eliminationCells.map((c) => ({
          index: c.index,
          values: [z],
        }))
        const targets = eliminationCells.map((c) => c.index)
        const related = [pivot.index, w1.index, w2.index]

        const [px, py] = sortedCandidates(pivot)
        const [w1a, w1b] = sortedCandidates(w1)
        const [w2a, w2b] = sortedCandidates(w2)
        const elimLabels = eliminationCells.map(cellLabel).join('、')

        const explanation =
          `${cellLabel(pivot)} 候選為 {${px},${py}}（樞紐），` +
          `${cellLabel(w1)} 候選為 {${w1a},${w1b}}（wing1，與樞紐共用 ${x}），` +
          `${cellLabel(w2)} 候選為 {${w2a},${w2b}}（wing2，與樞紐共用 ${y}）。` +
          `無論樞紐填 ${x} 或 ${y}，wing1 與 wing2 之一必為 ${z}，` +
          `因此兩 wing 的共同 peer ${elimLabels} 可消去候選 ${z}。`

        return {
          technique: 'xy-wing',
          targets,
          related,
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
 * XY-Wing（XY 樞紐）Solver
 * 三個 bivalue cells（pivot {X,Y}、wing1 {X,Z}、wing2 {Y,Z}），
 * pivot 與兩 wing 互為 peer。無論 pivot 取何值，兩 wing 之一必為 Z，
 * 故 wing1 與 wing2 的共同 peer 中含 Z 的候選可消去。
 */
export const xyWingSolver: TechniqueSolver = {
  meta: {
    id: 'xy-wing',
    name: 'XY-Wing（XY 樞紐）',
    shortDesc: '三個 bivalue 格構成 XY 樞紐結構，可消去兩 wing 共同 peer 中的 Z 候選',
  },

  apply(board) {
    return findXyWing(board)
  },
}
