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
    class="flex min-h-screen flex-col items-center justify-center gap-10 px-4 py-8 text-slate-800 md:px-8 md:py-12"
  >
    <header class="max-w-2xl text-center">
      <p class="m-0 mb-3 text-xs font-bold uppercase tracking-widest text-indigo-500">
        Sudoku Learning Tool
      </p>
      <h1
        class="m-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-4xl font-extrabold leading-tight text-transparent md:text-6xl"
      >
        數獨學習工具
      </h1>
      <p class="mt-4 text-base text-slate-500 md:text-lg">
        在三種模式中練習解題、觀摩解法、分析任意盤面
      </p>
    </header>

    <section class="grid w-full max-w-5xl grid-cols-1 gap-5 md:grid-cols-3">
      <button
        class="group flex flex-col gap-2 rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-6 text-left shadow-[0_4px_16px_-4px_rgba(15,23,42,0.1)] transition-all duration-200 hover:-translate-y-1 hover:border-blue-400 hover:shadow-[0_12px_24px_-8px_rgba(37,99,235,0.25)] active:translate-y-0 active:shadow-[0_2px_8px_-2px_rgba(15,23,42,0.1)]"
        data-testid="mode-play"
        @click="goTo('play')"
      >
        <h2 class="m-0 text-2xl font-bold text-blue-600 group-hover:text-blue-700">🎮 玩</h2>
        <p class="m-0 text-sm text-slate-500">自己解題，卡住時可呼叫提示</p>
      </button>

      <button
        class="group flex flex-col gap-2 rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-6 text-left shadow-[0_4px_16px_-4px_rgba(15,23,42,0.1)] transition-all duration-200 hover:-translate-y-1 hover:border-amber-400 hover:shadow-[0_12px_24px_-8px_rgba(245,158,11,0.25)] active:translate-y-0 active:shadow-[0_2px_8px_-2px_rgba(15,23,42,0.1)]"
        data-testid="mode-observe"
        @click="goTo('observe')"
      >
        <h2 class="m-0 text-2xl font-bold text-amber-600 group-hover:text-amber-700">
          👀 觀摩學習
        </h2>
        <p class="m-0 text-sm text-slate-500">看電腦逐步解題</p>
      </button>

      <button
        class="group flex flex-col gap-2 rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-6 text-left shadow-[0_4px_16px_-4px_rgba(15,23,42,0.1)] transition-all duration-200 hover:-translate-y-1 hover:border-emerald-400 hover:shadow-[0_12px_24px_-8px_rgba(16,185,129,0.25)] active:translate-y-0 active:shadow-[0_2px_8px_-2px_rgba(15,23,42,0.1)]"
        data-testid="mode-analyze"
        @click="goTo('analyze')"
      >
        <h2 class="m-0 text-2xl font-bold text-emerald-600 group-hover:text-emerald-700">
          🔬 分析盤面
        </h2>
        <p class="m-0 text-sm text-slate-500">輸入任意盤面，分析難度與解法</p>
      </button>
    </section>
  </main>
</template>
