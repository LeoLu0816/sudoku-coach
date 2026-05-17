// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { recomputeAllCandidates } from '@/core/validator'
import { parseBoardString } from '@/core/serializer'
import { getScenariosFor } from '@/fixtures'
import { nakedPairSolver } from '@/techniques/nakedPair'
import { scenarioToBoard } from '@/techniques/testUtils'

describe('nakedPairSolver', () => {
  it('meta 正確', () => {
    expect(nakedPairSolver.meta.id).toBe('naked-pair')
    expect(nakedPairSolver.meta.name).toBe('裸對')
  })

  // --- fixture 場景驗證 ---

  it.each(getScenariosFor('naked-pair'))('$id: 正確偵測裸對並產生 eliminations', (s) => {
    const board = scenarioToBoard(s)
    const step = nakedPairSolver.apply(board)

    // 必須找到 step
    expect(step).not.toBeNull()
    expect(step!.technique).toBe('naked-pair')
    expect(step!.action).toBe('eliminate')

    // targets 應包含 expected.targets（允許超集合）
    const expectedTargets = s.expected.targets
    for (const idx of expectedTargets) {
      expect(step!.targets).toContain(idx)
    }

    // eliminations 應包含 expected.eliminations（值集合比對，順序不限）
    const expectedElims = s.expected.eliminations ?? []
    for (const expectedElim of expectedElims) {
      const actualElim = step!.eliminations?.find((e) => e.index === expectedElim.index)
      expect(actualElim).toBeDefined()
      // 實際消去的值應包含預期的值（允許超集合）
      for (const v of expectedElim.values) {
        expect(actualElim!.values).toContain(v)
      }
    }
  })

  // --- 個別場景明確驗證 ---

  it('naked-pair-01: 列裸對（row），R1C8/R1C9 形成 {1,2}，消去 R1C1/R1C2 的 1 和 2', () => {
    const s = getScenariosFor('naked-pair').find((x) => x.id === 'naked-pair-01')!
    const board = scenarioToBoard(s)
    const step = nakedPairSolver.apply(board)

    expect(step).not.toBeNull()
    expect(step!.action).toBe('eliminate')

    // pair 兩格應在 related
    const r1c8 = 0 * 9 + 7 // R1C8 = index 7
    const r1c9 = 0 * 9 + 8 // R1C9 = index 8
    expect(step!.related).toContain(r1c8)
    expect(step!.related).toContain(r1c9)

    // 被消除的格應包含 R1C1 與 R1C2
    const r1c1 = 0 * 9 + 0 // index 0
    const r1c2 = 0 * 9 + 1 // index 1
    const elim1 = step!.eliminations?.find((e) => e.index === r1c1)
    const elim2 = step!.eliminations?.find((e) => e.index === r1c2)
    expect(elim1).toBeDefined()
    expect(elim2).toBeDefined()
    expect(elim1!.values).toContain(1)
    expect(elim1!.values).toContain(2)
    expect(elim2!.values).toContain(1)
    expect(elim2!.values).toContain(2)
  })

  it('naked-pair-02: 欄裸對（col），R8C1/R9C1 形成 {2,3}，消去 R1C1/R5C1 的 2 和 3', () => {
    const s = getScenariosFor('naked-pair').find((x) => x.id === 'naked-pair-02')!
    const board = scenarioToBoard(s)
    const step = nakedPairSolver.apply(board)

    expect(step).not.toBeNull()
    expect(step!.action).toBe('eliminate')

    // pair 兩格應在 related
    const r8c1 = 7 * 9 + 0 // index 63
    const r9c1 = 8 * 9 + 0 // index 72
    expect(step!.related).toContain(r8c1)
    expect(step!.related).toContain(r9c1)

    // 被消除的格應包含 R1C1 與 R5C1
    const r1c1 = 0 * 9 + 0 // index 0
    const r5c1 = 4 * 9 + 0 // index 36
    const elim1 = step!.eliminations?.find((e) => e.index === r1c1)
    const elim5 = step!.eliminations?.find((e) => e.index === r5c1)
    expect(elim1).toBeDefined()
    expect(elim5).toBeDefined()
    expect(elim1!.values).toContain(2)
    expect(elim1!.values).toContain(3)
    expect(elim5!.values).toContain(2)
    expect(elim5!.values).toContain(3)
  })

  it('naked-pair-03: 宮裸對（box），R2C2/R3C1 形成 {1,7}，消去宮內其他格的 1 或 7', () => {
    const s = getScenariosFor('naked-pair').find((x) => x.id === 'naked-pair-03')!
    const board = scenarioToBoard(s)
    const step = nakedPairSolver.apply(board)

    expect(step).not.toBeNull()
    expect(step!.action).toBe('eliminate')

    // pair 兩格應在 related
    const r2c2 = 1 * 9 + 1 // index 10
    const r3c1 = 2 * 9 + 0 // index 18
    expect(step!.related).toContain(r2c2)
    expect(step!.related).toContain(r3c1)

    // R1C1 應被消去 1 和 7
    const r1c1 = 0 * 9 + 0 // index 0
    const elimR1C1 = step!.eliminations?.find((e) => e.index === r1c1)
    expect(elimR1C1).toBeDefined()
    expect(elimR1C1!.values).toContain(1)
    expect(elimR1C1!.values).toContain(7)

    // R1C2 應被消去 7（候選 '347' 中有 7，但沒有 1）
    const r1c2 = 0 * 9 + 1 // index 1
    const elimR1C2 = step!.eliminations?.find((e) => e.index === r1c2)
    expect(elimR1C2).toBeDefined()
    expect(elimR1C2!.values).toContain(7)
  })

  // --- 邊界情況 ---

  it('沒有裸對的盤面 → null', () => {
    // 只剩一格的盤面（已近乎解完），不存在裸對
    const solution = '534678912672195348198342567859761423426853791713924856961537284287419635345286179'
    const board = recomputeAllCandidates(parseBoardString(solution))
    expect(nakedPairSolver.apply(board)).toBeNull()
  })

  it('空盤面（無候選資訊）→ null', () => {
    // 空盤沒有設定候選，所有格候選為空，無法偵測裸對
    const emptyStr = '.'.repeat(81)
    const board = parseBoardString(emptyStr)
    expect(nakedPairSolver.apply(board)).toBeNull()
  })
})
