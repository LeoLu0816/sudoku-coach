# [Cursor 子任務 — 02-test-fixtures]

> 此檔由主 agent（Claude Code）產出，供 Cursor 直接讀取執行。
> 完工後請依末尾「完工回報格式」寫入 `docs/plans/dispatch/02-test-fixtures.report.md`。

## 你的角色
你是專注的工程師，負責建立**集中管理的測試題目集與技巧場景**。後續所有解題技巧（13-19）、解題器（20-21）、生成器（22）、UI 整合測試都會使用這份 fixture。

> ⚠️ **資料正確性是這個任務的核心**：每題必須是「合法的標準數獨」+「唯一解」+「技巧場景與預期 step 對應」。寧可少幾題也要正確。

## 必讀脈絡
1. `docs/plans/tasks/02-test-fixtures.md` ← 本任務完整規格
2. `src/types/index.ts` ← 共享型別契約（**只讀**，不可修改）
3. `docs/plans/sudoku-master.md` § 三、§ 七 ← 功能範圍與通用規則

## 任務目標
在 `src/fixtures/` 建立完整題目資料 + helper 函式，供後續所有測試使用。

## 必須產出的檔案
- `src/fixtures/puzzles.ts` — 完整題目集（4 難度，每難度 ≥ 5 題）
- `src/fixtures/techniqueScenarios.ts` — 技巧專屬場景（7 種技巧，每種 ≥ 3 個場景）
- `src/fixtures/index.ts` — re-export + helper 函式
- `src/__tests__/fixtures.test.ts` — fixture 自我驗證測試

> 同時請刪除 `src/fixtures/.gitkeep`。

## 資料結構（必須完全照下列規格）

### `src/fixtures/puzzles.ts`

```ts
import type { Difficulty } from '@/types';
import type { TechniqueId } from '@/types';

/** 完整題目 fixture（用 81 字串便於閱讀與序列化） */
export interface FixturePuzzle {
  /** 唯一 ID（格式：'<difficulty>-NN'） */
  id: string;
  difficulty: Difficulty;
  /** 81 字元字串；'.' 或 '0' 表示空格，其他字元為 '1'-'9' */
  given: string;
  /** 81 字元字串；唯一解（全填，無 '.' 或 '0'） */
  solution: string;
  /** 預期解此題會用到的技巧 ID 清單（含 fallback；用於難度判定驗證） */
  expectedTechniques: TechniqueId[];
}

export const fixturePuzzles: FixturePuzzle[] = [
  // easy-01 ... easy-05  → expectedTechniques 只含 'naked-single'
  // medium-01 ... medium-05 → 含 'naked-single' + 'hidden-single'
  // hard-01 ... hard-05  → 加 'naked-pair' / 'hidden-pair' / 'pointing-pair'（任一即可）
  // expert-01 ... expert-05 → 加 'naked-triple' / 'box-line-reduction'
];
```

### `src/fixtures/techniqueScenarios.ts`

```ts
import type { TechniqueId } from '@/types';

/** 技巧場景輸入（部分候選盤面） */
export interface TechniqueScenarioGiven {
  /** 81 字元字串；'.' 或 '0' = 空 */
  given: string;
  /**
   * 可選：每格的候選數（length 81）；若該題需要明確指定候選才能展示技巧
   * 用字串表達該格候選，如 "138" 表示 {1,3,8}；空格用空字串 ""
   * 若整題不提供，則由消費端用 validator.recomputeAllCandidates 算
   */
  candidates?: string[];
}

/** 預期技巧步驟（簡化版，符合 TechniqueStep 子集） */
export interface TechniqueScenarioExpected {
  targets: number[];
  action: 'place' | 'eliminate';
  placements?: { index: number; value: number }[];
  eliminations?: { index: number; values: number[] }[];
}

/** 技巧場景：一個最小例證盤面 + 預期下一步 */
export interface TechniqueScenario {
  /** 唯一 ID（格式：'<technique-id>-NN'） */
  id: string;
  technique: TechniqueId;
  /** 場景說明（中文） */
  description: string;
  input: TechniqueScenarioGiven;
  expected: TechniqueScenarioExpected;
}

export const techniqueScenarios: TechniqueScenario[] = [
  // naked-single × 3
  // hidden-single × 3（涵蓋 row / col / box 三種 unit 各至少 1 個）
  // naked-pair × 3
  // hidden-pair × 3
  // naked-triple × 3
  // pointing-pair × 3
  // box-line-reduction × 3
];
```

### `src/fixtures/index.ts`

