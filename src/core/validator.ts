import type { Board, CellIndex, Conflict } from '@/types'
import { getPeers, isComplete, setCandidates } from '@/core/board'

/** 取得單格的合法候選（排除同 peer 中已存在的值） */
export function getLegalCandidates(board: Board, index: CellIndex): Set<number> {
  const cell = board.cells[index]
  if (cell.value !== 0) {
    return new Set()
  }

  const used = new Set<number>()
  for (const peer of getPeers(board, index)) {
    if (peer.value !== 0) {
      used.add(peer.value)
    }
  }

  const result = new Set<number>()
  for (let v = 1; v <= 9; v++) {
    if (!used.has(v)) {
      result.add(v)
    }
  }
  return result
}

/** 重新計算所有空格的候選數，回傳新 Board（已填格 candidates 清空） */
export function recomputeAllCandidates(board: Board): Board {
  let next = board
  for (const cell of board.cells) {
    if (cell.value === 0) {
      next = setCandidates(next, cell.index, getLegalCandidates(board, cell.index))
    } else if (cell.candidates.size > 0) {
      next = setCandidates(next, cell.index, new Set())
    }
  }
  return next
}

/** 偵測所有衝突（同 row / col / box 中重複的值） */
export function findConflicts(board: Board): Conflict[] {
  const conflictMap = new Map<number, Set<number>>()

  const recordUnit = (cells: typeof board.cells) => {
    // 將同值的 cell index 分組
    const byValue = new Map<number, number[]>()
    for (const cell of cells) {
      if (cell.value === 0) continue
      const list = byValue.get(cell.value) ?? []
      list.push(cell.index)
      byValue.set(cell.value, list)
    }
    for (const indices of byValue.values()) {
      if (indices.length < 2) continue
      for (const i of indices) {
        const set = conflictMap.get(i) ?? new Set()
        for (const j of indices) {
          if (i !== j) set.add(j)
        }
        conflictMap.set(i, set)
      }
    }
  }

  for (let r = 0; r < 9; r++) {
    recordUnit(board.cells.filter((c) => c.row === r))
  }
  for (let c = 0; c < 9; c++) {
    recordUnit(board.cells.filter((cell) => cell.col === c))
  }
  for (let b = 0; b < 9; b++) {
    recordUnit(board.cells.filter((c) => c.box === b))
  }

  const result: Conflict[] = []
  for (const [index, conflictWith] of conflictMap.entries()) {
    result.push({ index, conflictWith: [...conflictWith].sort((a, b) => a - b) })
  }
  return result.sort((a, b) => a.index - b.index)
}

/** 是否有任何衝突 */
export function hasConflicts(board: Board): boolean {
  return findConflicts(board).length > 0
}

/** 盤面是否完成且合法（全填 + 無衝突） */
export function isSolved(board: Board): boolean {
  return isComplete(board) && !hasConflicts(board)
}

/** 在某格放某值是否合法（無衝突） */
export function isPlacementLegal(board: Board, index: CellIndex, value: number): boolean {
  if (value < 1 || value > 9) return false
  for (const peer of getPeers(board, index)) {
    if (peer.value === value) return false
  }
  return true
}
