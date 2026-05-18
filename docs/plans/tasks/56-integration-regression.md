---
id: 56-integration-regression
phase: P5
status: todo
depends_on: [50-contract-and-uniqueness, 51-tech-hidden-triple, 52-tech-naked-quad, 53-tech-x-wing, 54-tech-swordfish, 55-tech-xy-wing]
assignee: claude-code（主 agent 親自）
estimated_complexity: M
acceptance:
  - "orchestrator.ts 的 registeredTechniques 依以下順序註冊 Tier 1 高階技巧（在 box-line-reduction 之後、backtrack fallback 之前）"
  - "  1. hiddenTripleSolver  2. nakedQuadSolver  3. xWingSolver  4. swordfishSolver  5. xyWingSolver"
  - "user-puzzle-regression.test.ts 改寫：期望 result.fallbackUsed === false、result.outOfTechniqueScope === false，記錄哪個高階技巧首次破題（log techniqueUsage）"
  - "保留 naked-pair-regression.test.ts 既有期望不破壞"
  - "新增 src/solver/orchestrator-tier1.test.ts，跑 user-puzzle 並 assert：(a) 解出 (b) techniqueUsage 中至少一個 Tier 1 技巧 ≥ 1 次 (c) fallbackUsed=false"
  - "pnpm typecheck + pnpm test 全綠"
  - "若 user-puzzle 即使加完 Tier 1 仍 fallback：本任務改為 BLOCKED，回到主 plan 觸發 5B"
deliverables:
  - "src/solver/orchestrator.ts（註冊 Tier 1 五個技巧）"
  - "src/__tests__/user-puzzle-regression.test.ts（改寫期望）"
  - "src/solver/orchestrator-tier1.test.ts（新增）"
---

# 56 — Tier 1 整合 + user-puzzle 回歸

## 為什麼是主 agent 任務
- 動 orchestrator 註冊清單與既有 regression test，屬於跨任務整合
- 結果驅動 5B/5C 決策：Tier 1 不夠 → 開 5B

## 註冊順序

`src/solver/orchestrator.ts` 的 `registeredTechniques`：

```ts
const registeredTechniques: TechniqueSolver[] = [
  nakedSingleSolver,
  hiddenSingleSolver,
  nakedPairSolver,
  hiddenPairSolver,
  nakedTripleSolver,
  pointingPairSolver,
  boxLineReductionSolver,
  // Tier 1 高階
  hiddenTripleSolver,
  nakedQuadSolver,
  xWingSolver,
  swordfishSolver,
  xyWingSolver,
]
```

順序原則：低階優先（找到就用，不浪費高階推理）；高階間以「常用度 / 易理解度」排序，hidden-triple/naked-quad 是 pair/triple 的延伸，先；fish 系列其次；XY-Wing 最後（最像鏈式推理）。

## user-puzzle-regression.test.ts 改寫

原期望（用 backtrack）需改為期望純技巧解：

```ts
it('user-puzzle 應由 Tier 1 高階技巧解出，無需 fallback', () => {
  const board = recomputeAllCandidates(parseBoardString(USER_PUZZLE_GIVEN))
  const result = solveWithSteps(board)
  expect(result.solved).toBe(true)
  expect(result.fallbackUsed).toBe(false)
  expect(result.outOfTechniqueScope).toBe(false)
  expect(isSolved(result.finalBoard)).toBe(true)

  // 記錄 Tier 1 使用統計（debug 用，不 assert 具體技巧；只 assert 至少一個 Tier 1 被用過）
  const tier1Ids: TechniqueId[] = [
    'hidden-triple', 'naked-quad', 'x-wing', 'swordfish', 'xy-wing'
  ]
  const tier1Used = tier1Ids.some((id) => (result.techniqueUsage[id] ?? 0) > 0)
  expect(tier1Used).toBe(true)

  // backtrack 不應被計入步驟
  expect(result.steps.find((s) => s.technique === 'backtrack')).toBeUndefined()
})

it('觀摩模式 loadPuzzle 後最後一步應已完成', () => { /* 同既有 */ })
```

原「backtrack steps 應 > 0」case 刪除（與新期望矛盾）。

## 新增 orchestrator-tier1.test.ts

驗證 Tier 1 技巧正確被 orchestrator 串接、且 hint 流程能輸出高階技巧推薦：

```ts
// 1. 用 user-puzzle 跑到中段，呼叫 nextHintStep，期望回傳 Tier 1 技巧 step
// 2. 用 fixture 中含 X-Wing 必要場景的盤面（inline 構建），verify Tier 1 被優先使用
```

## 失敗路徑（Tier 1 不足）

若改寫測試後 `tier1Used` 為 false 或 `fallbackUsed` 為 true：
1. 主 agent 不強行 pass 測試（嚴禁 skip / `expect.soft`）
2. 跑分析：哪一格被卡住？需要什麼結構？
3. 在 master plan 5B 段展開合適技巧（Skyscraper / Coloring / URec），把本任務 status 改 BLOCKED
4. 待 5B 完工後再回頭驗收 T56

## 完工
- `pnpm test` 全綠（含改寫後的 user-puzzle-regression）
- commit message：`feat(solver): 註冊 Tier 1 高階技巧 + user-puzzle 改用技巧解 [56-integration-regression]`
