[01-shared-types] 完工回報

變更檔案：
  + src/types/board.ts
  + src/types/technique.ts
  + src/types/puzzle.ts
  + src/types/index.ts
  + src/__tests__/types.test.ts
  - src/types/.gitkeep  (移除，已有實際檔案)

匯出符號清單（從 index.ts 抓）：
  - CellValue, Candidates, CellIndex, Cell, Board, UnitType, Conflict
  - TechniqueId, TechniqueMeta, TechniqueStep, TechniqueSolver
  - Difficulty, Puzzle, SolveResult

測試結果：
  $ pnpm typecheck    → PASS
  $ pnpm test         → 7 passed / 0 failed
  $ pnpm lint         → PASS

完工條件勾選：
  [x] src/types/*.ts 全部建立
  [x] 型別規格與 prompt 一致
  [x] 繁中註解齊備
  [x] types.test.ts 含至少 5 個測試
  [x] pnpm typecheck / test / lint 全綠
  [x] 未動既有檔案

一句話總結：建立 13 個共用型別，後續所有任務的介面合約已就緒。

（若有任何偏離規格 / 卡關 / 需要主 agent 決策，列在這裡）
