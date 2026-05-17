// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { fixturePuzzles } from '@/fixtures'
import { parseBoardString } from '@/core/serializer'
import { isSolved } from '@/core/validator'
import { getRegisteredTechniques, nextHintStep, solveWithSteps } from '@/solver/orchestrator'

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
})
