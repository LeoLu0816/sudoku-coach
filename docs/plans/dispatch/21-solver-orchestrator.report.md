[21-solver-orchestrator] 完工回報（claude-code）

變更檔案：
  + src/solver/orchestrator.ts
  + src/solver/orchestrator.test.ts

API: solveWithSteps / nextHintStep / getRegisteredTechniques / applyStep

設計重點：
  - 註冊清單模式：P1 階段含 naked-single + hidden-single；後續任務 push 新 solver 即可
  - 每輪：recompute candidates → 試每個技巧 → 找到就套用 → 回頭再試（同優先順序）
  - 技巧全部失效 → fallback 到 backtrack（fallbackUsed=true）
  - 1000 次迭代上限保護（避免邏輯錯誤造成無限迴圈）
  - applyStep 支援 'place' 與 'eliminate' 兩種 action

測試: 6 passed（全 20 fixture 題目皆能解開，含 fallback）
一句話總結：解題編排器完成，技巧層 + backtrack fallback 雙保險。
