[14-tech-hidden-single] 完工回報（claude-code）

變更檔案：
  + src/techniques/hiddenSingle.ts
  + src/techniques/hiddenSingle.test.ts

設計重點：
  - 對 row → col → box 三類 unit 各 9 個 unit 依序檢查
  - 對每個數字 1-9 找候選含該值的空格；若僅 1 個 → hidden single
  - 測試採「驗證 step 為合法 hidden single」而非比對特定 target，因 fixture 中部分場景同時存在多個有效 hidden single

測試: 6 passed
一句話總結：Hidden Single solver 完成。