```ts
import type { Difficulty, TechniqueId } from '@/types';
import { fixturePuzzles, type FixturePuzzle } from './puzzles';
import { techniqueScenarios, type TechniqueScenario } from './techniqueScenarios';

export { fixturePuzzles, techniqueScenarios };
export type { FixturePuzzle, TechniqueScenario };

/** 依 ID 取單題 */
export function getPuzzle(id: string): FixturePuzzle | undefined { /* ... */ }

/** 依難度取所有題目 */
export function getPuzzlesByDifficulty(d: Difficulty): FixturePuzzle[] { /* ... */ }

/** 依技巧取所有場景 */
export function getScenariosFor(technique: TechniqueId): TechniqueScenario[] { /* ... */ }
```

## 資料來源指引

### 完整題目（每難度 5 題）
建議來源：
- **easy / medium**：經典簡單題（可從 sudokuwiki.org/Sudoku_Solving_Techniques 範例題改編）
- **hard / expert**：需手動或用工具驗證唯一解

**重要**：
- 每題 `given` 與 `solution` 都必須是 81 字元
- `solution` 必須是 `given` 的合法填滿（非空格 cell 值需一致）
- `solution` 必須無衝突（每 row/col/box 含 1-9 各一次）
- 每題必須是唯一解（這點先由你信任來源；fixtures.test.ts 會自動驗證解的合法性）

### 技巧場景（每技巧 3 個）
建議來源：sudokuwiki.org/Sudoku_Solving_Techniques 上每個技巧頁的範例

**生成原則**：
1. 取一個盤面（不需要是完整題目，**可以是只填了部分數字的局部狀態**）
2. 確認此盤面可套用該技巧（產生明確的 placement 或 elimination）
3. `expected` 寫出該技巧執行一次的結果

**Index 計算公式**（給 `targets` / `placements[].index` 等用）：
- `index = row * 9 + col`，row 與 col 都從 0 開始
- 例：R5C3（人類表示）= row=4, col=2 → index = 4*9 + 2 = 38

## 自我驗證測試 `src/__tests__/fixtures.test.ts`

**這是這個任務最重要的部分**，因為它要驗證資料本身的正確性：

```ts
import { describe, it, expect } from 'vitest';
import { fixturePuzzles, techniqueScenarios, getPuzzle, getPuzzlesByDifficulty, getScenariosFor } from '@/fixtures';

describe('fixturePuzzles', () => {
  it.each(fixturePuzzles)('$id: given/solution length === 81', (p) => {
    expect(p.given).toHaveLength(81);
    expect(p.solution).toHaveLength(81);
  });

  it.each(fixturePuzzles)('$id: given 與 solution 在已填格上一致', (p) => {
    for (let i = 0; i < 81; i++) {
      const givenChar = p.given[i];
      if (givenChar !== '.' && givenChar !== '0') {
        expect(p.solution[i]).toBe(givenChar);
      }
    }
  });

  it.each(fixturePuzzles)('$id: solution 全填且合法（每 row/col/box 含 1-9 各一次）', (p) => {
    // 驗證 solution 無 '.' 或 '0'
    expect(p.solution).not.toMatch(/[.0]/);

    // 驗證每 row/col/box
    const grid = p.solution.split('').map(Number);
    const checkUnit = (indices: number[]) => {
      const values = indices.map((i) => grid[i]).sort();
      expect(values).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    };
    for (let r = 0; r < 9; r++) checkUnit([...Array(9)].map((_, c) => r * 9 + c));
    for (let c = 0; c < 9; c++) checkUnit([...Array(9)].map((_, r) => r * 9 + c));
    for (let b = 0; b < 9; b++) {
      const br = Math.floor(b / 3) * 3, bc = (b % 3) * 3;
      checkUnit([...Array(9)].map((_, k) => (br + Math.floor(k / 3)) * 9 + (bc + (k % 3))));
    }
  });

  it('每個難度都有至少 5 題', () => {
    expect(getPuzzlesByDifficulty('easy').length).toBeGreaterThanOrEqual(5);
    expect(getPuzzlesByDifficulty('medium').length).toBeGreaterThanOrEqual(5);
    expect(getPuzzlesByDifficulty('hard').length).toBeGreaterThanOrEqual(5);
    expect(getPuzzlesByDifficulty('expert').length).toBeGreaterThanOrEqual(5);
  });

  it('id 全部唯一', () => {
    const ids = fixturePuzzles.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('techniqueScenarios', () => {
  it.each(techniqueScenarios)('$id: given length === 81', (s) => {
    expect(s.input.given).toHaveLength(81);
  });

  it.each(techniqueScenarios)('$id: expected 結構正確', (s) => {
    expect(s.expected.targets.length).toBeGreaterThan(0);
    if (s.expected.action === 'place') {
      expect(s.expected.placements).toBeDefined();
      expect(s.expected.placements!.length).toBeGreaterThan(0);
    } else {
      expect(s.expected.eliminations).toBeDefined();
      expect(s.expected.eliminations!.length).toBeGreaterThan(0);
    }
  });

  it('每個技巧都有至少 3 個場景', () => {
    const techniques: TechniqueId[] = [
      'naked-single', 'hidden-single',
      'naked-pair', 'hidden-pair', 'naked-triple',
      'pointing-pair', 'box-line-reduction',
    ];
    for (const t of techniques) {
      expect(getScenariosFor(t).length).toBeGreaterThanOrEqual(3);
    }
  });

  it('id 全部唯一', () => {
    const ids = techniqueScenarios.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('helpers', () => {
  it('getPuzzle 找得到', () => {
    const first = fixturePuzzles[0];
    expect(getPuzzle(first.id)).toEqual(first);
  });

  it('getPuzzle 找不到回 undefined', () => {
    expect(getPuzzle('nonexistent-99')).toBeUndefined();
  });
});
```

