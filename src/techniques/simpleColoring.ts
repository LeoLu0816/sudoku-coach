import type { Board, Cell, CellIndex, TechniqueSolver, TechniqueStep } from '@/types'
import { getBoxCells, getColCells, getPeers, getRowCells } from '@/core/board'

/**
 * Simple Coloring（單數字著色 / Single's Chains）
 *
 * 對某數字 d：
 * 1. 收集所有 strong link：某 unit（row/col/box）中 d 候選恰好 2 個位置 → 這兩格為 strong link
 * 2. 將每個 strong link 視為無向邊，建鄰接表；BFS 著色，每條邊兩端強制不同色（A / B 交替）
 * 3. 每個連通分量獨立檢查兩規則：
 *    - 規則 1（同色衝突）：同分量內若同色兩格落在同 unit（row/col/box）→ 該色全部為假，可消去該色所有 d 候選
 *    - 規則 2（看到兩色）：分量外部某含 d 候選的格，若同時 peer A 色與 B 色 → 該格 d 可消去
 *
 * 兩規則任一命中即回傳一個步驟（規則 1 優先；同分量先查 1 再查 2；多分量循環）。
 *
 * 注意：此 solver 假設 board.candidates 已是合法狀態（由 orchestrator 預先 recompute）
 */
export const simpleColoringSolver: TechniqueSolver = {
  meta: {
    id: 'simple-coloring',
    name: 'Simple Coloring（單數字著色）',
    shortDesc: '某數字的 strong link 鏈著色後，同色衝突或同見兩色的格可消去候選',
  },

  apply(board) {
    // 依序掃 1..9，找到一個步驟即回傳
    for (let d = 1; d <= 9; d++) {
      const step = findColoringStep(board, d)
      if (step) { return step }
    }

    return null
  },
}

/** 顏色標記 */
type Color = 'A' | 'B'

/**
 * 對某數字 d 找出一個可套用的著色步驟
 * 流程：
 * 1. 收集所有 strong link 對
 * 2. 建鄰接表
 * 3. 對每個未訪問節點 BFS 著色，每個連通分量獨立檢查兩規則
 */
function findColoringStep(board: Board, d: number): TechniqueStep | null {
  // 1. 收集 strong links（每對為排序後的 [a, b]，並記錄產生此 link 的 unit 描述）
  const links = collectStrongLinks(board, d)
  if (links.length === 0) { return null }

  // 2. 建鄰接表
  const adjacency: Map<CellIndex, Set<CellIndex>> = new Map()
  for (const [a, b] of links) {
    if (!adjacency.has(a)) { adjacency.set(a, new Set()) }
    if (!adjacency.has(b)) { adjacency.set(b, new Set()) }
    adjacency.get(a)!.add(b)
    adjacency.get(b)!.add(a)
  }

  // 3. BFS 著色 + 規則檢查
  const visited: Set<CellIndex> = new Set()
  const allNodes = [...adjacency.keys()].sort((a, b) => a - b)

  for (const start of allNodes) {
    if (visited.has(start)) { continue }

    // 對 start 所在連通分量 BFS 著色
    const coloring: Map<CellIndex, Color> = new Map()
    coloring.set(start, 'A')
    const queue: CellIndex[] = [start]

    while (queue.length > 0) {
      const cur = queue.shift()!
      const curColor = coloring.get(cur)!
      const nextColor: Color = curColor === 'A' ? 'B' : 'A'

      for (const nb of adjacency.get(cur) ?? []) {
        if (!coloring.has(nb)) {
          coloring.set(nb, nextColor)
          queue.push(nb)
        }
      }
    }

    for (const idx of coloring.keys()) {
      visited.add(idx)
    }

    // 規則 1：同色衝突
    const rule1 = checkSameColorConflict(board, d, coloring)
    if (rule1) { return rule1 }

    // 規則 2：看到兩色
    const rule2 = checkSeeBothColors(board, d, coloring)
    if (rule2) { return rule2 }
  }

  return null
}

/**
 * 收集數字 d 的所有 strong link 對（無向，indices 排序）
 * 流程：對 row / col / box 各掃 9 個 unit，找 d 候選位置恰 2 的 unit 取出其 pair
 */
function collectStrongLinks(board: Board, d: number): [CellIndex, CellIndex][] {
  const result: [CellIndex, CellIndex][] = []
  const seen: Set<string> = new Set()

  // 內部函式：將 unit 中 d 的候選格收集；若恰 2 個則加入 result
  const collectFromUnit = (cells: Cell[]) => {
    const candidateCells: Cell[] = []
    for (const cell of cells) {
      if (cell.value === 0 && cell.candidates.has(d)) {
        candidateCells.push(cell)
      }
    }
    if (candidateCells.length !== 2) { return }

    const a = candidateCells[0].index
    const b = candidateCells[1].index
    const key = a < b ? `${a}-${b}` : `${b}-${a}`
    if (seen.has(key)) { return }
    seen.add(key)
    result.push(a < b ? [a, b] : [b, a])
  }

  for (let i = 0; i < 9; i++) {
    collectFromUnit(getRowCells(board, i))
    collectFromUnit(getColCells(board, i))
    collectFromUnit(getBoxCells(board, i))
  }

  return result
}

