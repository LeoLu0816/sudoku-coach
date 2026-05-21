<script setup lang="ts">
// BottomBar：手機 sticky 底部容器；桌面（≥ md）退化為非 sticky
// 純佈局，內容由 slot 注入
</script>

<template>
  <div
    data-testid="bottom-bar"
    class="sticky bottom-0 z-10 border-t border-slate-200/70 bg-white/95 px-3 py-3 shadow-[0_-4px_16px_-4px_rgba(15,23,42,0.1)] backdrop-blur-lg md:static md:border-0 md:bg-transparent md:px-0 md:py-0 md:shadow-none md:backdrop-blur-none"
  >
    <slot />
  </div>
</template>
