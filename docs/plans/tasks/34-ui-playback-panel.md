---
id: 34-ui-playback-panel
phase: P3
status: todo
depends_on: [21-solver-orchestrator, 33-ui-hint-overlay, 30-ui-board]
assignee: null
estimated_complexity: L
acceptance:
  - "觀摩模式 (/observe) 可運作"
  - "支援手動逐步 + 自動播放（可調速）"
  - "步驟列表可點擊跳轉"
  - "每步顯示技巧名 + 高亮 + 中文說明"
  - "整合測試：完整觀摩一題簡單題"
deliverables:
  - "src/ui/PlaybackPanel.vue"
  - "src/ui/PlaybackPanel.test.ts"
  - "src/stores/playback.ts"
  - "src/stores/playback.test.ts"
  - "src/views/ObserveView.vue"
  - "tests/integration/observe-flow.test.ts"
---

# 34 — 觀摩模式 UI + Store

## 目標
完整觀摩模式：玩家選一題（或用當前盤面）→ 系統呼 orchestrator 一次解完取得完整 steps → 提供逐步 / 自動播放 / 跳轉。

## 範圍

### A. PlaybackStore
```ts
interface PlaybackState {
  puzzle: Puzzle | null;
  steps: TechniqueStep[];
  currentStepIndex: number;     // -1 表示初始盤面（尚未套用任何 step）
  intermediateBoards: Board[];  // length = steps.length + 1（步驟 N 後的盤面）
  autoPlaying: boolean;
  speed: 'slow' | 'normal' | 'fast';
}

actions:
  loadPuzzle(puzzle: Puzzle): void   // 內部呼 orchestrator 預先算完所有 steps
  next(): void
  prev(): void
  jumpTo(index: number): void
  play(): void
  pause(): void
  setSpeed(s): void
```

speed 對應 ms：slow=2000、normal=1000、fast=400

### B. PlaybackPanel.vue
- 步驟列表（左側或下方）：每列顯示「第 N 步 — 技巧名」，當前步驟高亮，可點擊跳
- 控制列：上一步 / 下一步 / 播放-暫停 / 速度切換
- 當前步驟說明面板（重用或不重用 HintOverlay 內容呈現）

### C. ObserveView.vue
布局：
```
┌──────────────┬─────────┐
│ SudokuBoard  │ Steps   │
│  + hint高亮  │ List    │
├──────────────┴─────────┤
│ PlaybackPanel controls │
└────────────────────────┘
```

## 整合
- View mounted → playbackStore.loadPuzzle(目前 puzzle)
- 切換步驟 → board = intermediateBoards[currentStepIndex + 1]，傳給 SudokuBoard
- 當前 step → 傳 step.targets/related 給 board 做高亮
- 自動播放：setInterval(speed) 呼 next()，到末步停

## 測試
- store unit test：load → steps 計算正確、jump/next/prev 正確、play 自動推進
- view integration test：完整跑完一個簡單題目，最後盤面 = solution

## 完工條件
- 觀摩模式 P3 整合驗收項通過（見主 plan §九）
