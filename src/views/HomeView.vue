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
  <main
    class="flex min-h-screen flex-col items-center justify-center gap-9 bg-slate-50 px-4 py-8 text-slate-800 md:px-8 md:py-12"
  >
    <header class="max-w-2xl text-center">
      <p class="m-0 mb-3 text-xs font-bold uppercase tracking-widest text-indigo-500">
        Sudoku Learning Tool
      </p>
      <h1 class="m-0 text-3xl leading-tight md:text-5xl">數獨學習工具</h1>
      <p class="mt-4 text-base text-slate-500 md:text-lg">
        在三種模式中練習解題、觀摩解法、分析任意盤面
      </p>
    </header>

    <section class="grid w-full max-w-5xl grid-cols-1 gap-4 md:grid-cols-3">
      <button
        class="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        data-testid="mode-play"
        @click="goTo('play')"
      >
        <h2 class="m-0 text-xl text-blue-600">玩</h2>
        <p class="m-0 text-sm text-slate-500">自己解題，卡住時可呼叫提示</p>
      </button>

      <button
        class="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        data-testid="mode-observe"
        @click="goTo('observe')"
      >
        <h2 class="m-0 text-xl text-slate-600">觀摩學習</h2>
        <p class="m-0 text-sm text-slate-500">看電腦逐步解題</p>
      </button>

      <button
        class="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        data-testid="mode-analyze"
        @click="goTo('analyze')"
      >
        <h2 class="m-0 text-xl text-slate-600">分析盤面</h2>
        <p class="m-0 text-sm text-slate-500">輸入任意盤面，分析難度與解法</p>
      </button>
    </section>
  </main>
</template>
