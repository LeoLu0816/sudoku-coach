<script setup lang="ts">
import { onBeforeUnmount, watch } from 'vue'

// AppDrawer：底部滑入式抽屜
// Props：open（v-model:open）、title 標題
// Slots：default 內容、footer 底部固定區（可選）
// Emits：update:open

interface Props {
  open: boolean
  title?: string
  /**
   * 透明背景：true 時不對底下畫面做暗化 / 模糊。
   * 用於「提示」這類需要使用者同時對照主畫面與抽屜內容的場景。
   */
  transparentBackdrop?: boolean
  /**
   * Bare 模式：移除外層 panel 的 chrome（背景 / 邊框 / 圓角 / 陰影 / inner padding / title bar）
   * 直接讓 slot 內容（通常已有自己的卡片樣式）作為視覺主體；右上角仍保留 ✕ 關閉按鈕。
   * 用於提示等 slot 本身就是卡片的情境，避免「卡中卡」雙層 chrome。
   */
  bare?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  transparentBackdrop: false,
  bare: false,
})

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

// 關閉抽屜（背景 / 關閉鈕 / ESC 共用入口）
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
          :class="[
            'absolute inset-0',
            props.transparentBackdrop ? 'bg-transparent' : 'bg-slate-900/50 backdrop-blur-sm',
          ]"
          @click="close"
        />
        <div
          data-testid="app-drawer-panel"
          :class="[
            'relative z-10 max-h-[85vh] w-full max-w-2xl overflow-y-auto',
            props.bare
              ? 'bg-transparent'
              : 'rounded-t-3xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 shadow-[0_-12px_40px_-8px_rgba(15,23,42,0.3)]',
          ]"
          role="dialog"
          aria-modal="true"
        >
          <!-- 有 title 且非 bare：標題列 + 內嵌關閉鈕 -->
          <div
            v-if="props.title && !props.bare"
            class="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200/70 bg-white/90 px-5 py-3 backdrop-blur"
          >
            <h2 class="m-0 text-base font-bold text-slate-800">{{ props.title }}</h2>
            <button
              data-testid="app-drawer-close"
              class="rounded px-2 py-1 text-sm text-slate-500 hover:bg-slate-100"
              aria-label="關閉"
              @click="close"
            >
              ✕
            </button>
          </div>
          <!-- 無 title 且非 bare：浮動關閉鈕；bare 模式時不渲染（讓 slot 自己處理） -->
          <button
            v-else-if="!props.bare"
            data-testid="app-drawer-close"
            class="absolute right-3 top-3 z-10 rounded px-2 py-1 text-sm text-slate-500 hover:bg-slate-100"
            aria-label="關閉"
            @click="close"
          >
            ✕
          </button>
          <!-- slot 內容容器：bare 模式去除 padding，讓 slot 卡片自己撐版面 -->
          <div :class="props.bare ? '' : 'px-4 py-3'">
            <slot />
          </div>
          <div
            v-if="$slots.footer"
            class="sticky bottom-0 border-t border-slate-200 bg-white px-4 py-3"
          >
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
