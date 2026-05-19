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
