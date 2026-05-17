/**
 * P3 整合測試：觀摩模式完整流程
 * 驗證 ObserveView + PlaybackPanel + playbackStore 整合，
 * 完整跑完一個簡單題的步驟序列，最後盤面 = solution
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter, type Router } from 'vue-router'
import { nextTick } from 'vue'

import ObserveView from '@/views/ObserveView.vue'
import HomeView from '@/views/HomeView.vue'
import { useGameStore } from '@/stores/game'
import { usePlaybackStore } from '@/stores/playback'
import { fixturePuzzles } from '@/fixtures'
import type { Puzzle } from '@/types'

/** 取 fixture → Puzzle 物件 */
function fixturePuzzle(id: string): Puzzle {
  const f = fixturePuzzles.find((p) => p.id === id)!
  return {
    id: f.id,
    difficulty: f.difficulty,
    given: f.given.split('').map((c) => (c === '.' || c === '0' ? 0 : Number(c))) as Puzzle['given'],
    solution: f.solution.split('').map((c) => Number(c)) as Puzzle['solution'],
  }
}

/** 建立帶 router 的 ObserveView wrapper（pinia 已由 caller 設定） */
async function mountObserveView(): Promise<{ wrapper: VueWrapper; router: Router }> {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component: HomeView },
      { path: '/observe', name: 'observe', component: ObserveView },
    ],
  })
  router.push('/observe')
  await router.isReady()
  const wrapper = mount(ObserveView, {
    global: { plugins: [router] },
  })
  await nextTick()
  return { wrapper, router }
}

describe('P3 整合：observe flow', () => {
  let wrapper: VueWrapper | null = null

  beforeEach(() => {
    setActivePinia(createPinia())
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
      wrapper = null
    }
    vi.useRealTimers()
  })

  it('gameStore 已有 puzzle → mount 時自動載入 playback', async () => {
    const gameStore = useGameStore()
    gameStore.loadPuzzle(fixturePuzzle('easy-01'))
    const mounted = await mountObserveView()
    wrapper = mounted.wrapper
    await nextTick()

    const playbackStore = usePlaybackStore()
    expect(playbackStore.puzzle).not.toBeNull()
    expect(playbackStore.steps.length).toBeGreaterThan(0)
    expect(wrapper.find('[data-testid="observe-layout"]').exists()).toBe(true)
  })

  it('沒 puzzle → 顯示難度選擇 modal', async () => {
    const mounted = await mountObserveView()
    wrapper = mounted.wrapper
    expect(wrapper.find('[data-testid="difficulty-modal"]').exists()).toBe(true)
  })

  it('next 按鈕 → 步驟前進、盤面改變', async () => {
    const gameStore = useGameStore()
    gameStore.loadPuzzle(fixturePuzzle('easy-01'))
    const mounted = await mountObserveView()
    wrapper = mounted.wrapper
    await nextTick()

    const playbackStore = usePlaybackStore()
    const beforeIdx = playbackStore.currentStepIndex
    await wrapper.find('[data-testid="btn-next"]').trigger('click')
    await nextTick()
    expect(playbackStore.currentStepIndex).toBe(beforeIdx + 1)
  })

  it('點步驟列表 → jumpTo 對應步驟', async () => {
    const gameStore = useGameStore()
    gameStore.loadPuzzle(fixturePuzzle('easy-01'))
    const mounted = await mountObserveView()
    wrapper = mounted.wrapper
    await nextTick()

    await wrapper.find('[data-testid="step-3"]').trigger('click')
    await nextTick()

    const playbackStore = usePlaybackStore()
    expect(playbackStore.currentStepIndex).toBe(3)
  })

  it('完整觀摩到末步 → 最後盤面與 solution 相符', async () => {
    const gameStore = useGameStore()
    const puzzle = fixturePuzzle('easy-01')
    gameStore.loadPuzzle(puzzle)
    const mounted = await mountObserveView()
    wrapper = mounted.wrapper
    await nextTick()

    const playbackStore = usePlaybackStore()
    playbackStore.jumpTo(playbackStore.steps.length - 1)
    await nextTick()

    const finalBoard = playbackStore.currentBoard!
    for (let i = 0; i < 81; i++) {
      expect(finalBoard.cells[i].value).toBe(puzzle.solution[i])
    }
  })

  it('自動播放：fake timers 推進 → 步驟逐步前進；到末步自動暫停', async () => {
    vi.useFakeTimers()
    const gameStore = useGameStore()
    gameStore.loadPuzzle(fixturePuzzle('easy-01'))
    const mounted = await mountObserveView()
    wrapper = mounted.wrapper
    await nextTick()

    const playbackStore = usePlaybackStore()
    playbackStore.setSpeed('fast') // 400ms
    playbackStore.jumpTo(playbackStore.steps.length - 3) // 倒數第 3 步前
    playbackStore.play()
    expect(playbackStore.autoPlaying).toBe(true)

    // 推進足夠時間到末步
    await vi.advanceTimersByTimeAsync(400 * 5)

    expect(playbackStore.currentStepIndex).toBe(playbackStore.steps.length - 1)
    expect(playbackStore.autoPlaying).toBe(false)
  })
})
