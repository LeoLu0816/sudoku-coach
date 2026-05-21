// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { fixturePuzzles } from '@/fixtures'
import { parseBoardString } from '@/core/serializer'
import { isSolved } from '@/core/validator'
import {
  getRegisteredTechniques,
  nextHintStep,
  nextHintStepWithFallback,
  solveWithSteps,
} from '@/solver/orchestrator'

describe('orchestrator', () => {
  it('已註冊技巧含 naked-single + hidden-single', () => {
    const ids = getRegisteredTechniques().map((t) => t.meta.id)
    expect(ids).toContain('naked-single')
    expect(ids).toContain('hidden-single')
  })

  it('簡單題用技巧解開（不 fallback）', () => {
    const easy = fixturePuzzles.find((p) => p.difficulty === 'easy')!
    const board = parseBoardString(easy.given)
    const result = solveWithSteps(board)
    expect(result.solved).toBe(true)
    expect(result.fallbackUsed).toBe(false)
    expect(isSolved(result.finalBoard)).toBe(true)
    expect(result.steps.length).toBeGreaterThan(0)
  })

  it('全部 fixture 題目最終都能解開（含 fallback 對中階以上）', () => {
    for (const p of fixturePuzzles) {
      const board = parseBoardString(p.given)
      const result = solveWithSteps(board)
      expect(result.solved).toBe(true)
      expect(isSolved(result.finalBoard)).toBe(true)
    }
  })

  it('已解完的盤 → steps=[], solved=true', () => {
    const solution = '534678912672195348198342567859761423426853791713924856961537284287419635345286179'
    const board = parseBoardString(solution)
    const result = solveWithSteps(board)
    expect(result.solved).toBe(true)
    expect(result.steps).toHaveLength(0)
  })

  it('nextHintStep 對未解盤回 step', () => {
    const easy = fixturePuzzles.find((p) => p.difficulty === 'easy')!
    const board = parseBoardString(easy.given)
    const step = nextHintStep(board)
    expect(step).not.toBeNull()
  })

  it('nextHintStep 對已解盤回 null', () => {
    const solution = '534678912672195348198342567859761423426853791713924856961537284287419635345286179'
    const board = parseBoardString(solution)
    expect(nextHintStep(board)).toBeNull()
  })

  it('nextHintStepWithFallback：技巧有解時與 nextHintStep 一致', () => {
    const easy = fixturePuzzles.find((p) => p.difficulty === 'easy')!
    const board = parseBoardString(easy.given)
    const solution = easy.solution.split('').map((c) => Number(c))
    const fallbackStep = nextHintStepWithFallback(board, solution)
    const techStep = nextHintStep(board)
    expect(fallbackStep).not.toBeNull()
    expect(techStep).not.toBeNull()
    expect(fallbackStep!.technique).toBe(techStep!.technique)
  })

  it('nextHintStepWithFallback：技巧全失效時回 backtrack place step（挑 index 最小空格）', () => {
    // 全空盤：所有空格都有 9 個候選 → 任何 single / pair / wing 類技巧都找不到 step → 走 fallback
    const easy = fixturePuzzles.find((p) => p.difficulty === 'easy')!
    const solution = easy.solution.split('').map((c) => Number(c))
    const board = parseBoardString('0'.repeat(81))
    expect(nextHintStep(board)).toBeNull()

    const step = nextHintStepWithFallback(board, solution)
    expect(step).not.toBeNull()
    expect(step!.technique).toBe('backtrack')
    expect(step!.action).toBe('place')
    expect(step!.placements).toHaveLength(1)
    expect(step!.placements![0].index).toBe(0)
    expect(step!.placements![0].value).toBe(solution[0])
  })

  it('nextHintStepWithFallback：已解盤回 null', () => {
    const solutionStr =
      '534678912672195348198342567859761423426853791713924856961537284287419635345286179'
    const solution = solutionStr.split('').map((c) => Number(c))
    const board = parseBoardString(solutionStr)
    expect(nextHintStepWithFallback(board, solution)).toBeNull()
  })
})
