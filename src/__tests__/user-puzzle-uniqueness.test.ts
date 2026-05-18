// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { parseBoardString } from '@/core/serializer'
import { recomputeAllCandidates } from '@/core/validator'
import { countSolutions } from '@/solver/backtrack'

/** 使用者回報卡關題目；用 backtrack 列舉證實此題為唯一解 */
const USER_PUZZLE =
  '100800000054030000030006750070004020500003070810060000000000000709300800000609004'

describe('user puzzle uniqueness', () => {
  it('剛好有一個解（backtrack 找到第二解即失敗）', () => {
    // 1. 解析 81 字串建 Board
    // 2. 重算候選（recompute 不影響解的數量，但保持與 production solveWithSteps 一致的前處理）
    // 3. countSolutions(board, 2) 找到 2 解就提早返回
    const board = recomputeAllCandidates(parseBoardString(USER_PUZZLE))
    const solutions = countSolutions(board, 2)
    expect(solutions).toBe(1)
  })
})
