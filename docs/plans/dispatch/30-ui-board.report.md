[30-ui-board] 完工回報

變更檔案：
  - src/ui/SudokuBoard.vue
  - src/ui/SudokuBoard.test.ts

測試結果：
  $ pnpm typecheck → PASS
  $ pnpm test src/ui/SudokuBoard.test.ts → 12 passed

完工條件勾選：
  [x] 9x9 棋盤渲染（81 個 .cell，CSS Grid 9x9）
  [x] 點擊選格 emit（emit('selectCell', index)）
  [x] 衝突顯示（conflicts prop → .is-conflict）
  [x] 候選數顯示（showCandidates=true → 3x3 微網格 .candidates-grid）
  [x] 同行列宮 + 同值高亮（.is-peer / .is-same-value）
  [x] hintHighlight 支援（targets → .is-hint-target、related → .is-hint-related）
  [x] 元件測試通過（12/12）

一句話總結：純 prop-driven 9x9 棋盤元件，含選格高亮、peer/同值/衝突/提示高亮、候選數微網格、鍵盤事件轉發，全測試綠燈。
