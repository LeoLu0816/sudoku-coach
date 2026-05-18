---
id: 50-contract-and-uniqueness
phase: P5
status: todo
depends_on: [01-shared-types]
assignee: claude-code（主 agent 親自）
estimated_complexity: S
acceptance:
  - "TechniqueId union 加入 5 個 Tier 1 高階技巧 ID（hidden-triple / naked-quad / x-wing / swordfish / xy-wing）"
  - "Difficulty union 加入 'master'"
  - "SolveResult 加入 outOfTechniqueScope: boolean（fallback 觸發時為 true）"
  - "orchestrator.ts 在 fallback 分支回傳時設 outOfTechniqueScope=true，技巧解出時設 false"
  - "新增 src/__tests__/user-puzzle-uniqueness.test.ts，用 backtrack 列舉證實 user-puzzle 為唯一解"
  - "現有 user-puzzle-regression.test.ts、其他既有測試仍全綠（型別變更不破壞既有）"
  - "pnpm typecheck + pnpm test 全綠"
deliverables:
  - "src/types/technique.ts（更新 TechniqueId）"
  - "src/types/puzzle.ts（更新 Difficulty + SolveResult）"
  - "src/solver/orchestrator.ts（補 outOfTechniqueScope 設值）"
  - "src/__tests__/user-puzzle-uniqueness.test.ts（新增）"
---

# 50 — 契約異動 + user-puzzle 唯一性驗證

## 為什麼這是主 agent 任務
- 動 `src/types/`（合約檔）— 子任務不可改
- 影響後續所有 Tier 1 技巧（T51-T55）與整合（T56）
- 屬於 6-B「共享契約異動規則」流程

## TechniqueId 異動

`src/types/technique.ts`：

```ts
export type TechniqueId =
  | 'naked-single'
  | 'hidden-single'
  | 'naked-pair'
  | 'hidden-pair'
  | 'naked-triple'
  | 'pointing-pair'
  | 'box-line-reduction'
  // Tier 1 高階
  | 'hidden-triple'
  | 'naked-quad'
  | 'x-wing'
  | 'swordfish'
  | 'xy-wing'
  | 'backtrack';
```

## Difficulty 異動

`src/types/puzzle.ts`：

```ts
export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert' | 'master';
```

> 注：T61（5C）會調整 generator 真的吐 master 難度；本任務只擴 union。期間生成器忽略 'master' 即可（或暫時 fallback 到 'expert' 行為），由 T61 收尾。

## SolveResult 異動

`src/types/puzzle.ts`：

```ts
export interface SolveResult {
  solved: boolean;
  finalBoard: Board;
  steps: TechniqueStep[];
  techniqueUsage: Partial<Record<TechniqueId, number>>;
  /** 若 solver 嘗試所有技巧後仍解不出，會 fallback 到 backtrack；此 flag 標記是否使用 fallback */
  fallbackUsed: boolean;
  /** 技巧層用盡 → fallback 才解出 → true。觀摩/分析 UI 應據此提示「此題超出技巧範圍」 */
  outOfTechniqueScope: boolean;
}
```

`src/solver/orchestrator.ts` 三個 return 點補欄位：
- 解出（迴圈內 `isSolved`）→ `outOfTechniqueScope: false`
- fallback 解出 → `outOfTechniqueScope: true`
- fallback 失敗 → `outOfTechniqueScope: true`
- 迭代上限保護觸發 → `outOfTechniqueScope: false`（理論不應發生，但語意上沒走過 fallback）

## 唯一性驗證測試（新增）

`src/__tests__/user-puzzle-uniqueness.test.ts`：

```ts
// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { parseBoardString } from '@/core/serializer'
import { recomputeAllCandidates } from '@/core/validator'
// 用 backtrack 計數兩解（找到第 2 個就停）
// 若 backtrack 不支援計數，於測試內 inline 寫一個 DFS counter（不污染 src/solver/backtrack.ts）

const USER_PUZZLE =
  '100800000054030000030006750070004020500003070810060000000000000709300800000609004'

describe('user puzzle uniqueness', () => {
  it('剛好有一個解（backtrack 找到第二解即失敗）', () => {
    const board = recomputeAllCandidates(parseBoardString(USER_PUZZLE))
    const solutions = countSolutions(board, 2) // upper bound 2
    expect(solutions).toBe(1)
  })
})
```

**實作要點**：`countSolutions(board, limit)` 在測試檔內 inline 寫一個簡易 DFS（找空格 → 試候選 → 遞迴），找到 `limit` 個解就提早返回。這保證測試快且不動 production code。

## 影響評估
- 受影響的已完成任務：所有用到 `TechniqueId` / `Difficulty` / `SolveResult` 的檔案。型別僅**擴增**不破壞既有 narrowing，因此不需重新驗收，跑一次 `pnpm test` 全綠即可。
- 若 narrowing（如 `switch (id) { case ... }` 沒 default）出現 TS 錯誤，主 agent 順手補 default branch（保持原行為）。

## 完工
- 跑 `pnpm typecheck` + `pnpm test` 全綠
- commit message：`feat(types): 擴充 TechniqueId/Difficulty + SolveResult.outOfTechniqueScope；新增 user-puzzle 唯一性驗證 [50-contract-and-uniqueness]`
