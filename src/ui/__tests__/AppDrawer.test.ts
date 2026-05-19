import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import AppDrawer from '../AppDrawer.vue'

describe('AppDrawer', () => {
  it('open=false 時不渲染抽屜內容', () => {
    const wrapper = mount(AppDrawer, {
      props: { open: false },
      slots: { default: '<p>抽屜內容</p>' },
      attachTo: document.body,
    })
    expect(document.querySelector('[data-testid="app-drawer-panel"]')).toBeNull()
    wrapper.unmount()
  })

  it('open=true 時渲染抽屜內容與遮罩', () => {
    const wrapper = mount(AppDrawer, {
      props: { open: true, title: '提示' },
      slots: { default: '<p>抽屜內容</p>' },
      attachTo: document.body,
    })
    expect(document.querySelector('[data-testid="app-drawer-panel"]')).not.toBeNull()
    expect(document.querySelector('[data-testid="app-drawer-backdrop"]')).not.toBeNull()
    expect(document.body.textContent).toContain('抽屜內容')
    expect(document.body.textContent).toContain('提示')
    wrapper.unmount()
  })

  it('點背景遮罩 emit update:open=false', async () => {
    const wrapper = mount(AppDrawer, {
      props: { open: true },
      attachTo: document.body,
    })
    const backdrop = document.querySelector('[data-testid="app-drawer-backdrop"]') as HTMLElement
    backdrop.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await nextTick()
    expect(wrapper.emitted('update:open')?.[0]).toEqual([false])
    wrapper.unmount()
  })

  it('點關閉鈕 emit update:open=false', async () => {
    const wrapper = mount(AppDrawer, {
      props: { open: true },
      attachTo: document.body,
    })
    const closeBtn = document.querySelector('[data-testid="app-drawer-close"]') as HTMLElement
    closeBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await nextTick()
    expect(wrapper.emitted('update:open')?.[0]).toEqual([false])
    wrapper.unmount()
  })

  it('open=true 時按 ESC 鍵 emit update:open=false', async () => {
    const wrapper = mount(AppDrawer, {
      props: { open: true },
      attachTo: document.body,
    })
    await nextTick()
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await nextTick()
    expect(wrapper.emitted('update:open')?.[0]).toEqual([false])
    wrapper.unmount()
  })
})
