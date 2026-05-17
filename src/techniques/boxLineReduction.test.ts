// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { createEmptyBoard } from '@/core/board'
import { recomputeAllCandidates } from '@/core/validator'
import { parseBoardString } from '@/core/serializer'
import { getScenariosFor } from '@/fixtures'
import { boxLineReductionSolver } from '@/techniques/boxLineReduction'
import { scenarioToBoard } from '@/techniques/testUtils'

describe('boxLineReductionSolver', () => {
  it('meta 正確', () => {
    expect(boxLineReductionSolver.meta.id).toBe('box-line-reduction')
    expect(boxLineReductionSolver.meta.name).toBe('區塊行列消除')
  })

  // 驗收 fixture 中所有 box-line-reduction 場景
  // 注意：某些場景同時存在 row→box 與 col→box 兩種觸發機會（solver 以 row 優先）
  // 只驗「找到合法的 box-line-reduction step，消除的值確實在候選中」
  it.each(getScenariosFor('box-line-reduction'))('$id: $description', (s) => {
    const board = scenarioToBoard(s)
    const step = boxLineReductionSolver.apply(board)

    expect(step).not.toBeNull()
    expect(step!.technique).toBe('box-line-reduction')
    expect(step!.action).toBe('eliminate')
    expect(step!.eliminations!.length).toBeGreaterThan(0)

    // 驗證消除的值確實在對應格的候選中
    for (const e of step!.eliminations!) {
      const cell = board.cells[e.index]
      expect(cell.value).toBe(0)
      for (const v of e.values) {
        expect(cell.candidates.has(v)).toBe(true)
      }
    }
  })

  it('row→box 方向：第 1 列候選 7 全在左上宮，消除宮內其他格的 7（fixture 01）', () => {
    const scenario = getScenariosFor('box-line-reduction').find((s) => s.id === 'box-line-reduction-01')!
    const board = scenarioToBoard(scenario)
    const step = boxLineReductionSolver.apply(board)

    expect(step).not.toBeNull()
    expect(step!.action).toBe('eliminate')
    // related 應包含 R1C1（index 0）、R1C2（index 1）
    expect(step!.related).toEqual(expect.arrayContaining([0, 1]))
    // targets 應為 R2C1（index 9）、R3C1（index 18）
    expect([...step!.targets].sort((a, b) => a - b)).toEqual([9, 18])
  })

  it('col→box 方向：第 1 欄候選 4 全在左上宮，消除宮內其他格的 4（fixture 02）', () => {
    // fixture-02 的場景中 row 方向也可觸發（R1 的 4 全在 box0，可消 R2C1=9, R2C2=10）
    // solver 以 row 優先，因此驗「找到合法 col→box 或 row→box 消除」
    const scenario = getScenariosFor('box-line-reduction').find((s) => s.id === 'box-line-reduction-02')!
    const board = scenarioToBoard(scenario)
    const step = boxLineReductionSolver.apply(board)

    expect(step).not.toBeNull()
    expect(step!.action).toBe('eliminate')
    // 確認消除的格確實在 box 0 中
    for (const e of step!.eliminations!) {
      expect(board.cells[e.index].box).toBe(0)
      expect(board.cells[e.index].candidates.has(4)).toBe(true)
    }
  })

  it('找不到 → null', () => {
    expect(boxLineReductionSolver.apply(createEmptyBoard())).toBeNull()
  })

  it('已解完盤面 → null', () => {
    const solution = '534678912672195348198342567859761423426853791713924856961537284287419635345286179'
    const board = recomputeAllCandidates(parseBoardString(solution))
    expect(boxLineReductionSolver.apply(board)).toBeNull()
  })
})
