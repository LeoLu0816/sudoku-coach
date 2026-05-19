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
              aria-label="關閉"
              @click="close"
            >
              ✕
            </button>
          </div>
          <button
            v-else
            data-testid="app-drawer-close"
            class="absolute right-3 top-3 z-10 rounded px-2 py-1 text-sm text-slate-500 hover:bg-slate-100"
            aria-label="關閉"
            @click="close"
          >
            ✕
          </button>
          <div class="px-4 py-3">
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
