// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { parseBoardString } from '@/core/serializer'
import { recomputeAllCandidates } from '@/core/validator'
import { applyStepAndUpdate, solveWithSteps } from '@/solver/orchestrator'
import { nakedPairSolver } from '@/techniques/nakedPair'
import { setCellValue, setCandidates } from '@/core/board'

/**
 * 迴歸測試：觀摩模式裸對卡住 bug
 * Root cause：solveWithSteps / playback.loadPuzzle 在 applyStep 之後呼叫
 * recomputeAllCandidates 重算所有空格候選 → eliminate 步驟消去的候選被抹回
 * → 同一個裸對下輪再次成立 → 迴圈跑滿 maxIterations。
 *
 * 修復：改用 applyStepAndUpdate（增量更新），eliminate 步驟不再被推翻。
 */
describe('observation mode naked-pair regression', () => {
  it('applyStepAndUpdate 對 eliminate 步驟不會還原已消去的候選', () => {
    // 構造 R1：C1..C5 填 1..5，C6/C7 候選 {6,7,8,9}，C8/C9 候選 {8,9}（裸對）
    const allEmpty = '.................................................................................'
    let b = parseBoardString(allEmpty)
    b = setCellValue(b, 0, 1)
    b = setCellValue(b, 1, 2)
    b = setCellValue(b, 2, 3)
    b = setCellValue(b, 3, 4)
    b = setCellValue(b, 4, 5)
    b = recomputeAllCandidates(b)
    b = setCandidates(b, 7, new Set([8, 9]))
    b = setCandidates(b, 8, new Set([8, 9]))

    const step = nakedPairSolver.apply(b)
    expect(step).not.toBeNull()
    expect(step!.action).toBe('eliminate')

    const after = applyStepAndUpdate(b, step!)
    // C6/C7 的 {8,9} 應該被消去，剩 {6,7}
    expect([...after.cells[5].candidates].sort()).toEqual([6, 7])
    expect([...after.cells[6].candidates].sort()).toEqual([6, 7])
    // 裸對本身 C8/C9 候選保持 {8,9}
    expect([...after.cells[7].candidates].sort()).toEqual([8, 9])
    expect([...after.cells[8].candidates].sort()).toEqual([8, 9])
  })

  it('solveWithSteps 對需要裸對的盤面不會無限迴圈（不會有重複裸對步驟）', () => {
    // 構造一個必須用 naked-pair 才能推進的局部盤面：
    // 將「同一個裸對連續被觸發」的情境放進 solveWithSteps，
    // 用過去 bug 行為會回報 1000 個重複 naked-pair；修復後應只報 1 次或 0 次（因為其他技巧也許能接手）。
    const allEmpty = '.................................................................................'
    let b = parseBoardString(allEmpty)
    b = setCellValue(b, 0, 1)
    b = setCellValue(b, 1, 2)
    b = setCellValue(b, 2, 3)
    b = setCellValue(b, 3, 4)
    b = setCellValue(b, 4, 5)
    b = recomputeAllCandidates(b)
    b = setCandidates(b, 7, new Set([8, 9]))
    b = setCandidates(b, 8, new Set([8, 9]))

    const result = solveWithSteps(b)
    const nakedPairCount = result.steps.filter((s) => s.technique === 'naked-pair').length
    // 修復前會 >> 1（甚至 1000）；修復後最多一次
    expect(nakedPairCount).toBeLessThanOrEqual(1)
  })
})
