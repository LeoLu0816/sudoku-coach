[10-board-core] 完工回報（由主 agent Claude Code 直接實作）

變更檔案：
  + src/core/board.ts
  + src/core/board.test.ts
  - src/core/.gitkeep

實作 API：
  - 轉換：indexToRowCol / rowColToIndex / indexToBox
  - 建立：createEmptyBoard / createBoardFromGiven / cloneBoard
  - 查詢：getCell / getRowCells / getColCells / getBoxCells / getUnitCells / getPeers / getEmptyCells / isComplete
  - 操作（immutable）：setCellValue / toggleCandidate / setCandidates / clearCell

測試結果：
  $ pnpm test src/core/board.test.ts → 20 passed / 0 failed
  $ pnpm typecheck                   → PASS
  $ pnpm lint                        → PASS

完工條件勾選：
  [x] Board 建立 / 複製 / 查詢 / 操作 API 完整
  [x] 所有操作不就地修改原 Board
  [x] test 全綠（20 tests）

一句話總結：棋盤資料結構與純函式 API 完成，所有操作 immutable。
