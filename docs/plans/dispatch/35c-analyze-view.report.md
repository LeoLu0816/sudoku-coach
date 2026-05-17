[35c-analyze-view] 完工回報（任務 35 第三部分：整合）

變更檔案：
  - src/views/AnalyzeView.vue（改寫：從佔位頁變為完整分析 view）
  - tests/integration/analyze-flow.test.ts（新增）

測試結果：
  $ pnpm typecheck → PASS
  $ pnpm test → 29 files / 406 passed（含 analyze-flow 6/6）
  $ pnpm build → PASS

完工條件勾選（對應 35 task acceptance）：
  [x] 分析模式 /analyze 可運作
  [x] 支援貼上 81 字串（PuzzleInputPanel）或手動點擊輸入
  [x] 分析結果顯示難度 + 解題步驟總數 + 技巧使用分布
  [x] 可從分析結果一鍵進入觀摩模式（自組 Puzzle 灌入 playback 後 router.push /observe）
  [x] 整合測試含唯一解 / 多解 / 無解三情境 + 進入觀摩跳轉

實作決策備註：
- 「進入觀摩」採重灌策略：用 solveResult.finalBoard 抽 solution 組 Puzzle 灌入 playback store（playback 會再 solveWithSteps 一次，但 easy 量級下成本極低）；未擴充 playback store 的 loadFromSolveResult，保持 stores 邊界清晰
- 載入範例直接用 fixture easy-01（避免測試環境依賴生成器）
- AnalyzeView mount 時 board 為 null，PuzzleInputPanel 內會自建空 board 顯示，玩家點格就會 emit update:board
- 路由跳轉測試需用 flushPromises 等 router.push Promise 完成（nextTick 不夠）
