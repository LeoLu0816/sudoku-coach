[16-tech-hidden-pair] 完工回報（claude-code）

變更檔案：
  + src/techniques/hiddenPair.ts
  + src/techniques/hiddenPair.test.ts

設計重點：
  - 對 row → col → box 三類 unit 各 9 個 unit 依序檢查
  - 對數字組合 (a, b)（a < b），找候選含 a 的空格集合 S_a 與含 b 的空格集合 S_b
  - 若 S_a === S_b 且大小 === 2，且兩格有除 a, b 外的候選 → 產生 eliminate step
  - targets 為那兩格，related 為 unit 其他空格，eliminations 為各格多餘候選
  - 測試涵蓋三個 fixture（列 / 欄 / 宮）、explanation 語言標記驗證、空盤與已解完盤面回 null

測試: 9 passed
typecheck: 0 errors
一句話總結：Hidden Pair solver 完成，fixture hidden-pair-01/02/03 全通過。