/**
 * 規則 1：同色衝突檢查
 * 若同色兩格落在同 unit（row/col/box）→ 該色為假，消去該色所有 d 候選
 */
function checkSameColorConflict(
  board: Board,
  d: number,
  coloring: Map<CellIndex, Color>,
): TechniqueStep | null {
  const colorA: CellIndex[] = []
  const colorB: CellIndex[] = []
  for (const [idx, c] of coloring) {
    if (c === 'A') { colorA.push(idx) }
    else { colorB.push(idx) }
  }

  // 對 A、B 兩色分別檢查
  const colors: { color: Color; group: CellIndex[]; other: CellIndex[] }[] = [
    { color: 'A', group: colorA, other: colorB },
    { color: 'B', group: colorB, other: colorA },
  ]

  for (const { color, group, other } of colors) {
    const conflictPair = findSameUnitPair(board, group)
    if (!conflictPair) { continue }

    const [c1, c2] = conflictPair
    const eliminations = group.map((idx) => ({ index: idx, values: [d] }))

    // related 為對色（顯示「真色」），targets 為被消去的同色
    const sortedTargets = [...group].sort((a, b) => a - b)
    const sortedOther = [...other].sort((a, b) => a - b)

    const explanation =
      `數字 ${d} 在鏈中同色（${color}）兩格 ${formatRC(c1)} 與 ${formatRC(c2)} 落在同一 ${describeSameUnit(board, c1, c2)}，` +
      `若兩格皆為 ${d} 會矛盾。故色 ${color} 全部為假，可消去該色所有 ${d} 候選。`

    return {
      technique: 'simple-coloring',
      targets: sortedTargets,
      related: sortedOther,
      action: 'eliminate',
      eliminations,
      explanation,
    }
  }

  return null
}

/**
 * 規則 2：看到兩色
 * 分量外部某含 d 候選的格，若同時 peer A 與 B → 該格 d 可消去
 */
function checkSeeBothColors(
  board: Board,
  d: number,
  coloring: Map<CellIndex, Color>,
): TechniqueStep | null {
  const colorA: CellIndex[] = []
  const colorB: CellIndex[] = []
  for (const [idx, c] of coloring) {
    if (c === 'A') { colorA.push(idx) }
    else { colorB.push(idx) }
  }
  if (colorA.length === 0 || colorB.length === 0) { return null }

  const eliminations: { index: CellIndex; values: number[] }[] = []
  const witnessPairs: { target: CellIndex; aSeen: CellIndex; bSeen: CellIndex }[] = []

  for (const cell of board.cells) {
    if (cell.value !== 0) { continue }
    if (!cell.candidates.has(d)) { continue }
    if (coloring.has(cell.index)) { continue }

    // 取得 peer indices set
    const peerIndices = new Set(getPeers(board, cell.index).map((p) => p.index))

    let seenA: CellIndex | null = null
    let seenB: CellIndex | null = null
    for (const aIdx of colorA) {
      if (peerIndices.has(aIdx)) { seenA = aIdx; break }
    }
    for (const bIdx of colorB) {
      if (peerIndices.has(bIdx)) { seenB = bIdx; break }
    }

    if (seenA !== null && seenB !== null) {
      eliminations.push({ index: cell.index, values: [d] })
      witnessPairs.push({ target: cell.index, aSeen: seenA, bSeen: seenB })
    }
  }

  if (eliminations.length === 0) { return null }

  const sortedColorA = [...colorA].sort((a, b) => a - b)
  const sortedColorB = [...colorB].sort((a, b) => a - b)

  // 取第一筆作為說明範例
  const sample = witnessPairs[0]
  const explanation =
    `數字 ${d} 鏈中 ${formatRC(sample.aSeen)}(A) 與 ${formatRC(sample.bSeen)}(B) 雙色關係。` +
    `${formatRC(sample.target)} 同時為兩色 peer，故 ${d} 不可填。`

  return {
    technique: 'simple-coloring',
    targets: eliminations.map((e) => e.index),
    related: [...sortedColorA, ...sortedColorB],
    action: 'eliminate',
    eliminations,
    explanation,
  }
}

/**
 * 在 indices 群組中找出第一對「同 unit」的格（同 row / 同 col / 同 box）
 */
function findSameUnitPair(board: Board, indices: CellIndex[]): [CellIndex, CellIndex] | null {
  for (let i = 0; i < indices.length - 1; i++) {
    for (let j = i + 1; j < indices.length; j++) {
      const a = board.cells[indices[i]]
      const b = board.cells[indices[j]]
      if (a.row === b.row || a.col === b.col || a.box === b.box) {
        return [a.index, b.index]
      }
    }
  }
  return null
}

/** 將 index 格式化為 R?C?（1-based） */
function formatRC(index: CellIndex): string {
  const r = Math.floor(index / 9) + 1
  const c = (index % 9) + 1
  return `R${r}C${c}`
}

/** 描述兩格落在哪個共用 unit（row/col/box）— 規則 1 用 */
function describeSameUnit(board: Board, a: CellIndex, b: CellIndex): string {
  const ca = board.cells[a]
  const cb = board.cells[b]
  if (ca.row === cb.row) { return `列 R${ca.row + 1}` }
  if (ca.col === cb.col) { return `欄 C${ca.col + 1}` }
  return `宮 B${ca.box + 1}`
}
