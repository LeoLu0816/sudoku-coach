---
task_id: 34a-playback-store
status: done
completed_at: 2026-05-17
---

# 34a PlaybackStore 完工報告

## 交付物

- `src/stores/playback.ts` — 匯出 `usePlaybackStore`（Setup Store 形式）
- `src/stores/playback.test.ts` — 27 項單元測試全過

## 驗收結果

| 項目 | 結果 |
|---|---|
| `pnpm typecheck` | 綠燈（無錯誤） |
| `pnpm test src/stores/playback.test.ts` | 27/27 通過 |

## 實作摘要

### Store 形式
採用 Setup Store（`defineStore('playback', () => { ... })`），便於將 `_intervalId` 存放在 closure 而不汙染 Pinia state。

### State
- `puzzle / steps / currentStepIndex / intermediateBoards / autoPlaying / speed` 均以 `ref` 宣告，符合 Setup Store 慣例。
- `intermediateBoards` 長度固定為 `steps.length + 1`（index 0 = 初始盤面）。

### loadPuzzle 邏輯
1. `createBoardFromGiven` + `recomputeAllCandidates` 建初始 board
2. `solveWithSteps` 取完整步驟（已含 backtrack fallback）
3. 迴圈用 `applyStep` + `recomputeAllCandidates` 逐步產生 `intermediateBoards`

注意：`applyStep` 在 `orchestrator.ts` 第 153 行已有 `export { applyStep }`，可直接 import，無需在 store 內複製邏輯。

### Interval 管理
- `_intervalId` 存於 closure，不暴露給外部
- `play()` 呼叫 `_startInterval()`，先 `_clearInterval()` 確保不重疊
- `setSpeed()` 若正在播放，`_clearInterval()` 後以新速度重啟
- 到末步時在 interval callback 內呼叫 `pause()` 自動停止

### 速度對應
| speed | ms |
|---|---|
| slow | 2000 |
| normal | 1000 |
| fast | 400 |

## 測試覆蓋項目

- loadPuzzle：steps.length > 0、intermediateBoards 長度、最後盤面 = solution
- 初始 currentStepIndex = -1、autoPlaying = false
- next()：遞增、末步不 overflow
- prev()：遞減、-1 不再往前
- jumpTo：正確跳轉、超上界 clamp、低於下界 clamp
- currentBoard / currentStep / isAtStart / isAtEnd getter 正確
- play()：autoPlaying = true、normal/fast 速度下 interval 推進
- pause()：autoPlaying = false
- play() 到末步自動 pause（vi.useFakeTimers 驗證）
- setSpeed：更新 speed 值、播放中切換速度重啟 interval
