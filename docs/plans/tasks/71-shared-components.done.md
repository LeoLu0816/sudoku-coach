---
id: 71-shared-components
phase: P6
status: todo
depends_on: [70-tailwind-setup]
assignee: claude-code
estimated_complexity: M
acceptance:
  - "src/ui/AppHeader.vue 存在並支援 title prop、actions slot、back emit"
  - "src/ui/BottomBar.vue 存在，手機 sticky、桌面（≥ md）退化為非 sticky"
  - "src/ui/AppDrawer.vue 存在，支援 v-model:open，含遮罩、底部滑入動畫、ESC 關閉"
  - "AppDrawer.test.ts / BottomBar.test.ts 撰寫且全綠"
  - "pnpm typecheck / pnpm test 全綠"
deliverables:
  - "src/ui/AppHeader.vue"
  - "src/ui/BottomBar.vue"
  - "src/ui/AppDrawer.vue"
  - "src/ui/__tests__/AppDrawer.test.ts"
  - "src/ui/__tests__/BottomBar.test.ts"
---

# Task 71: 共用 RWD 元件（AppHeader / BottomBar / AppDrawer）

## 目標

建立三個全站共用的 RWD 元件，給 Task 73–76 的 view 改造使用。AppDrawer 需有完整開關邏輯與 ESC 鍵盤支援，故走 TDD。

## 變動檔案

- 建立：
  - `src/ui/AppHeader.vue`
  - `src/ui/BottomBar.vue`
  - `src/ui/AppDrawer.vue`
  - `src/ui/__tests__/AppDrawer.test.ts`
  - `src/ui/__tests__/BottomBar.test.ts`

## 實作步驟

### 子任務 A：AppHeader（純佈局，無測試）

- [ ] **Step 1：建立 `src/ui/AppHeader.vue`**

```vue
<script setup lang="ts">
// AppHeader：三個 view 共用標頭
// Props：title 標題文字
// Slots：actions 右側操作區
// Emits：back 點返回鈕

interface Props {
  title: string
}

defineProps<Props>()

const emit = defineEmits<{
  back: []
}>()

function onBack(): void {
  emit('back')
}
</script>

<template>
  <header
    class="sticky top-0 z-10 flex items-center gap-3 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur"
  >
    <button
      class="rounded px-2 py-1 text-sm text-blue-600 hover:underline"
      data-testid="app-header-back"
      @click="onBack"
    >
      ← 首頁
    </button>
    <h1 class="m-0 flex-1 text-lg font-semibold text-slate-800 md:text-xl">{{ title }}</h1>
    <div class="flex items-center gap-2">
      <slot name="actions" />
    </div>
  </header>
</template>
```

### 子任務 B：BottomBar（含測試）

- [ ] **Step 2：寫 `src/ui/__tests__/BottomBar.test.ts`（先失敗）**

```ts
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
```

- [ ] **Step 3：跑測試確認失敗**

執行：`pnpm test src/ui/__tests__/BottomBar.test.ts`
預期：FAIL（BottomBar.vue 不存在）

- [ ] **Step 4：建立 `src/ui/BottomBar.vue`**

```vue
<script setup lang="ts">
// BottomBar：手機 sticky 底部容器；桌面（≥ md）退化為非 sticky
// 純佈局，內容由 slot 注入
</script>

<template>
  <div
    data-testid="bottom-bar"
    class="sticky bottom-0 z-10 border-t border-slate-200 bg-white px-3 py-2 md:static md:border-0 md:bg-transparent md:px-0 md:py-0"
  >
    <slot />
  </div>
</template>
```

- [ ] **Step 5：跑測試確認通過**

執行：`pnpm test src/ui/__tests__/BottomBar.test.ts`
預期：PASS（2 tests）

### 子任務 C：AppDrawer（含測試）

- [ ] **Step 6：寫 `src/ui/__tests__/AppDrawer.test.ts`（先失敗）**

```ts
import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import AppDrawer from '../AppDrawer.vue'

describe('AppDrawer', () => {
  it('open=false 時不渲染抽屜內容', () => {
    const wrapper = mount(AppDrawer, {
      props: { open: false },
      slots: { default: '<p>抽屜內容</p>' },
    })
    expect(wrapper.find('[data-testid="app-drawer-panel"]').exists()).toBe(false)
  })

  it('open=true 時渲染抽屜內容與遮罩', () => {
    const wrapper = mount(AppDrawer, {
      props: { open: true, title: '提示' },
      slots: { default: '<p>抽屜內容</p>' },
    })
    expect(wrapper.find('[data-testid="app-drawer-panel"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="app-drawer-backdrop"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('抽屜內容')
    expect(wrapper.text()).toContain('提示')
  })

  it('點背景遮罩 emit update:open=false', async () => {
    const wrapper = mount(AppDrawer, {
      props: { open: true },
    })
    await wrapper.find('[data-testid="app-drawer-backdrop"]').trigger('click')
    expect(wrapper.emitted('update:open')?.[0]).toEqual([false])
  })

  it('點關閉鈕 emit update:open=false', async () => {
    const wrapper = mount(AppDrawer, {
      props: { open: true },
    })
    await wrapper.find('[data-testid="app-drawer-close"]').trigger('click')
    expect(wrapper.emitted('update:open')?.[0]).toEqual([false])
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
```

