// @vitest-environment node
import { describe, expect, it } from 'vitest'
import type { TechniqueId } from '@/types'
import { getRegisteredTechniques, solveWithSteps } from '@/solver/orchestrator'
import { recomputeAllCandidates } from '@/core/validator'
import { parseBoardString } from '@/core/serializer'

/**
 * orchestrator-tier1.test.ts
 *
 * 驗證 Phase 5 註冊：Tier 1（5 個）+ Tier 2（4 個）共 9 個高階技巧已加入 orchestrator，
 * 順序在中階之後、backtrack fallback 之前。
 *
 * 此題（user-puzzle）即使全 Tier 1 + 5B 註冊後仍 fallback，
 * 是「題目深度 > 已實作技巧覆蓋」的記號（outOfTechniqueScope=true）。
 */

const PUZZLE_NEEDING_TIER1 =
  '100800000054030000030006750070004020500003070810060000000000000709300800000609004'

describe('orchestrator: Tier 1 / 5B 註冊', () => {
  it('註冊 5 個 Tier 1 高階技巧（hidden-triple/naked-quad/x-wing/swordfish/xy-wing）', () => {
    const ids = getRegisteredTechniques().map((s) => s.meta.id)
    const tier1: TechniqueId[] = [
      'hidden-triple',
      'naked-quad',
      'x-wing',
      'swordfish',
      'xy-wing',
    ]
    for (const id of tier1) {
      expect(ids).toContain(id)
    }
  })

  it('註冊 4 個 5B 高階技巧（skyscraper / unique-rectangle / xyz-wing / simple-coloring）', () => {
    const ids = getRegisteredTechniques().map((s) => s.meta.id)
    const tier2: TechniqueId[] = [
      'skyscraper',
      'unique-rectangle',
      'xyz-wing',
      'simple-coloring',
    ]
    for (const id of tier2) {
      expect(ids).toContain(id)
    }
  })

  it('Tier 1 / 5B 順序在中階之後', () => {
    const ids = getRegisteredTechniques().map((s) => s.meta.id)
    const lastMidIdx = Math.max(
      ids.indexOf('naked-triple'),
      ids.indexOf('pointing-pair'),
      ids.indexOf('box-line-reduction'),
    )
    const firstTier1Idx = Math.min(
      ...['hidden-triple', 'naked-quad', 'x-wing', 'swordfish', 'xy-wing']
        .map((id) => ids.indexOf(id as TechniqueId))
        .filter((i) => i >= 0),
    )
    expect(firstTier1Idx).toBeGreaterThan(lastMidIdx)
  })

  it('user-puzzle 仍 fallback：標示 outOfTechniqueScope=true', () => {
    const board = recomputeAllCandidates(parseBoardString(PUZZLE_NEEDING_TIER1))
    const result = solveWithSteps(board)
    expect(result.solved).toBe(true)
    expect(result.fallbackUsed).toBe(true)
    expect(result.outOfTechniqueScope).toBe(true)
  })
})
