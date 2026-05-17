import type { TechniqueSolver } from '@/types'

/**
 * Naked Single（裸單）
 * 當某空格的合法候選只剩一個時，必定填入該數字
 *
 * 注意：此 solver 假設傳入 board 的 candidates 已是合法狀態（由 orchestrator 預先 recompute）
 */
export const nakedSingleSolver: TechniqueSolver = {
  meta: {
    id: 'naked-single',
    name: '裸單',
    shortDesc: '某空格的合法候選只剩一個，直接填入該值',
  },

  apply(board) {
    for (const cell of board.cells) {
      if (cell.value !== 0) continue
      if (cell.candidates.size !== 1) continue

      const value = [...cell.candidates][0]
      return {
        technique: 'naked-single',
        targets: [cell.index],
        related: [],
        action: 'place',
        placements: [{ index: cell.index, value }],
        explanation: `R${cell.row + 1}C${cell.col + 1} 的合法候選只剩 ${value}，可直接填入（同行、同列、同宮已佔用其他數字）。`,
      }
    }

    return null
  },
}
