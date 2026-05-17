import type { Board } from '@/types'
import { setCandidates } from '@/core/board'
import { recomputeAllCandidates } from '@/core/validator'
import { parseBoardString } from '@/core/serializer'
import type { TechniqueScenario } from '@/fixtures'

/**
 * 將 TechniqueScenario 轉成可丟給 solver 的 Board：
 * - 若場景提供 candidates → 直接設定（代表前序技巧已縮減過的候選狀態）
 * - 若未提供 → 用 validator 重新計算
 */
export function scenarioToBoard(scenario: TechniqueScenario): Board {
  let board = parseBoardString(scenario.input.given)

  if (scenario.input.candidates) {
    for (let i = 0; i < 81; i++) {
      const candStr = scenario.input.candidates[i]
      if (candStr) {
        const candidates = new Set(candStr.split('').map(Number))
        board = setCandidates(board, i, candidates)
      }
    }
    return board
  }

  return recomputeAllCandidates(board)
}
