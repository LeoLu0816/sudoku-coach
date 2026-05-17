/**
 * P2 整合測試：完整玩一局簡單題到完成
 * 驗證 PlayView 與所有 UI 元件（SudokuBoard / NumberPad / ControlPanel / HintOverlay）
 * 與 gameStore 的整合是否正確
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter, type Router } from 'vue-router'
import { nextTick } from 'vue'

import PlayView from '@/views/PlayView.vue'
import HomeView from '@/views/HomeView.vue'
import { useGameStore } from '@/stores/game'
import { fixturePuzzles } from '@/fixtures'
import type { Puzzle } from '@/types'

/** 取 fixture easy-01 → Puzzle 物件（給 store.loadPuzzle 用，跳過生成器以求穩定） */
function easyPuzzle(): Puzzle {
  const f = fixturePuzzles.find((p) => p.id === 'easy-01')!
  return {
    id: f.id,
    difficulty: f.difficulty,
    given: f.given.split('').map((c) => (c === '.' || c === '0' ? 0 : Number(c))) as Puzzle['given'],
    solution: f.solution.split('').map((c) => Number(c)) as Puzzle['solution'],
  }
}

/** 建立帶 router 的 PlayView wrapper */
async function mountPlayView(): Promise<{ wrapper: VueWrapper; router: Router }> {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component: HomeView },
      { path: '/play', name: 'play', component: PlayView },
    ],
  })
  router.push('/play')
  await router.isReady()
  const wrapper = mount(PlayView, {
    global: {
      plugins: [router],
    },
  })
  await nextTick()
  return { wrapper, router }
}

describe('P2 整合：play flow', () => {
  let wrapper: VueWrapper | null = null

  beforeEach(() => {
    setActivePinia(createPinia())
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
      wrapper = null
    }
  })

  it('啟動時若無 board，彈出難度選擇彈窗', async () => {
    const mounted = await mountPlayView()
    wrapper = mounted.wrapper
    expect(wrapper.find('[data-testid="difficulty-modal"]').exists()).toBe(true)
  })

  it('選擇難度後 → 棋盤生成、難度 modal 關閉、有 game-layout', async () => {
    const mounted = await mountPlayView()
    wrapper = mounted.wrapper
    await wrapper.find('[data-testid="pick-easy"]').trigger('click')
    await nextTick()

    expect(wrapper.find('[data-testid="difficulty-modal"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="game-layout"]').exists()).toBe(true)
    expect(wrapper.findAll('.cell')).toHaveLength(81)
  }, 15000)

  it('點擊格子 → store.selectedIndex 更新、SudokuBoard 同步顯示選中', async () => {
    const store = useGameStore()
    store.loadPuzzle(easyPuzzle())
    const mounted = await mountPlayView()
    wrapper = mounted.wrapper
    await nextTick()

    const cells = wrapper.findAll('.cell')
    // 找一個非 given 的空格點擊
    const emptyIdx = store.board!.cells.findIndex((c) => !c.isGiven && c.value === 0)
    await cells[emptyIdx].trigger('click')
    await nextTick()

    expect(store.selectedIndex).toBe(emptyIdx)
    expect(cells[emptyIdx].classes()).toContain('is-selected')
  })

  it('NumberPad 點數字 → board 對應格被填入', async () => {
    const store = useGameStore()
    store.loadPuzzle(easyPuzzle())
    const mounted = await mountPlayView()
    wrapper = mounted.wrapper
    await nextTick()

    const emptyIdx = store.board!.cells.findIndex((c) => !c.isGiven && c.value === 0)
    store.selectCell(emptyIdx)
    await nextTick()

    // 點數字 5
    const numberBtns = wrapper.findAll('.number-btn')
    await numberBtns[4].trigger('click') // index 4 = number 5
    await nextTick()

    expect(store.board!.cells[emptyIdx].value).toBe(5)
  })

  it('點提示 → currentHint 有值且棋盤顯示 hint 高亮', async () => {
    const store = useGameStore()
    store.loadPuzzle(easyPuzzle())
    const mounted = await mountPlayView()
    wrapper = mounted.wrapper
    await nextTick()

    await wrapper.find('[data-testid="btn-hint"]').trigger('click')
    await nextTick()

    expect(store.currentHint).not.toBeNull()
    // HintOverlay 內顯示技巧名
    expect(wrapper.find('.technique-name').text()).toMatch(/裸單|隱單/)
    // 棋盤上至少一格有 is-hint-target
    const hintTargets = wrapper.findAll('.cell.is-hint-target')
    expect(hintTargets.length).toBeGreaterThan(0)
  })

  it('套用提示 → board 對應格被填入、currentHint 被清空', async () => {
    const store = useGameStore()
    store.loadPuzzle(easyPuzzle())
    const mounted = await mountPlayView()
    wrapper = mounted.wrapper
    await nextTick()

    store.requestHint()
    await nextTick()
    const step = store.currentHint!
    const placement = step.placements?.[0]
    expect(placement).toBeDefined()

    await wrapper.find('[data-testid="btn-apply"]').trigger('click')
    await nextTick()

    expect(store.board!.cells[placement!.index].value).toBe(placement!.value)
    expect(store.currentHint).toBeNull()
  })

  it('連續套用提示直到解完 → solved-banner 顯示', async () => {
    const store = useGameStore()
    store.loadPuzzle(easyPuzzle())
    const mounted = await mountPlayView()
    wrapper = mounted.wrapper
    await nextTick()

    // 安全上限：避免任何不預期迴圈
    const maxSteps = 200
    let count = 0
    while (!store.isSolved && count < maxSteps) {
      store.requestHint()
      if (!store.currentHint) {
        break
      }
      store.applyHint()
      count += 1
    }

    expect(store.isSolved).toBe(true)
    await nextTick()
    expect(wrapper.find('[data-testid="solved-banner"]').exists()).toBe(true)
  }, 20000)
})
