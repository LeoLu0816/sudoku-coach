import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import BottomBar from '../BottomBar.vue'

describe('BottomBar', () => {
  it('渲染 default slot 內容', () => {
    const wrapper = mount(BottomBar, {
      slots: { default: '<button>數字 1</button>' },
    })
    expect(wrapper.text()).toContain('數字 1')
  })

  it('容器具備 sticky bottom class（手機版預設）', () => {
    const wrapper = mount(BottomBar)
    const root = wrapper.find('[data-testid="bottom-bar"]')
    expect(root.classes()).toContain('sticky')
    expect(root.classes()).toContain('bottom-0')
  })
})
