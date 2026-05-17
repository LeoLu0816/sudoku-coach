import { fileURLToPath, URL } from 'node:url'

import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

// GitHub Pages 部署在 https://<user>.github.io/sudoku-coach/，
// production build 需要對應的 base path；dev / test 保持 '/'。
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/sudoku-coach/' : '/',
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
}))
