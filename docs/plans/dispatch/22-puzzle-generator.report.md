[22-puzzle-generator] 完工回報（claude-code）

變更檔案：
  + src/generator/puzzleGenerator.ts
  + src/generator/puzzleGenerator.test.ts

API: generatePuzzle(opts: GenerateOptions): Puzzle

設計重點：
  - Step 1: 用 fixturePuzzles 的 easy seed 解作為基準完整解，套用「數字重映射 + 隨機轉置 + 隨機 180 旋轉」生成同構解
  - Step 2: 隨機順序挖洞，每挖一個檢查 countSolutions(_, 2)===1 確保唯一解
  - Step 3: 用 orchestrator 判定難度（easy / medium / hard-or-expert）；若不符目標還原
  - mulberry32 seedable RNG → 同 seed 可重現
  - timeout 保護 + fixture fallback（避免無法生成時 throw）

P1 階段限制：
  - hard / expert 採「需要 fallback」作為近似條件（P1 階段尚無中階技巧區分）
  - P3 加入中階技巧後可進一步細分

效能：
  - 7 tests / 369ms（含 4 個難度生成 + deterministic 驗證）

測試: 7 passed
一句話總結：題目生成器完成，4 難度皆可生成，deterministic seed 支援。
