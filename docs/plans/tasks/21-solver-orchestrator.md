---
id: 21-solver-orchestrator
phase: P1
status: todo
depends_on: [13-tech-naked-single, 14-tech-hidden-single, 20-solver-backtrack]
assignee: null
estimated_complexity: M
acceptance:
  - "可串接技巧 solver，產出完整 SolveResult"
  - "技巧優先順序符合難度梯度"
  - "技巧解不開時 fallback 到 backtrack 並標記"
  - "提供 nextHintStep(board) 給遊戲模式提示按鈕用"
deliverables:
  - "src/solver/orchestrator.ts"
  - "src/solver/orchestrator.test.ts"
---

# 21 — 解題編排器

## 目標
整合所有技巧 solver，模擬人類解題流程：由易到難套用技巧，全部技巧用完仍未解時 fallback 到 backtrack。

## API

```ts
/** 完整解題：回傳 SolveResult（含每步技巧） */
solveWithSteps(board: Board): SolveResult;

/** 給遊戲模式提示按鈕用：找下一步推薦 */
nextHintStep(board: Board): TechniqueStep | null;

/** 取得所有註冊技巧（依優先順序） */
getRegisteredTechniques(): TechniqueSolver[];
```

## 技巧優先順序（依難度低 → 高）
1. naked-single
2. hidden-single
3. naked-pair
4. hidden-pair
5. pointing-pair
6. box-line-reduction
7. naked-triple

> 此順序也決定難度分級的「最高技巧」門檻。

## 演算法

```
function solveWithSteps(board):
  current = recomputeAllCandidates(board)
  steps = []
  while !isSolved(current):
    found = null
    for tech of techniques (按優先順序):
      step = tech.apply(current)
      if step:
        found = step
        break
    if !found:
      // 技巧層全部失效，fallback
      finalBoard = backtrack.solve(current)
      if finalBoard:
        return { solved: true, finalBoard, steps, fallbackUsed: true, ... }
      return { solved: false, finalBoard: current, steps, fallbackUsed: true, ... }
    current = applyStep(current, found)
    steps.push(found)
  return { solved: true, finalBoard: current, steps, fallbackUsed: false, ... }
```

## 技巧註冊機制
- orchestrator 內部維護一個 `TechniqueSolver[]`
- P1 階段只註冊 naked-single + hidden-single（其他 P3 才補）
- 後續 phase 加技巧時，只需 import + push 到註冊清單，不影響既有 API

## applyStep helper
依 step.action 套用：
- `place`：對 placements 中每筆 `setCellValue` + `recomputeAllCandidates`
- `eliminate`：對 eliminations 移除候選

## 測試項目
- 解 fixture 中所有簡單題：`solved=true`、`fallbackUsed=false`、steps 序列合理
- 中等題（P1 階段只有 single）：可能 fallback → 確認 flag
- 完成的盤 → steps=[], solved=true
- `nextHintStep` 對給定盤回傳第一個可套用 step
- `nextHintStep` 對已解盤 → null

## 完工條件
- `pnpm test` 全綠
