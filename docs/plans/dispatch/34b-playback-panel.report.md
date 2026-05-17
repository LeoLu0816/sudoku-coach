---
task: 34b-playback-panel
status: done
completed_at: 2026-05-17
---

# 34b PlaybackPanel.vue — 完工回報

## 產出檔案
- `src/ui/PlaybackPanel.vue`
- `src/ui/PlaybackPanel.test.ts`

## 驗收結果
- `pnpm typecheck` → 綠燈
- `pnpm test src/ui/PlaybackPanel.test.ts` → 17/17 通過

## 實作摘要

### PlaybackPanel.vue
- 純 prop-driven 元件，Props: `steps / currentStepIndex / autoPlaying / speed`
- Emits: `prev / next / play / pause / jumpTo(index) / setSpeed(s)`
- 步驟列表（`.step-list`）：`v-for` 渲染，每列 `data-testid="step-N"`，顯示「第 N+1 步 — 技巧中文名」；`currentStepIndex===N` 時加 `.is-current`；點擊 emit `jumpTo(N)`
- 控制列（`.playback-controls`）：
  - `btn-prev`：`currentStepIndex <= -1` → disabled
  - `btn-next`：`currentStepIndex >= steps.length - 1` → disabled
  - `btn-play-pause`：依 `autoPlaying` 顯示「播放」/「暫停」，emit `play` / `pause`
  - `speed-select`：`<select>` 三選一（slow/normal/fast），`@change` emit `setSpeed`
- 技巧 ID → 中文名 map 與 HintOverlay.vue 一致

### PlaybackPanel.test.ts
共 17 個測試案例，覆蓋：
1. 步驟列表渲染數量
2. 顯示格式（第 N+1 步 — 技巧中文名）
3. `.is-current` 高亮
4. 點擊步驟 emit jumpTo
5. prev / next emit
6. prev disabled（currentStepIndex=-1）
7. prev enabled（currentStepIndex=0）
8. next disabled（末步）
9. next enabled（非末步）
10. autoPlaying=false → 顯示「播放」，emit play
11. autoPlaying=true → 顯示「暫停」，emit pause
12. speed-select 切換 slow → emit setSpeed("slow")
13. speed-select 切換 fast → emit setSpeed("fast")
14. speed prop=fast → select 預設值為 fast
