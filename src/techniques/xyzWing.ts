import type { Board, Cell, CellIndex, TechniqueSolver, TechniqueStep } from '@/types'
import { getEmptyCells, getPeers } from '@/core/board'

/** 格的人類可讀座標（如 R1C3） */
function cellLabel(cell: Cell): string {
  return `R${cell.row + 1}C${cell.col + 1}`
}

/** 將候選 Set 排序為陣列 */
function sortedCandidates(cell: Cell): number[] {
  return [...cell.candidates].sort((a, b) => a - b)
}

/** 判斷 sub 是否為 sup 的子集 */
function isSubset(sub: Set<number>, sup: Set<number>): boolean {
  for (const v of sub) {
    if (!sup.has(v)) {
      return false
    }
  }
  return true
}

/** 兩個 Set 的交集（回傳新 Set） */
function intersect(a: Set<number>, b: Set<number>): Set<number> {
  const result = new Set<number>()
  for (const v of a) {
    if (b.has(v)) {
      result.add(v)
    }
  }
  return result
}

/**
 * 在當前盤面尋找一個 XYZ-Wing 步驟
 * 流程：
 * 1. 取所有候選為 3 個的空格作為 pivot 候選 {X,Y,Z}
 * 2. 對每個 pivot：在其 peer 中找候選大小為 2 且為 pivot 子集的 bivalue wings
 * 3. 對每對 (wing1, wing2)：驗證 wing1 ∩ wing2 = {Z}（單一元素），
 *    且 wing1 ∪ wing2 = pivot.candidates（即三者聯集恰為 {X,Y,Z}）
 * 4. 取 pivot、wing1、wing2 三者的共同 peer 中含 Z 的格作為消去目標
 * 5. 第一個有消去目標的結構即回傳
 */
function findXyzWing(board: Board): TechniqueStep | null {
  const emptyCells = getEmptyCells(board)
  // pivot：候選恰 3 個
  const pivotCandidates = emptyCells.filter((c) => c.candidates.size === 3)

  if (pivotCandidates.length === 0) {
    return null
  }

  for (const pivot of pivotCandidates) {
    const pivotPeers = getPeers(board, pivot.index)
    // wing 候選：peer 中候選為 2 且為 pivot 子集的格
    const wingCandidates = pivotPeers.filter(
      (c) =>
        c.value === 0 && c.candidates.size === 2 && isSubset(c.candidates, pivot.candidates),
    )

    if (wingCandidates.length < 2) {
      continue
    }

    // 兩兩配對
    for (let i = 0; i < wingCandidates.length - 1; i++) {
      for (let j = i + 1; j < wingCandidates.length; j++) {
        const w1 = wingCandidates[i]
        const w2 = wingCandidates[j]

        // wing1 與 wing2 交集必須恰一個元素（即 Z）
        const wingIntersect = intersect(w1.candidates, w2.candidates)
        if (wingIntersect.size !== 1) {
          continue
        }

        // wing1 ∪ wing2 必須等於 pivot.candidates（三者聯集為 {X,Y,Z}）
        const wingUnion = new Set<number>([...w1.candidates, ...w2.candidates])
        if (wingUnion.size !== 3) {
          continue
        }
        // 確認 union = pivot.candidates
        let unionEqualsPivot = true
        for (const v of wingUnion) {
          if (!pivot.candidates.has(v)) {
            unionEqualsPivot = false
            break
          }
        }
        if (!unionEqualsPivot) {
          continue
        }

        const z = [...wingIntersect][0]

        // 推導 X、Y（純為說明用）：
        // wing1 = {X, Z}（X = wing1 \ {Z}）；wing2 = {Y, Z}（Y = wing2 \ {Z}）
        const x = [...w1.candidates].find((v) => v !== z) as number
        const y = [...w2.candidates].find((v) => v !== z) as number

        // 找 pivot、wing1、wing2 三者的共同 peer
        const pivotPeerIndexSet = new Set<CellIndex>(pivotPeers.map((c) => c.index))
        const w1PeerIndexSet = new Set<CellIndex>(getPeers(board, w1.index).map((c) => c.index))
        const w2PeerIndexSet = new Set<CellIndex>(getPeers(board, w2.index).map((c) => c.index))
        const excludeIndexSet = new Set<CellIndex>([pivot.index, w1.index, w2.index])

        const eliminationCells: Cell[] = []
        for (const cell of emptyCells) {
          if (excludeIndexSet.has(cell.index)) {
            continue
          }
          if (!pivotPeerIndexSet.has(cell.index)) {
            continue
          }
          if (!w1PeerIndexSet.has(cell.index)) {
            continue
          }
          if (!w2PeerIndexSet.has(cell.index)) {
            continue
          }
          if (!cell.candidates.has(z)) {
            continue
          }
          eliminationCells.push(cell)
        }

        if (eliminationCells.length === 0) {
          continue
        }

        const eliminations = eliminationCells.map((c) => ({
          index: c.index,
          values: [z],
        }))
        const targets = eliminationCells.map((c) => c.index)
        const related = [pivot.index, w1.index, w2.index]

        const pivotCands = sortedCandidates(pivot)
        const [w1a, w1b] = sortedCandidates(w1)
        const [w2a, w2b] = sortedCandidates(w2)
        const elimLabels = eliminationCells.map(cellLabel).join('、')

        const explanation =
          `${cellLabel(pivot)} 候選為 {${pivotCands.join(',')}}（樞紐 {X,Y,Z}），` +
          `${cellLabel(w1)} 候選為 {${w1a},${w1b}}（wing1 {X,Z}，X=${x}），` +
          `${cellLabel(w2)} 候選為 {${w2a},${w2b}}（wing2 {Y,Z}，Y=${y}）。` +
          `無論樞紐填 ${x}、${y} 或 ${z}，樞紐、wing1、wing2 三者必有一格為 ${z}，` +
          `因此三者的共同 peer ${elimLabels} 可消去候選 ${z}。`

        return {
          technique: 'xyz-wing',
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
 * XYZ-Wing Solver
 * pivot 候選為 {X,Y,Z}（3 個），wing1 {X,Z} 與 wing2 {Y,Z} 皆為 pivot 的 peer 且 bivalue。
 * 無論 pivot 取何值，pivot/wing1/wing2 三者中必有一格為 Z；
 * 故三者的共同 peer 中含 Z 的候選可消去。
 */
export const xyzWingSolver: TechniqueSolver = {
  meta: {
    id: 'xyz-wing',
    name: 'XYZ-Wing',
    shortDesc: 'pivot {X,Y,Z} 與兩個 bivalue wings {X,Z}/{Y,Z}，三者共同 peer 含 Z 的候選可消去',
  },

  apply(board) {
    return findXyzWing(board)
  },
}
