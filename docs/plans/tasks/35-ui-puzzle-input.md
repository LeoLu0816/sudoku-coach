---
id: 35-ui-puzzle-input
phase: P4
status: todo
depends_on: [12-serializer, 30-ui-board, 40-store-game, 21-solver-orchestrator]
assignee: null
estimated_complexity: M
acceptance:
  - "分析模式 (/analyze) 可運作"
  - "支援貼上 81 字串或手動點擊輸入"
  - "分析結果顯示難度 + 完整解題步驟"
  - "可從分析結果一鍵進入觀摩模式"
  - "整合測試：輸入題目並取得分析"
deliverables:
  - "src/ui/PuzzleInputPanel.vue"
  - "src/ui/PuzzleInputPanel.test.ts"
  - "src/stores/analyze.ts"
  - "src/views/AnalyzeView.vue"
  - "tests/integration/analyze-flow.test.ts"
---

# 35 — 分析模式（玩家輸入盤面）

## 目標
玩家可以：
1. 貼上 81 字串
2. 用棋盤手動點擊輸入
3. 按「分析」→ 系統判定難度、完整解題步驟，可進入觀摩

## 範圍

### A. PuzzleInputPanel.vue
布局上半：
- Textarea 給玩家貼 81 字串（或 9 行）
- 「載入」按鈕：呼 12-serializer.parseBoardString，錯誤則顯示明確訊息
- 「清空」「載入範例」「分析」按鈕

布局下半：互動式 board（重用 SudokuBoard，給定 input mode prop）

emit:
- `analyze(board)`：使用者按分析按鈕

### B. AnalyzeStore
```ts
interface AnalyzeState {
  inputBoard: Board | null;
  result: {
    isUnique: boolean;
    difficulty: Difficulty | null;
    solveResult: SolveResult | null;
    error?: string;
  } | null;
}

actions:
  analyze(board: Board): void
```

#### analyze 邏輯
1. 用 backtrack `countSolutions(board, 2)` 檢查唯一性
   - 0 解：error = '此盤面無解'
   - >1 解：error = '此盤面非唯一解，無法分析'
   - 唯一解 → 繼續
2. 用 orchestrator.solveWithSteps 取得 steps
3. 看 techniqueUsage 最高技巧層 → 判定 difficulty
4. 若 `fallbackUsed=true` → difficulty='expert'（超出可解技巧範圍）

### C. AnalyzeView.vue
- 上：PuzzleInputPanel
- 下：分析結果區
  - 唯一性、難度、用到技巧分布
  - 「進入觀摩」按鈕（跳轉 /observe 並傳 puzzle / steps）

## 注意
- 觀摩跳轉：用 playback store 的 `loadPuzzle` 或新增 `loadFromSolveResult` 直接灌入 steps（避免重算）
- 此任務可能需擴充 playback store 一個 action（協調修改 plan 34）

## 測試
- input flow：貼字串 → load → board 正確
- analyze flow：含唯一/多解/無解三種情境
- integration：完整輸入 + 分析 + 跳觀摩

## 完工條件
- P4 整合驗收通過（見主 plan §九）
