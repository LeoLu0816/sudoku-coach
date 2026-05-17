/**
 * PlaybackPanel.test.ts — PlaybackPanel 元件單元測試
 * 1. 步驟列表渲染
 * 2. 當前步驟高亮（.is-current）
 * 3. 點擊步驟 → emit jumpTo
 * 4. prev / next 按鈕 emit
 * 5. prev/next disabled 狀態
 * 6. 播放/暫停按鈕 emit
 * 7. 速度切換 → emit setSpeed
 */
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import PlaybackPanel from './PlaybackPanel.vue'
import type { TechniqueStep } from '@/types/technique'

// 建立測試用假步驟
function makeStep(technique: TechniqueStep['technique'], index: number): TechniqueStep {
  return {
    technique,
    targets: [index as import('@/types/board').CellIndex],
    related: [],
    action: 'place',
    placements: [{ index: index as import('@/types/board').CellIndex, value: 1 }],
    explanation: `測試步驟 ${index}`,
  }
}

const sampleSteps: TechniqueStep[] = [
  makeStep('naked-single', 0),
  makeStep('hidden-single', 1),
  makeStep('naked-pair', 2),
  makeStep('backtrack', 3),
]

describe('PlaybackPanel', () => {
  // ── 步驟列表渲染 ──────────────────────────────────────────────
  it('給定 4 個 steps → 渲染 4 個 step-item', () => {
    const wrapper = mount(PlaybackPanel, {
      props: {
        steps: sampleSteps,
        currentStepIndex: -1,
        autoPlaying: false,
        speed: 'normal',
      },
    })

    const items = wrapper.findAll('.step-item')
    expect(items).toHaveLength(4)
  })

  it('step-item 顯示「第 N+1 步 — 技巧中文名」格式', () => {
    const wrapper = mount(PlaybackPanel, {
      props: {
        steps: sampleSteps,
        currentStepIndex: -1,
        autoPlaying: false,
        speed: 'normal',
      },
    })

    // 第 1 步 → naked-single → 裸單
    expect(wrapper.get('[data-testid="step-0"]').text()).toContain('第 1 步')
    expect(wrapper.get('[data-testid="step-0"]').text()).toContain('裸單')

    // 第 2 步 → hidden-single → 隱單
    expect(wrapper.get('[data-testid="step-1"]').text()).toContain('第 2 步')
    expect(wrapper.get('[data-testid="step-1"]').text()).toContain('隱單')

    // 第 4 步 → backtrack → 暴力回溯
    expect(wrapper.get('[data-testid="step-3"]').text()).toContain('第 4 步')
    expect(wrapper.get('[data-testid="step-3"]').text()).toContain('暴力回溯')
  })

  // ── 當前步驟高亮 ──────────────────────────────────────────────
  it('currentStepIndex=2 時 step-2 有 .is-current，其他沒有', () => {
    const wrapper = mount(PlaybackPanel, {
      props: {
        steps: sampleSteps,
        currentStepIndex: 2,
        autoPlaying: false,
        speed: 'normal',
      },
    })

    expect(wrapper.get('[data-testid="step-2"]').classes()).toContain('is-current')
    expect(wrapper.get('[data-testid="step-0"]').classes()).not.toContain('is-current')
    expect(wrapper.get('[data-testid="step-1"]').classes()).not.toContain('is-current')
    expect(wrapper.get('[data-testid="step-3"]').classes()).not.toContain('is-current')
  })

  it('currentStepIndex=-1 時無任何 step-item 有 .is-current', () => {
    const wrapper = mount(PlaybackPanel, {
      props: {
        steps: sampleSteps,
        currentStepIndex: -1,
        autoPlaying: false,
        speed: 'normal',
      },
    })

    const currentItems = wrapper.findAll('.step-item.is-current')
    expect(currentItems).toHaveLength(0)
  })

  // ── 點擊步驟 → emit jumpTo ────────────────────────────────────
  it('點擊 step-3 → emit jumpTo(3)', async () => {
    const wrapper = mount(PlaybackPanel, {
      props: {
        steps: sampleSteps,
        currentStepIndex: -1,
        autoPlaying: false,
        speed: 'normal',
      },
    })

    await wrapper.get('[data-testid="step-3"]').trigger('click')

    expect(wrapper.emitted('jumpTo')).toBeTruthy()
    expect(wrapper.emitted('jumpTo')![0]).toEqual([3])
  })

  it('點擊 step-0 → emit jumpTo(0)', async () => {
    const wrapper = mount(PlaybackPanel, {
      props: {
        steps: sampleSteps,
        currentStepIndex: 2,
        autoPlaying: false,
        speed: 'normal',
      },
    })

    await wrapper.get('[data-testid="step-0"]').trigger('click')

    expect(wrapper.emitted('jumpTo')![0]).toEqual([0])
  })

  // ── prev / next 按鈕 emit ────────────────────────────────────
  it('點擊 btn-prev → emit prev', async () => {
    const wrapper = mount(PlaybackPanel, {
      props: {
        steps: sampleSteps,
        currentStepIndex: 1,
        autoPlaying: false,
        speed: 'normal',
      },
    })

    await wrapper.get('[data-testid="btn-prev"]').trigger('click')

    expect(wrapper.emitted('prev')).toBeTruthy()
  })

  it('點擊 btn-next → emit next', async () => {
    const wrapper = mount(PlaybackPanel, {
      props: {
        steps: sampleSteps,
        currentStepIndex: 0,
        autoPlaying: false,
        speed: 'normal',
      },
    })

    await wrapper.get('[data-testid="btn-next"]').trigger('click')

    expect(wrapper.emitted('next')).toBeTruthy()
  })

  // ── prev disabled 狀態 ────────────────────────────────────────
  it('currentStepIndex=-1 時 btn-prev 為 disabled', () => {
    const wrapper = mount(PlaybackPanel, {
      props: {
        steps: sampleSteps,
        currentStepIndex: -1,
        autoPlaying: false,
        speed: 'normal',
      },
    })

    const prevBtn = wrapper.get('[data-testid="btn-prev"]')
    expect((prevBtn.element as HTMLButtonElement).disabled).toBe(true)
  })

  it('currentStepIndex=0 時 btn-prev 為 disabled（0 > -1 但 <=  -1 不成立 → 非 disabled）', () => {
    // currentStepIndex=0 → 0 > -1 → NOT disabled
    const wrapper = mount(PlaybackPanel, {
      props: {
        steps: sampleSteps,
        currentStepIndex: 0,
        autoPlaying: false,
        speed: 'normal',
      },
    })

    const prevBtn = wrapper.get('[data-testid="btn-prev"]')
    expect((prevBtn.element as HTMLButtonElement).disabled).toBe(false)
  })

  // ── next disabled 狀態 ────────────────────────────────────────
  it('currentStepIndex=steps.length-1 時 btn-next 為 disabled', () => {
    const wrapper = mount(PlaybackPanel, {
      props: {
        steps: sampleSteps,
        currentStepIndex: sampleSteps.length - 1, // 3
        autoPlaying: false,
        speed: 'normal',
      },
    })

    const nextBtn = wrapper.get('[data-testid="btn-next"]')
    expect((nextBtn.element as HTMLButtonElement).disabled).toBe(true)
  })

  it('currentStepIndex < steps.length-1 時 btn-next 可用', () => {
    const wrapper = mount(PlaybackPanel, {
      props: {
        steps: sampleSteps,
        currentStepIndex: 2,
        autoPlaying: false,
        speed: 'normal',
      },
    })

    const nextBtn = wrapper.get('[data-testid="btn-next"]')
    expect((nextBtn.element as HTMLButtonElement).disabled).toBe(false)
  })

  // ── 播放/暫停按鈕 ─────────────────────────────────────────────
  it('autoPlaying=false 時 btn-play-pause 顯示「播放」，點擊 emit play', async () => {
    const wrapper = mount(PlaybackPanel, {
      props: {
        steps: sampleSteps,
        currentStepIndex: -1,
        autoPlaying: false,
        speed: 'normal',
      },
    })

    const btn = wrapper.get('[data-testid="btn-play-pause"]')
    expect(btn.text()).toBe('播放')

    await btn.trigger('click')
    expect(wrapper.emitted('play')).toBeTruthy()
    expect(wrapper.emitted('pause')).toBeFalsy()
  })

  it('autoPlaying=true 時 btn-play-pause 顯示「暫停」，點擊 emit pause', async () => {
    const wrapper = mount(PlaybackPanel, {
      props: {
        steps: sampleSteps,
        currentStepIndex: 1,
        autoPlaying: true,
        speed: 'normal',
      },
    })

    const btn = wrapper.get('[data-testid="btn-play-pause"]')
    expect(btn.text()).toBe('暫停')

    await btn.trigger('click')
    expect(wrapper.emitted('pause')).toBeTruthy()
    expect(wrapper.emitted('play')).toBeFalsy()
  })

  // ── 速度切換 → emit setSpeed ──────────────────────────────────
  it('speed-select 切換為 slow → emit setSpeed("slow")', async () => {
    const wrapper = mount(PlaybackPanel, {
      props: {
        steps: sampleSteps,
        currentStepIndex: -1,
        autoPlaying: false,
        speed: 'normal',
      },
    })

    const select = wrapper.get('[data-testid="speed-select"]')
    await select.setValue('slow')

    expect(wrapper.emitted('setSpeed')).toBeTruthy()
    expect(wrapper.emitted('setSpeed')![0]).toEqual(['slow'])
  })

  it('speed-select 切換為 fast → emit setSpeed("fast")', async () => {
    const wrapper = mount(PlaybackPanel, {
      props: {
        steps: sampleSteps,
        currentStepIndex: -1,
        autoPlaying: false,
        speed: 'normal',
      },
    })

    const select = wrapper.get('[data-testid="speed-select"]')
    await select.setValue('fast')

    expect(wrapper.emitted('setSpeed')![0]).toEqual(['fast'])
  })

  it('speed prop=fast 時 speed-select 預設選中 fast', () => {
    const wrapper = mount(PlaybackPanel, {
      props: {
        steps: sampleSteps,
        currentStepIndex: -1,
        autoPlaying: false,
        speed: 'fast',
      },
    })

    const select = wrapper.get<HTMLSelectElement>('[data-testid="speed-select"]')
    expect((select.element as HTMLSelectElement).value).toBe('fast')
  })
})
