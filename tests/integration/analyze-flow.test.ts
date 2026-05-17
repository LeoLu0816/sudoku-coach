/**
 * P4 整合測試：分析模式完整流程
 * 驗證 AnalyzeView + PuzzleInputPanel + analyzeStore 整合
 * 涵蓋：唯一解 / 多解 / 無解 三種情境，以及「進入觀摩」跳轉
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mount, flushPromises, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter, type Router } from 'vue-router'
import { nextTick } from 'vue'

import AnalyzeView from '@/views/AnalyzeView.vue'
import ObserveView from '@/views/ObserveView.vue'
import HomeView from '@/views/HomeView.vue'
import { useAnalyzeStore } from '@/stores/analyze'
import { usePlaybackStore } from '@/stores/playback'
import { fixturePuzzles } from '@/fixtures'

/** 取 fixture easy-01 的 given 字串 */
function easyGivenString(): string {
  return fixturePuzzles.find((p) => p.id === 'easy-01')!.given
}

/** 建立帶 router 的 AnalyzeView wrapper */
async function mountAnalyzeView(): Promise<{ wrapper: VueWrapper; router: Router }> {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component: HomeView },
      { path: '/analyze', name: 'analyze', component: AnalyzeView },
      { path: '/observe', name: 'observe', component: ObserveView },
    ],
  })
  router.push('/analyze')
  await router.isReady()
  const wrapper = mount(AnalyzeView, {
    global: { plugins: [router] },
  })
  await nextTick()
  return { wrapper, router }
}

describe('P4 整合：analyze flow', () => {
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

  it('初始狀態：無 result 顯示提示文字', async () => {
    const mounted = await mountAnalyzeView()
    wrapper = mounted.wrapper
    expect(wrapper.find('[data-testid="analyze-result"]').exists()).toBe(false)
  })

  it('貼合法 81 字串 + 載入 + 分析 → 唯一解結果顯示難度', async () => {
    const mounted = await mountAnalyzeView()
    wrapper = mounted.wrapper

    // 貼字串到 textarea
    const ta = wrapper.find('[data-testid="text-input"]')
    await ta.setValue(easyGivenString())
    await wrapper.find('[data-testid="btn-load"]').trigger('click')
    await nextTick()

    // 按分析
    await wrapper.find('[data-testid="btn-analyze"]').trigger('click')
    await nextTick()

    const store = useAnalyzeStore()
    expect(store.result?.isUnique).toBe(true)
    expect(store.result?.difficulty).toBe('easy')

    // UI 顯示難度
    const diff = wrapper.find('[data-testid="result-difficulty"]')
    expect(diff.exists()).toBe(true)
    expect(diff.text()).toBe('簡單')
  })

  it('多解情境：全空盤面 → 顯示「非唯一解」錯誤', async () => {
    const mounted = await mountAnalyzeView()
    wrapper = mounted.wrapper

    // 貼 81 個 .（全空）
    const ta = wrapper.find('[data-testid="text-input"]')
    await ta.setValue('.'.repeat(81))
    await wrapper.find('[data-testid="btn-load"]').trigger('click')
    await nextTick()

    await wrapper.find('[data-testid="btn-analyze"]').trigger('click')
    await nextTick()

    const err = wrapper.find('[data-testid="result-error"]')
    expect(err.exists()).toBe(true)
    expect(err.text()).toContain('非唯一解')
  })

  it('無解情境：同列兩個 1 → 顯示「無解」錯誤', async () => {
    const mounted = await mountAnalyzeView()
    wrapper = mounted.wrapper

    // 第一列前兩格都 1 → 矛盾盤面
    const bad = '11' + '.'.repeat(79)
    const ta = wrapper.find('[data-testid="text-input"]')
    await ta.setValue(bad)
    await wrapper.find('[data-testid="btn-load"]').trigger('click')
    await nextTick()

    await wrapper.find('[data-testid="btn-analyze"]').trigger('click')
    await nextTick()

    const err = wrapper.find('[data-testid="result-error"]')
    expect(err.exists()).toBe(true)
    expect(err.text()).toContain('無解')
  })

  it('長度錯誤字串 → 顯示錯誤訊息且不分析', async () => {
    const mounted = await mountAnalyzeView()
    wrapper = mounted.wrapper

    const ta = wrapper.find('[data-testid="text-input"]')
    await ta.setValue('123')
    await wrapper.find('[data-testid="btn-load"]').trigger('click')
    await nextTick()

    const errMsg = wrapper.find('[data-testid="error-msg"]')
    expect(errMsg.exists()).toBe(true)
    expect(errMsg.text()).toContain('長度')
  })

  it('進入觀摩按鈕 → playbackStore.loadPuzzle 灌入 + 路由跳 /observe', async () => {
    const mounted = await mountAnalyzeView()
    wrapper = mounted.wrapper

    const ta = wrapper.find('[data-testid="text-input"]')
    await ta.setValue(easyGivenString())
    await wrapper.find('[data-testid="btn-load"]').trigger('click')
    await nextTick()
    await wrapper.find('[data-testid="btn-analyze"]').trigger('click')
    await nextTick()

    await wrapper.find('[data-testid="btn-enter-observe"]').trigger('click')
    await flushPromises()

    const playbackStore = usePlaybackStore()
    expect(playbackStore.puzzle).not.toBeNull()
    expect(playbackStore.steps.length).toBeGreaterThan(0)
    expect(mounted.router.currentRoute.value.name).toBe('observe')
  })
})
