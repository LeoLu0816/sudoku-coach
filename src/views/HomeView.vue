<script setup lang="ts">
import { useRouter } from 'vue-router'

// 入口頁：列出三種模式，點擊跳對應路由
const router = useRouter()

/** 切換到指定模式路由 */
function goTo(name: 'play' | 'observe' | 'analyze'): void {
  router.push({ name })
}
</script>

<template>
  <main class="home">
    <header class="hero">
      <p class="eyebrow">Sudoku Learning Tool</p>
      <h1>數獨學習工具</h1>
      <p class="intro">在三種模式中練習解題、觀摩解法、分析任意盤面</p>
    </header>

    <section class="modes">
      <button class="mode-card mode-play" data-testid="mode-play" @click="goTo('play')">
        <h2>玩</h2>
        <p>自己解題，卡住時可呼叫提示</p>
      </button>

      <button class="mode-card mode-observe" data-testid="mode-observe" @click="goTo('observe')">
        <h2>觀摩學習</h2>
        <p>看電腦逐步解題（P3 上線）</p>
      </button>

      <button class="mode-card mode-analyze" data-testid="mode-analyze" @click="goTo('analyze')">
        <h2>分析盤面</h2>
        <p>輸入任意盤面，分析難度與解法（P4 上線）</p>
      </button>
    </section>
  </main>
</template>

<style scoped>
.home {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 36px;
  padding: 32px;
  background: #f6f8fb;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, sans-serif;
  color: #1f2937;
}

.hero {
  text-align: center;
  max-width: 640px;
}

.eyebrow {
  margin: 0 0 12px;
  color: #646cff;
  font-size: 0.875rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

h1 {
  margin: 0;
  font-size: clamp(2rem, 5vw, 3.5rem);
  line-height: 1.1;
}

.intro {
  margin: 16px 0 0;
  color: #476072;
  font-size: 1.05rem;
}

.modes {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
  width: min(960px, 100%);
}

.mode-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 24px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  cursor: pointer;
  text-align: left;
  box-shadow: 0 8px 24px rgb(15 23 42 / 6%);
  transition: transform 0.15s, box-shadow 0.15s;
}

.mode-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 28px rgb(15 23 42 / 10%);
}

.mode-card h2 {
  margin: 0;
  font-size: 1.4rem;
  color: #1f2937;
}

.mode-card p {
  margin: 0;
  color: #64748b;
  font-size: 0.95rem;
}

.mode-play h2 {
  color: #2563eb;
}

.mode-observe h2 {
  color: #6b7280;
}

.mode-analyze h2 {
  color: #6b7280;
}
</style>