## 完工條件（驗收用）
- [ ] `src/fixtures/puzzles.ts`：4 難度 × ≥ 5 題 = ≥ 20 題
- [ ] `src/fixtures/techniqueScenarios.ts`：7 技巧 × ≥ 3 場景 = ≥ 21 場景
- [ ] `src/fixtures/index.ts`：提供三個 helper 函式
- [ ] `src/__tests__/fixtures.test.ts` 全部通過（含上方所有驗證）
- [ ] hidden-single 場景至少各包含 row / col / box 一個
- [ ] pointing-pair 場景至少包含「row 方向」與「col 方向」各一個
- [ ] box-line-reduction 場景至少包含「row→box」與「col→box」各一個
- [ ] `pnpm typecheck` / `pnpm test` / `pnpm lint` 全綠

## 規則（重要）
1. **不修改** `src/types/` 任何檔案
2. **不修改** `deliverables` 以外的任何檔案（不可動 `src/main.ts` 等）
3. **不安裝額外依賴**
4. 變數命名：camelCase、正向命名
5. 每個 helper function 寫繁中註解
6. 單檔超過 300 行請拆檔（puzzles.ts 與 techniqueScenarios.ts 預期會比較長，可接受到 500 行；超過再拆）
7. **直接在 main 分支開工**：不要建 worktree、不要開新分支、不要做隔離
8. **不要執行任何 git 操作**：不 `git add` / `git commit` / `git push` / 切換分支。commit 與 push 一律由主 agent（Claude Code）負責，你只寫檔案 + 寫 report

### 資料品質要求
- ⚠️ 寧可題數少，也不可放錯資料
- 若你不確定某個盤面的唯一解，**寧可先省略該題**，在 report 中註明「easy 只給了 X 題，請主 agent 決定是否需補」
- 若你不確定某個技巧場景的 expected step，**寧可先省略該場景**

## 完工回報格式
做完後請把以下內容**寫入** `docs/plans/dispatch/02-test-fixtures.report.md`：

```
[02-test-fixtures] 完工回報

變更檔案：
  + src/fixtures/puzzles.ts
  + src/fixtures/techniqueScenarios.ts
  + src/fixtures/index.ts
  + src/__tests__/fixtures.test.ts
  - src/fixtures/.gitkeep  (移除)

資料統計：
  完整題目：
    easy: X 題
    medium: X 題
    hard: X 題
    expert: X 題
    總計: X 題
  技巧場景：
    naked-single: X 個
    hidden-single: X 個 (row: X, col: X, box: X)
    naked-pair: X 個
    hidden-pair: X 個
    naked-triple: X 個
    pointing-pair: X 個 (row 方向: X, col 方向: X)
    box-line-reduction: X 個 (row→box: X, col→box: X)
    總計: X 個

資料來源（簡述）：
  完整題目: <例：自網路公開題庫 sudokuwiki / 自驗證 / 手動編寫>
  技巧場景: <例：基於 sudokuwiki.org 各技巧頁範例>

測試結果：
  $ pnpm typecheck    → PASS / FAIL
  $ pnpm test         → X passed / Y failed
  $ pnpm lint         → PASS / FAIL

完工條件勾選：
  [x] 每難度 ≥ 5 題
  [x] 每技巧 ≥ 3 場景
  [x] hidden-single 含 row/col/box 各一
  [x] pointing-pair 含 row/col 各一
  [x] box-line-reduction 含 row→box / col→box 各一
  [x] helper 函式完整
  [x] fixtures.test.ts 全綠
  [x] pnpm typecheck / test / lint 全綠

一句話總結：建立 X 題完整題目 + X 個技巧場景，自我驗證測試全綠。

（若有任何偏離 / 卡關 / 對某些技巧場景不確定 / 需要主 agent 決策的點，列在這裡）
```

## 操作提醒
- 在 Cursor 開**新 chat**
- 完工 → 寫 `docs/plans/dispatch/02-test-fixtures.report.md`
- **不要 commit / push / 切分支 / 建 worktree**
