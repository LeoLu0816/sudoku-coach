[15-tech-naked-pair] 完工回報
變更檔案：
  - src/techniques/nakedPair.ts
  - src/techniques/nakedPair.test.ts
測試結果：
  $ pnpm typecheck → PASS
  $ pnpm test src/techniques/nakedPair.test.ts → 9 passed
完工條件勾選：
  [x] 實作 TechniqueSolver 介面
  [x] fixture naked-pair-01/02/03 通過
  [x] row/col/box 三 unit 偵測
  [ ] orchestrator 註冊 ← 主 agent 處理，故 subagent 不打勾
一句話總結：nakedPairSolver 實作完成，三種 unit（row/col/box）皆可偵測裸對並正確輸出 eliminations，9 項測試全綠。
