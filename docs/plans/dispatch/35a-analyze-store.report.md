[35a-analyze-store] 完工回報（claude-code）

變更檔案：
  + src/stores/analyze.ts
  + src/stores/analyze.test.ts

API: useAnalyzeStore（setInputBoard / analyze / clear）+ determineDifficulty（export helper）

AnalyzeResult 結構：
  - isUnique: boolean
  - difficulty: Difficulty | null
  - solveResult: SolveResult | null
  - error?: string

analyze 邏輯：
  1. countSolutions(board, 2) 判斷解數
  2. 0 解 → error='此盤面無解'
  3. ≥2 解 → error='此盤面非唯一解，無法分析'
  4. 唯一解 → solveWithSteps 取步驟 → determineDifficulty 判定等級

determineDifficulty 規則（優先序高到低）：
  - fallbackUsed=true → expert
  - box-line-reduction / pointing-pair / naked-triple 任一 → expert
  - naked-pair / hidden-pair 任一 → hard
  - hidden-single → medium
  - 否則 → easy

測試: 18 passed（determineDifficulty 單元 9 項 + store 行為 9 項）
typecheck: 通過
