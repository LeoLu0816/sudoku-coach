---
id: 02-test-fixtures
phase: P0
status: done
depends_on: [01-shared-types]
assignee: cursor-gpt
completed_at: 2026-05-17
estimated_complexity: S
acceptance:
  - "fixtures 涵蓋每個技巧至少 3 個專屬題例"
  - "每難度 5 題完整可解題目（含解答）"
  - "提供 helper 函式：載入 fixture by id"
deliverables:
  - "src/fixtures/puzzles.ts"
  - "src/fixtures/techniqueScenarios.ts"
  - "src/fixtures/index.ts"
  - "src/__tests__/fixtures.test.ts"
---

# 02 — 測試題目集

## 目標
集中管理所有測試用題目，避免每個子任務各自寫 fixture，造成重複與不一致。

## 內容

### A. 完整題目集 `puzzles.ts`
每難度至少 5 題（共 20 題），含已知唯一解。

```ts
export interface FixturePuzzle {
  id: string;
  difficulty: Difficulty;
  given: string;     // 81 字元字串（'.' 或 0 = 空，其他為 1-9）
  solution: string;  // 81 字元字串（全填）
  /** 預期解此題會用到的技巧 ID（升冪） */
  expectedTechniques: TechniqueId[];
}

export const fixturePuzzles: FixturePuzzle[] = [
  // easy-01 ... easy-05
  // medium-01 ... medium-05
  // hard-01 ... hard-05
  // expert-01 ... expert-05
];
```

### B. 技巧專屬場景 `techniqueScenarios.ts`
每個技巧至少 3 個「最小場景」，用來單元測試該技巧 solver：

```ts
export interface TechniqueScenario {
  id: string;                    // 如 'naked-single-01'
  technique: TechniqueId;
  given: string;                 // 含部分候選的盤面
  /** 預期該技巧的下一步輸出 */
  expectedStep: {
    targets: number[];
    action: 'place' | 'eliminate';
    placements?: { index: number; value: number }[];
    eliminations?: { index: number; values: number[] }[];
  };
}

export const techniqueScenarios: TechniqueScenario[] = [...]
```

涵蓋技巧（每技巧 ≥ 3 題）：
- naked-single
- hidden-single
- naked-pair
- hidden-pair
- naked-triple
- pointing-pair
- box-line-reduction

### C. Helper `index.ts`

```ts
export function getPuzzle(id: string): FixturePuzzle | undefined;
export function getScenariosFor(technique: TechniqueId): TechniqueScenario[];
export function getPuzzlesByDifficulty(d: Difficulty): FixturePuzzle[];
```

## 來源
- 簡單 / 中等：可用經典出版題（網路公開題庫如 sudokuwiki）
- 技巧場景：sudokuwiki.org/Sudoku_Solving_Techniques 上的範例
- 困難 / 專家：手動驗證（用 backtrack 確認唯一解）

## 測試項目
`src/__tests__/fixtures.test.ts`：
- 每題 `given.length === 81`、`solution.length === 81`
- `solution` 是合法完整解（行/列/宮各 1-9 各一次）
- `solution` 與 `given` 相容（非空格 cell 值一致）
- 每個技巧場景的 `expectedStep` 結構正確

## 完工條件
- 上述測試全綠
- fixture 數量達標
