<script setup lang="ts">
import { useRouter } from 'vue-router'

// 分析模式佔位頁（P4 上線）
const router = useRouter()

function goHome(): void {
  router.push({ name: 'home' })
}
</script>

<template>
  <main class="placeholder">
    <h1>分析模式</h1>
    <p>此模式尚未上線（規劃於 P4）。</p>
    <button class="back-btn" @click="goHome">回首頁</button>
  </main>
</template>

<style scoped>
.placeholder {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  background: #f6f8fb;
  color: #374151;
}

h1 {
  margin: 0;
}

.back-btn {
  padding: 8px 18px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
}

.back-btn:hover {
  background: #f1f5f9;
}
</style>