- [ ] **Step 7：跑測試確認失敗**

執行：`pnpm test src/ui/__tests__/AppDrawer.test.ts`
預期：FAIL（AppDrawer.vue 不存在）

- [ ] **Step 8：建立 `src/ui/AppDrawer.vue`**

```vue
<script setup lang="ts">
import { onBeforeUnmount, watch } from 'vue'

// AppDrawer：底部滑入式抽屜
// Props：open（v-model:open）、title 標題
// Slots：default 內容、footer 底部固定區（可選）
// Emits：update:open

interface Props {
  open: boolean
  title?: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

// 關閉抽屜（背景 / 關閉鈕 / ESC 共用）
function close(): void {
  emit('update:open', false)
}

// ESC 鍵盤監聽：open=true 時掛上 keydown handler，關閉或卸載時移除
function handleKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    close()
  }
}

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      window.addEventListener('keydown', handleKeydown)
    } else {
      window.removeEventListener('keydown', handleKeydown)
    }
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <Teleport to="body">
    <Transition name="drawer">
      <div v-if="props.open" class="fixed inset-0 z-50 flex items-end justify-center">
        <div
          data-testid="app-drawer-backdrop"
          class="absolute inset-0 bg-slate-900/40"
          @click="close"
        />
        <div
          data-testid="app-drawer-panel"
          class="relative z-10 max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl bg-white shadow-xl"
          role="dialog"
          aria-modal="true"
        >
          <div
            v-if="props.title"
            class="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3"
          >
            <h2 class="m-0 text-base font-semibold text-slate-800">{{ props.title }}</h2>
            <button
              data-testid="app-drawer-close"
              class="rounded px-2 py-1 text-sm text-slate-500 hover:bg-slate-100"
              @click="close"
              aria-label="關閉"
            >
              ✕
            </button>
          </div>
          <button
            v-else
            data-testid="app-drawer-close"
            class="absolute right-3 top-3 z-10 rounded px-2 py-1 text-sm text-slate-500 hover:bg-slate-100"
            @click="close"
            aria-label="關閉"
          >
            ✕
          </button>
          <div class="px-4 py-3">
            <slot />
          </div>
          <div v-if="$slots.footer" class="sticky bottom-0 border-t border-slate-200 bg-white px-4 py-3">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.drawer-enter-active,
.drawer-leave-active {
  transition: opacity 200ms ease;
}

.drawer-enter-active [data-testid='app-drawer-panel'],
.drawer-leave-active [data-testid='app-drawer-panel'] {
  transition: transform 200ms ease;
}

.drawer-enter-from,
.drawer-leave-to {
  opacity: 0;
}

.drawer-enter-from [data-testid='app-drawer-panel'],
.drawer-leave-to [data-testid='app-drawer-panel'] {
  transform: translateY(100%);
}
</style>
```

- [ ] **Step 9：跑測試確認通過**

執行：`pnpm test src/ui/__tests__/AppDrawer.test.ts`
預期：PASS（5 tests）

注意：Teleport 在 jsdom 下需要把 attachTo 指 `document.body`；ESC 測試已含此設定。若 jsdom 對 Teleport 不友善導致測試找不到元素，調整為非 Teleport 渲染（移除 `<Teleport>` 包裹改為一般 div），或在測試 mount 時用 `global: { stubs: { teleport: false } }`。

### 子任務 D：整合驗收

- [ ] **Step 10：跑全測試**

執行：`pnpm typecheck && pnpm test`
預期：全綠（既有測試不受影響 + 兩個新測試檔通過）

- [ ] **Step 11：commit**

```bash
git add src/ui/AppHeader.vue src/ui/BottomBar.vue src/ui/AppDrawer.vue src/ui/__tests__/AppDrawer.test.ts src/ui/__tests__/BottomBar.test.ts
git commit -m "feat(ui): 新增 RWD 共用元件 AppHeader / BottomBar / AppDrawer [71-shared-components]"
```

## 完工條件

- [ ] AppHeader / BottomBar / AppDrawer 三個 .vue 檔存在
- [ ] AppDrawer.test.ts 5 tests 全綠
- [ ] BottomBar.test.ts 2 tests 全綠
- [ ] `pnpm typecheck` 全綠
- [ ] `pnpm test` 全綠

## 設計決策備註

- AppDrawer 用 `<Teleport to="body">` 是為了確保 z-index 與遮罩正確覆蓋整個視窗，不受父層 stacking context 影響
- 沒做 focus trap：本案 UI 複雜度不高，使用者可由背景遮罩 / ESC / 關閉鈕三路關閉；後續真的需要再補
- 動畫 200ms：與大多數 mobile UI 慣例對齊，太慢影響操作節奏
