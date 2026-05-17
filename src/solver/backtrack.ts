import type { Board, CellValue } from '@/types'
import { createBoardFromGiven } from '@/core/board'

/**
 * 將 Board 轉成 81 個數字的扁平陣列（給內部 backtrack 使用，效能優於物件操作）
 */
function boardToGrid(board: Board): number[] {
  return board.cells.map((c) => c.value)
}

/**
 * 預先建立每格的 peers 索引清單（同 row + 同 col + 同 box，共 20 格）
 */
const PEER_INDICES: number[][] = Array.from({ length: 81 }, (_, index) => {
  const row = Math.floor(index / 9)
  const col = index % 9
  const peers = new Set<number>()
  for (let c = 0; c < 9; c++) peers.add(row * 9 + c)
  for (let r = 0; r < 9; r++) peers.add(r * 9 + col)
  const boxRow = Math.floor(row / 3) * 3
  const boxCol = Math.floor(col / 3) * 3
  for (let r = boxRow; r < boxRow + 3; r++) {
    for (let c = boxCol; c < boxCol + 3; c++) peers.add(r * 9 + c)
  }
  peers.delete(index)
  return [...peers]
})

/** 取得 index 格目前合法候選數 */
function legalCandidates(grid: number[], index: number): number[] {
  const used = new Set<number>()
  for (const p of PEER_INDICES[index]) {
    if (grid[p] !== 0) used.add(grid[p])
  }
  const result: number[] = []
  for (let v = 1; v <= 9; v++) {
    if (!used.has(v)) result.push(v)
  }
  return result
}

/** 檢查已填入的格之間是否有衝突；有則回 true */
function hasInitialConflicts(grid: number[]): boolean {
  for (let i = 0; i < 81; i++) {
    if (grid[i] === 0) continue
    for (const p of PEER_INDICES[i]) {
      if (grid[p] === grid[i]) return true
    }
  }
  return false
}

/**
 * DFS + MRV 啟發式
 * mode='first'：找到第一個解就停
 * mode='count'：計數解，達 limit 即停
 */
function search(
  grid: number[],
  mode: 'first' | 'count',
  limit: number,
  state: { solutionsFound: number; firstSolution: number[] | null },
): boolean {
  let targetIndex = -1
  let targetCandidates: number[] | null = null

  for (let i = 0; i < 81; i++) {
    if (grid[i] !== 0) continue
    const c = legalCandidates(grid, i)
    if (c.length === 0) return false
    if (targetCandidates === null || c.length < targetCandidates.length) {
      targetIndex = i
      targetCandidates = c
      if (c.length === 1) break
    }
  }

  if (targetIndex === -1) {
    state.solutionsFound += 1
    if (mode === 'first' && state.firstSolution === null) {
      state.firstSolution = grid.slice()
      return true
    }
    return state.solutionsFound >= limit
  }

  for (const v of targetCandidates ?? []) {
    grid[targetIndex] = v
    const stop = search(grid, mode, limit, state)
    if (stop) {
      if (mode === 'first') return true
      if (state.solutionsFound >= limit) return true
    }
    grid[targetIndex] = 0
  }
  return false
}

/**
 * 解一個盤面，回傳一個解；無解或輸入本身已衝突回 null
 */
export function solve(board: Board): Board | null {
  const grid = boardToGrid(board)
  if (hasInitialConflicts(grid)) return null

  const state = { solutionsFound: 0, firstSolution: null as number[] | null }
  search(grid, 'first', 1, state)
  if (state.firstSolution === null) return null
  return createBoardFromGiven(state.firstSolution as CellValue[])
}

/**
 * 計數解的數量（最多計到 limit）
 * 輸入本身已衝突 → 0
 */
export function countSolutions(board: Board, limit = 2): number {
  const grid = boardToGrid(board)
  if (hasInitialConflicts(grid)) return 0

  const state = { solutionsFound: 0, firstSolution: null as number[] | null }
  search(grid, 'count', limit, state)
  return state.solutionsFound
}
