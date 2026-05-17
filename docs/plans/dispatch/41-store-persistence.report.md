[41-store-persistence] 完工回報（claude-code）

變更檔案：
  + src/stores/persistence.ts
  + src/stores/persistence.test.ts

API: saveProgress / loadProgress / clearProgress / installPersistence

設計重點：
  - localStorage key: 'sudoku.progress.v1'（含版本，schema 變更易處理）
  - board 用 toJSON / fromJSON 序列化（保留候選數）
  - installPersistence 訂閱 game store 改動，500ms debounce 後存
  - 所有 localStorage 操作 try/catch，隱私模式靜默失敗

測試: 4 passed
一句話總結：進度持久化完成，500ms debounce 寫入。
