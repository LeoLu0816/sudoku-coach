import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import NumberPad from './NumberPad.vue'

/** 建立預設 remainingCounts（1-9 各剩 9） */
function makeFullCounts(): number[] {
  return Array(9).fill(9)
}

describe('NumberPad', () => {
  it('點擊數字 5 → emit number value=5', async () => {
    const counts = makeFullCounts()
    const wrapper = mount(NumberPad, {
      props: { remainingCounts: counts, pencilMode: false },
    })

    // 取第 5 個 .number-btn（index 4）
    const btns = wrapper.findAll('.number-btn')
    await btns[4].trigger('click')

    expect(wrapper.emitted('number')).toBeTruthy()
    expect(wrapper.emitted('number')![0]).toEqual([5])
  })

  it('remainingCounts[4]=0 時，數字 5 按鈕 disabled，點擊不 emit', async () => {
    const counts = makeFullCounts()
    counts[4] = 0
    const wrapper = mount(NumberPad, {
      props: { remainingCounts: counts, pencilMode: false },
    })

    const btns = wrapper.findAll('.number-btn')
    const btn5 = btns[4]

    // 按鈕應為 disabled
    expect((btn5.element as HTMLButtonElement).disabled).toBe(true)

    // 強制觸發 click 也不應有 emit
    await btn5.trigger('click')
    expect(wrapper.emitted('number')).toBeFalsy()
  })

  it('點擊 pencil-btn → emit togglePencil', async () => {
    const wrapper = mount(NumberPad, {
      props: { remainingCounts: makeFullCounts(), pencilMode: false },
    })

    await wrapper.find('.pencil-btn').trigger('click')
    expect(wrapper.emitted('togglePencil')).toBeTruthy()
  })

  it('點擊 clear-btn → emit clear', async () => {
    const wrapper = mount(NumberPad, {
      props: { remainingCounts: makeFullCounts(), pencilMode: false },
    })

    await wrapper.find('.clear-btn').trigger('click')
    expect(wrapper.emitted('clear')).toBeTruthy()
  })

  it('pencilMode=true 時 pencil-btn 有 .is-active', () => {
    const wrapper = mount(NumberPad, {
      props: { remainingCounts: makeFullCounts(), pencilMode: true },
    })

    expect(wrapper.find('.pencil-btn').classes()).toContain('is-active')
  })

  it('pencilMode=false 時 pencil-btn 無 .is-active', () => {
    const wrapper = mount(NumberPad, {
      props: { remainingCounts: makeFullCounts(), pencilMode: false },
    })

    expect(wrapper.find('.pencil-btn').classes()).not.toContain('is-active')
  })

  it('剩餘數量顯示在 .count span 內', () => {
    const counts = [3, 5, 9, 0, 1, 7, 2, 8, 4]
    const wrapper = mount(NumberPad, {
      props: { remainingCounts: counts, pencilMode: false },
    })

    const countSpans = wrapper.findAll('.count')
    counts.forEach((c, i) => {
      expect(countSpans[i].text()).toBe(String(c))
    })
  })
})
