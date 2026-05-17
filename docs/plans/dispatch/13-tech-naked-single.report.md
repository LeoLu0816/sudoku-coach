[13-tech-naked-single] 完工回報（claude-code）

變更檔案：
  + src/techniques/nakedSingle.ts
  + src/techniques/nakedSingle.test.ts
  + src/techniques/testUtils.ts (共用測試工具：scenarioToBoard)

設計重點：
  - solver 不在 apply 內 recompute candidates，假設呼叫方（orchestrator）已預處理
  - testUtils.scenarioToBoard 處理 fixture 場景 → Board 的轉換邏輯

測試: 6 passed
一句話總結：Naked Single solver 完成；技巧 solver 統一介面確立。
