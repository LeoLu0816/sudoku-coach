// @vitest-environment jsdom
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { fixturePuzzles } from '@/fixtures'
import type { Puzzle } from '@/types'
import { usePlaybackStore } from '@/stores/playback'

/** 由 fixture 轉換為 Puzzle 物件 */
function fixtureToPuzzle(id: string): Puzzle {
  const f = fixturePuzzles.find((p) => p.id === id)!
  return {
    id: f.id,
    difficulty: f.difficulty,
    given: f.given.split('').map((c) => (c === '.' || c === '0' ? 0 : Number(c))) as Puzzle['given'],
    solution: f.solution.split('').map((c) => Number(c)) as Puzzle['solution'],
  }
}

describe('usePlaybackStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // ─── loadPuzzle ──────────────────────────────────────────────────────

  it('loadPuzzle(easy-01) → steps.length > 0', () => {
    const store = usePlaybackStore()
    store.loadPuzzle(fixtureToPuzzle('easy-01'))
    expect(store.steps.length).toBeGreaterThan(0)
  })

  it('loadPuzzle → intermediateBoards.length = steps.length + 1', () => {
    const store = usePlaybackStore()
    store.loadPuzzle(fixtureToPuzzle('easy-01'))
    expect(store.intermediateBoards.length).toBe(store.steps.length + 1)
  })

  it('loadPuzzle → 最後一個 intermediateBoard 的所有格皆已填入（= solution）', () => {
    const store = usePlaybackStore()
    const puzzle = fixtureToPuzzle('easy-01')
    store.loadPuzzle(puzzle)

    const lastBoard = store.intermediateBoards[store.intermediateBoards.length - 1]
    const values = lastBoard.cells.map((c) => c.value)

    // 比對 solution
    for (let i = 0; i < 81; i++) {
      expect(values[i]).toBe(puzzle.solution[i])
    }
  })

  it('loadPuzzle 後 currentStepIndex = -1', () => {
    const store = usePlaybackStore()
    store.loadPuzzle(fixtureToPuzzle('easy-01'))
    expect(store.currentStepIndex).toBe(-1)
  })

  it('loadPuzzle 後 autoPlaying = false', () => {
    const store = usePlaybackStore()
    store.loadPuzzle(fixtureToPuzzle('easy-01'))
    expect(store.autoPlaying).toBe(false)
  })

  // ─── next / prev ─────────────────────────────────────────────────────

  it('next() → currentStepIndex 增加', () => {
    const store = usePlaybackStore()
    store.loadPuzzle(fixtureToPuzzle('easy-01'))
    expect(store.currentStepIndex).toBe(-1)
    store.next()
    expect(store.currentStepIndex).toBe(0)
    store.next()
    expect(store.currentStepIndex).toBe(1)
  })

  it('next() 在末步後不 overflow', () => {
    const store = usePlaybackStore()
    store.loadPuzzle(fixtureToPuzzle('easy-01'))
    const lastIndex = store.steps.length - 1
    store.jumpTo(lastIndex)
    store.next()
    expect(store.currentStepIndex).toBe(lastIndex)
  })

  it('prev() → currentStepIndex 減少', () => {
    const store = usePlaybackStore()
    store.loadPuzzle(fixtureToPuzzle('easy-01'))
    store.next()
    store.next()
    expect(store.currentStepIndex).toBe(1)
    store.prev()
    expect(store.currentStepIndex).toBe(0)
  })

  it('prev() 在 -1 後不再往前', () => {
    const store = usePlaybackStore()
    store.loadPuzzle(fixtureToPuzzle('easy-01'))
    expect(store.currentStepIndex).toBe(-1)
    store.prev()
    expect(store.currentStepIndex).toBe(-1)
  })

  // ─── jumpTo ──────────────────────────────────────────────────────────

  it('jumpTo(N) 正確跳至目標', () => {
    const store = usePlaybackStore()
    store.loadPuzzle(fixtureToPuzzle('easy-01'))
    const mid = Math.floor(store.steps.length / 2)
    store.jumpTo(mid)
    expect(store.currentStepIndex).toBe(mid)
  })

  it('jumpTo 超過上界 → clamp 到 steps.length - 1', () => {
    const store = usePlaybackStore()
    store.loadPuzzle(fixtureToPuzzle('easy-01'))
    store.jumpTo(9999)
    expect(store.currentStepIndex).toBe(store.steps.length - 1)
  })

  it('jumpTo 低於下界 → clamp 到 -1', () => {
    const store = usePlaybackStore()
    store.loadPuzzle(fixtureToPuzzle('easy-01'))
    store.jumpTo(-999)
    expect(store.currentStepIndex).toBe(-1)
  })

  // ─── Getters ─────────────────────────────────────────────────────────

  it('currentBoard getter：初始盤面（index=-1）回 intermediateBoards[0]', () => {
    const store = usePlaybackStore()
    store.loadPuzzle(fixtureToPuzzle('easy-01'))
    expect(store.currentBoard).toBe(store.intermediateBoards[0])
  })

  it('currentBoard getter：next 後回 intermediateBoards[1]', () => {
    const store = usePlaybackStore()
    store.loadPuzzle(fixtureToPuzzle('easy-01'))
    store.next()
    expect(store.currentBoard).toBe(store.intermediateBoards[1])
  })

  it('currentStep getter：初始時為 null', () => {
    const store = usePlaybackStore()
    store.loadPuzzle(fixtureToPuzzle('easy-01'))
    expect(store.currentStep).toBeNull()
  })

  it('currentStep getter：next 後回 steps[0]', () => {
    const store = usePlaybackStore()
    store.loadPuzzle(fixtureToPuzzle('easy-01'))
    store.next()
    expect(store.currentStep).toBe(store.steps[0])
  })

  it('isAtStart getter：初始時為 true', () => {
    const store = usePlaybackStore()
    store.loadPuzzle(fixtureToPuzzle('easy-01'))
    expect(store.isAtStart).toBe(true)
  })

  it('isAtStart getter：next 後為 false', () => {
    const store = usePlaybackStore()
    store.loadPuzzle(fixtureToPuzzle('easy-01'))
    store.next()
    expect(store.isAtStart).toBe(false)
  })

  it('isAtEnd getter：末步時為 true', () => {
    const store = usePlaybackStore()
    store.loadPuzzle(fixtureToPuzzle('easy-01'))
    store.jumpTo(store.steps.length - 1)
    expect(store.isAtEnd).toBe(true)
  })

  it('isAtEnd getter：初始時為 false（有步驟）', () => {
    const store = usePlaybackStore()
    store.loadPuzzle(fixtureToPuzzle('easy-01'))
    expect(store.isAtEnd).toBe(false)
  })

  // ─── play / pause ────────────────────────────────────────────────────

  it('play() 開始後 autoPlaying = true', () => {
    const store = usePlaybackStore()
    store.loadPuzzle(fixtureToPuzzle('easy-01'))
    store.play()
    expect(store.autoPlaying).toBe(true)
    store.pause()
  })

  it('pause() 後 autoPlaying = false', () => {
    const store = usePlaybackStore()
    store.loadPuzzle(fixtureToPuzzle('easy-01'))
    store.play()
    store.pause()
    expect(store.autoPlaying).toBe(false)
  })

  it('play() 以 normal(1000ms) 速度推進 currentStepIndex', () => {
    const store = usePlaybackStore()
    store.loadPuzzle(fixtureToPuzzle('easy-01'))
    store.setSpeed('normal')
    store.play()
    expect(store.currentStepIndex).toBe(-1)

    // 推進 1 秒後應走 1 步
    vi.advanceTimersByTime(1000)
    expect(store.currentStepIndex).toBe(0)

    // 再 1 秒後走第 2 步
    vi.advanceTimersByTime(1000)
    expect(store.currentStepIndex).toBe(1)

    store.pause()
  })

  it('play() 以 fast(400ms) 速度推進 currentStepIndex', () => {
    const store = usePlaybackStore()
    store.loadPuzzle(fixtureToPuzzle('easy-01'))
    store.setSpeed('fast')
    store.play()

    vi.advanceTimersByTime(400)
    expect(store.currentStepIndex).toBe(0)

    vi.advanceTimersByTime(400)
    expect(store.currentStepIndex).toBe(1)

    store.pause()
  })

  it('play() 到末步時自動 pause', () => {
    const store = usePlaybackStore()
    store.loadPuzzle(fixtureToPuzzle('easy-01'))
    const totalSteps = store.steps.length

    store.setSpeed('fast')
    store.play()

    // 快轉足夠多的時間讓所有步驟跑完
    vi.advanceTimersByTime(400 * (totalSteps + 2))

    expect(store.currentStepIndex).toBe(totalSteps - 1)
    expect(store.autoPlaying).toBe(false)
  })

  // ─── setSpeed ────────────────────────────────────────────────────────

  it('setSpeed 改變 speed 值', () => {
    const store = usePlaybackStore()
    store.loadPuzzle(fixtureToPuzzle('easy-01'))
    store.setSpeed('slow')
    expect(store.speed).toBe('slow')
    store.setSpeed('fast')
    expect(store.speed).toBe('fast')
  })

  it('setSpeed 在播放中變更速度，新速度的 interval 生效', () => {
    const store = usePlaybackStore()
    store.loadPuzzle(fixtureToPuzzle('easy-01'))
    store.setSpeed('slow') // 2000ms
    store.play()

    // 推進 1000ms（slow interval 未觸發，步驟不應推進）
    vi.advanceTimersByTime(1000)
    expect(store.currentStepIndex).toBe(-1)

    // 切換到 fast(400ms)，重啟 interval
    store.setSpeed('fast')

    // 再推進 400ms，fast interval 觸發
    vi.advanceTimersByTime(400)
    expect(store.currentStepIndex).toBe(0)

    store.pause()
  })
})
