[40-store-game] 完工回報（claude-code）

變更檔案：
  + src/stores/game.ts
  + src/stores/game.test.ts

API:
  state: puzzle / board / selectedIndex / pencilMode / autoCandidates / history / future / currentHint
  getters: conflicts / isSolved / canUndo / canRedo / remainingCounts
  actions: newGame / loadPuzzle / selectCell / inputNumber / clearCell / undo / redo /
           togglePencil / toggleAutoCandidates / requestHint / applyHint / clearHint

設計重點：
  - 給定格（isGiven=true）不可修改
  - 每次改動推入 history、清空 future
  - autoCandidates=true 時改動後自動 recompute
  - applyHint 後 currentHint 自動清空

測試: 11 passed
一句話總結：Pinia 遊戲 store 完成。
