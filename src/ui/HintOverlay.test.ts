import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import HintOverlay from './HintOverlay.vue'
import type { TechniqueStep } from '@/types/technique'

// 建立測試用的 TechniqueStep
function makeStep(overrides: Partial<TechniqueStep> = {}): TechniqueStep {
  return {
    technique: 'naked-single',
    targets: [0],
    related: [],
    action: 'place',
    placements: [{ index: 0, value: 5 }],
    explanation: '第一行第一格只有候選數 5，可直接填入。',
    ...overrides,
  }
}

describe('HintOverlay', () => {
  // 1. 給定 step → 標頭含技巧中文名
  it('顯示技巧中文名「裸單」', () => {
    const wrapper = mount(HintOverlay, {
      props: { step: makeStep({ technique: 'naked-single' }) },
    })
    expect(wrapper.text()).toContain('裸單')
  })

  // 2. 給定 step → 內文含 explanation
  it('顯示 explanation 文字', () => {
    const step = makeStep({ explanation: '測試說明文字內容' })
    const wrapper = mount(HintOverlay, { props: { step } })
    const el = wrapper.find('.explanation')
    expect(el.exists()).toBe(true)
    expect(el.text()).toContain('測試說明文字內容')
  })

  // 3. 點 apply → emit apply
  it('點擊套用按鈕 → emit apply', async () => {
    const wrapper = mount(HintOverlay, { props: { step: makeStep() } })
    await wrapper.find('[data-testid="btn-apply"]').trigger('click')
    expect(wrapper.emitted('apply')).toHaveLength(1)
  })

  // 4. 點 next → emit next
  it('點擊下一個按鈕 → emit next', async () => {
    const wrapper = mount(HintOverlay, { props: { step: makeStep() } })
    await wrapper.find('[data-testid="btn-next"]').trigger('click')
    expect(wrapper.emitted('next')).toHaveLength(1)
  })

  // 5. 點 close → emit close
  it('點擊關閉按鈕 → emit close', async () => {
    const wrapper = mount(HintOverlay, { props: { step: makeStep() } })
    await wrapper.find('[data-testid="btn-close"]').trigger('click')
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  // 6. step=null → 顯示空狀態文字
  it('step=null 時顯示「目前無可推薦步驟」', () => {
    const wrapper = mount(HintOverlay, { props: { step: null } })
    const el = wrapper.find('.empty')
    expect(el.exists()).toBe(true)
    expect(el.text()).toContain('目前無可推薦步驟')
  })

  // 7. step=null → apply 按鈕不存在
  it('step=null 時不顯示套用按鈕', () => {
    const wrapper = mount(HintOverlay, { props: { step: null } })
    expect(wrapper.find('[data-testid="btn-apply"]').exists()).toBe(false)
  })

  // 8. step=null → next / close 仍存在
  it('step=null 時仍顯示下一個與關閉按鈕', () => {
    const wrapper = mount(HintOverlay, { props: { step: null } })
    expect(wrapper.find('[data-testid="btn-next"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="btn-close"]').exists()).toBe(true)
  })

  // 9. 各技巧 ID 中文名對應
  it.each([
    ['hidden-single', '隱單'],
    ['naked-pair', '裸對'],
    ['hidden-pair', '隱對'],
    ['naked-triple', '裸三'],
    ['pointing-pair', '指向對'],
    ['box-line-reduction', '區塊行列消除'],
    ['backtrack', '暴力回溯'],
  ] as const)('technique=%s → 顯示「%s」', (id, name) => {
    const wrapper = mount(HintOverlay, {
      props: { step: makeStep({ technique: id }) },
    })
    expect(wrapper.text()).toContain(name)
  })
})
