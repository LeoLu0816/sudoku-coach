// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { createEmptyBoard } from '@/core/board'
import { recomputeAllCandidates } from '@/core/validator'
import { parseBoardString } from '@/core/serializer'
import { getScenariosFor } from '@/fixtures'
import { pointingPairSolver } from '@/techniques/pointingPair'
import { scenarioToBoard } from '@/techniques/testUtils'

describe('pointingPairSolver', () => {
  it('meta 正確', () => {
    expect(pointingPairSolver.meta.id).toBe('pointing-pair')
    expect(pointingPairSolver.meta.name).toBe('指向對')
  })

  // 注意：同一盤面可能同時存在多個合法的 pointing pair，solver 回傳其中任一皆合法
  // 因此只驗證「step 是合法的 pointing pair」，不強制比對特定 target
  it.each(getScenariosFor('pointing-pair'))('$id: 產生合法 pointing pair step', (s) => {
    const board = scenarioToBoard(s)
    const step = pointingPairSolver.apply(board)

    expect(step).not.toBeNull()
    expect(step!.technique).toBe('pointing-pair')
    expect(step!.action).toBe('eliminate')
    expect(step!.eliminations).toBeDefined()
    expect(step!.eliminations!.length).toBeGreaterThan(0)
    expect(step!.targets.length).toBeGreaterThan(0)
    expect(step!.related.length).toBeGreaterThanOrEqual(2)

    // 驗證每個 eliminations 的 index 確實在那格的候選中含指定值
    for (const elim of step!.eliminations!) {
      const cell = board.cells[elim.index]
      expect(cell.value).toBe(0)
      for (const val of elim.values) {
        expect(cell.candidates.has(val)).toBe(true)
      }
    }
  })

  it('pointing-pair-01（row 方向）：宮外同列 7 被消除', () => {
    const s = getScenariosFor('pointing-pair').find((x) => x.id === 'pointing-pair-01')!
    const board = scenarioToBoard(s)
    const step = pointingPairSolver.apply(board)

    expect(step).not.toBeNull()
    expect(step!.action).toBe('eliminate')
    // 被消除格應在宮外同列
    for (const e of step!.eliminations!) {
      expect(e.values).toContain(7)
    }
  })

  it('pointing-pair-02（col 方向）：宮外同欄 4 被消除', () => {
    const s = getScenariosFor('pointing-pair').find((x) => x.id === 'pointing-pair-02')!
    const board = scenarioToBoard(s)
    const step = pointingPairSolver.apply(board)

    expect(step).not.toBeNull()
    expect(step!.action).toBe('eliminate')
    for (const e of step!.eliminations!) {
      expect(e.values).toContain(4)
    }
  })

  it('找不到 pointing pair → null', () => {
    // 空盤無候選資訊，應回 null
    expect(pointingPairSolver.apply(createEmptyBoard())).toBeNull()
  })

  it('已解完盤面 → null', () => {
    const solution = '534678912672195348198342567859761423426853791713924856961537284287419635345286179'
    const board = recomputeAllCandidates(parseBoardString(solution))
    expect(pointingPairSolver.apply(board)).toBeNull()
  })
})
