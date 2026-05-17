<script setup lang="ts">
const title = 'Sudoku Learning Tool'
</script>

<template>
  <main class="app-shell">
    <section class="hero">
      <p class="eyebrow">Vue 3 + Vite + TypeScript</p>
      <h1>{{ title }}</h1>
      <p class="intro">Project scaffold is ready for the Sudoku learning workflow.</p>
    </section>
  </main>
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
  display: grid;
  place-items: center;
  font-family:
    Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  color: #213547;
  background: #f6f8fb;
}

.hero {
  width: min(680px, calc(100vw - 48px));
  padding: 48px;
  border-radius: 24px;
  text-align: center;
  background: #ffffff;
  box-shadow: 0 20px 60px rgb(15 23 42 / 12%);
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
  font-size: clamp(2.5rem, 8vw, 4.5rem);
  line-height: 1;
}

.intro {
  margin: 24px 0 0;
  color: #476072;
  font-size: 1.125rem;
}
</style>
