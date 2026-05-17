import { createRouter, createWebHashHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

/**
 * 應用路由表
 * /        → HomeView（入口）
 * /play    → PlayView（P2 遊戲模式 MVP）
 * /observe → ObserveView（P3 觀摩模式佔位）
 * /analyze → AnalyzeView（P4 分析模式佔位）
 */
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/HomeView.vue'),
  },
  {
    path: '/play',
    name: 'play',
    component: () => import('@/views/PlayView.vue'),
  },
  {
    path: '/observe',
    name: 'observe',
    component: () => import('@/views/ObserveView.vue'),
  },
  {
    path: '/analyze',
    name: 'analyze',
    component: () => import('@/views/AnalyzeView.vue'),
  },
]

/** 建立 router 實例（main.ts 使用） */
export function createAppRouter() {
  return createRouter({
    // 採 hash 模式（/#/play），相容 GitHub Pages 靜態託管（免設 404.html fallback）
    history: createWebHashHistory(),
    routes,
  })
}

export default createAppRouter()
