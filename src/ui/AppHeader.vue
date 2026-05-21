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

// 觸發返回事件，由 view 層決定路由
function onBack(): void {
  emit('back')
}
</script>

<template>
  <header
    class="sticky top-0 z-10 flex items-center gap-3 border-b border-slate-200/70 bg-white/90 px-4 py-3 shadow-[0_2px_8px_-4px_rgba(15,23,42,0.1)] backdrop-blur-lg"
  >
    <button
      class="game-btn px-3 py-1.5 text-sm"
      data-testid="app-header-back"
      @click="onBack"
    >
      ← 首頁
    </button>
    <h1
      class="m-0 flex-1 bg-gradient-to-br from-slate-700 to-slate-900 bg-clip-text text-lg font-bold text-transparent md:text-xl"
    >
      {{ title }}
    </h1>
    <div class="flex items-center gap-2">
      <slot name="actions" />
    </div>
  </header>
</template>
