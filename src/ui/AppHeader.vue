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
