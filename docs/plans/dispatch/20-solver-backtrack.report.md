[20-solver-backtrack] 完工回報（claude-code）

變更檔案：
  + src/solver/backtrack.ts
  + src/solver/backtrack.test.ts

API: solve / countSolutions / 內部 hasInitialConflicts

設計重點：
  - DFS + MRV (Minimum Remaining Values) 啟發式
  - 預先計算 PEER_INDICES 表（module-level，所有解題共用）
  - **重要**：在 search 前用 hasInitialConflicts 預檢輸入；對含衝突的盤面直接回 null / 0（否則 search 可能對非法盤面探索過大空間）
  - 測試環境用 `// @vitest-environment node`（純邏輯不需 jsdom）

效能：
  - 簡單題 < 10ms
  - 專家題 < 10ms
  - 20 題完整 solve + countSolutions × 20 < 50ms

測試: 7 passed
一句話總結：DFS 回溯 solver 完成，含衝突預檢，全 20 題 < 50ms。
