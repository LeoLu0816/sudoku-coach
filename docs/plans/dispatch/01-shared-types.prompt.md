# [Cursor 子任務 — 01-shared-types]

> 此檔由主 agent（Claude Code）產出，供 Cursor 直接讀取執行。
> 完工後請依末尾「完工回報格式」寫入 `docs/plans/dispatch/01-shared-types.report.md`。

## 你的角色
你是專注的工程師，**只負責定義型別契約**這個獨立子任務。**不要超出範圍**：不要實作任何業務邏輯、不要寫 helper 函式（例如 `createBoard()` 等屬於後續任務 10-board-core）。

> ⚠️ **這個任務是整個專案的「介面合約核心」**：後續所有子任務（25 個）都會 import 這些型別。一旦定稿，主 agent 會把它鎖定為「契約檔」，任何修改都需要主 agent 同意並廣播給已完成的任務。請特別嚴謹。

## 必讀脈絡
1. `docs/plans/tasks/01-shared-types.md` ← 本任務完整規格
2. `docs/plans/sudoku-master.md` § 二、三、七-B ← 技術棧、功能範圍、契約異動規則
3. 已完成的 `00-scaffold`：請熟悉 `tsconfig.json` 的 `strict` 與 `@/*` 別名

## 任務目標
在 `src/types/` 下建立完整型別檔，匯出於 `src/types/index.ts`，作為整個專案的介面合約。

## 必須產出的檔案
- `src/types/board.ts`
- `src/types/technique.ts`
- `src/types/puzzle.ts`
- `src/types/index.ts`（re-export 全部）
- `src/__tests__/types.test.ts`（驗證型別可組合）

> ⚠️ **不可動** 任何既有檔案，除了上述新檔（含 `src/types/.gitkeep` 可刪除）。

## 完整型別規格

> **必須完全照下列規格實作**，欄位、命名、註解一字不漏。註解用繁中。

### `src/types/board.ts`

```ts
/** 單格的值；0 表示空格 */
export type CellValue = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

/** 候選數集合（值 1-9） */
export type Candidates = Set<number>;

/** 9x9 棋盤的索引 0..80（row-major：index = row*9 + col） */
export type CellIndex = number;

/** 單格資料 */
export interface Cell {
  /** 0..80 */
  index: CellIndex;
  /** 0..8 */
  row: number;
  /** 0..8 */
  col: number;
  /** 0..8（3x3 宮編號，row-major） */
  box: number;
  /** 當前格值；0 表示空 */
  value: CellValue;
  /** 是否為題目原始給定（不可改） */
  isGiven: boolean;
  /** 候選數（pencil marks 或自動候選） */
  candidates: Candidates;
}

/** 棋盤狀態 */
export interface Board {
  /** length === 81，依 index 0..80 排序 */
  cells: Cell[];
}

/** 區域類型 */
export type UnitType = 'row' | 'col' | 'box';

/** 操作衝突資訊 */
export interface Conflict {
  /** 衝突格 index */
  index: CellIndex;
  /** 與此格衝突的其他格 index */
  conflictWith: CellIndex[];
}
```

### `src/types/technique.ts`

```ts
import type { Board, CellIndex } from './board';

/** 解題技巧 ID */
export type TechniqueId =
  | 'naked-single'
  | 'hidden-single'
  | 'naked-pair'
  | 'hidden-pair'
  | 'naked-triple'
  | 'pointing-pair'
  | 'box-line-reduction'
  | 'backtrack';

/** 技巧 metadata（顯示給使用者） */
export interface TechniqueMeta {
  id: TechniqueId;
  /** 中文名（如「裸單」） */
  name: string;
  /** 一句話技巧簡介 */
  shortDesc: string;
}

/** 一個解題步驟 */
export interface TechniqueStep {
  technique: TechniqueId;
  /** 本步驟作用的目標格 index 陣列 */
  targets: CellIndex[];
  /** 推理過程涉及的參考格 index 陣列（用於 UI 高亮） */
  related: CellIndex[];
  /** 動作類型 */
  action: 'place' | 'eliminate';
  /** action='place' 時，要填入的格與值 */
  placements?: { index: CellIndex; value: number }[];
  /** action='eliminate' 時，要消除的候選 */
  eliminations?: { index: CellIndex; values: number[] }[];
  /** 中文說明（給玩家看的推理過程） */
  explanation: string;
}

/** 技巧 solver 統一介面 — 純函式（無副作用） */
export interface TechniqueSolver {
  meta: TechniqueMeta;
  /**
   * 嘗試在當前盤面找出一個可套用的步驟
   * @param board 當前盤面（不可修改）
   * @returns 找到回傳 TechniqueStep；找不到回傳 null
   */
  apply(board: Board): TechniqueStep | null;
}
```

### `src/types/puzzle.ts`

```ts
import type { Board, CellValue } from './board';
import type { TechniqueId, TechniqueStep } from './technique';

/** 難度 */
export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert';

/** 題目 */
export interface Puzzle {
  /** 唯一 ID（如 hash 或 timestamp 字串） */
  id: string;
  difficulty: Difficulty;
  /** length === 81，題目給定數字（0 = 空） */
  given: CellValue[];
  /** length === 81，唯一解（全填） */
  solution: CellValue[];
}

/** 解題編排器的最終輸出 */
export interface SolveResult {
  /** 是否成功解出 */
  solved: boolean;
  /** 解題結束時的盤面 */
  finalBoard: Board;
  /** 完整解題步驟（依序） */
  steps: TechniqueStep[];
  /** 各技巧使用次數統計 */
  techniqueUsage: Partial<Record<TechniqueId, number>>;
  /** 若 solver 嘗試所有技巧後仍解不出，會 fallback 到 backtrack；此 flag 標記是否使用 fallback */
  fallbackUsed: boolean;
}
```

### `src/types/index.ts`
re-export 上述三檔的所有 export。範例：

```ts
export * from './board';
export * from './technique';
export * from './puzzle';
```

## 測試項目

`src/__tests__/types.test.ts`：

> ⚠️ 此測試**只驗證型別組合性**（typecheck），不驗證行為（行為由後續任務的單元測試負責）。

至少包含以下測試：

1. **建立 Board 物件**：手動 new 一個 81 cells 的 Board，typecheck 通過、length === 81
2. **建立 TechniqueStep 物件**：兩種 action 各一個（'place' 與 'eliminate'），typecheck 通過
3. **TechniqueSolver 介面可實作**：定義一個 dummy solver 回傳固定 null，typecheck 通過
4. **Puzzle 物件**：given / solution 皆為 length === 81 的陣列，typecheck 通過
5. **SolveResult 物件**：包含完整欄位，typecheck 通過

範例片段：

```ts
import { describe, it, expect } from 'vitest';
import type { Board, Cell, TechniqueStep, TechniqueSolver, Puzzle, SolveResult } from '@/types';

describe('types', () => {
  it('可建立合法 Board', () => {
    const cells: Cell[] = Array.from({ length: 81 }, (_, i) => ({
      index: i,
      row: Math.floor(i / 9),
      col: i % 9,
      box: Math.floor(Math.floor(i / 9) / 3) * 3 + Math.floor((i % 9) / 3),
      value: 0,
      isGiven: false,
      candidates: new Set<number>(),
    }));
    const board: Board = { cells };
    expect(board.cells).toHaveLength(81);
  });

  // ... 其他測試
});
```

## 完工條件（驗收用）
- [ ] `src/types/board.ts`、`technique.ts`、`puzzle.ts`、`index.ts` 完整建立
- [ ] 型別欄位、命名與規格**完全一致**（不可加減欄位、不可改命名）
- [ ] 每個 type / interface / 欄位都有繁中註解
- [ ] `src/__tests__/types.test.ts` 至少 5 個測試案例（如上）
- [ ] `pnpm typecheck` 通過
- [ ] `pnpm test` 全綠（含原有 sanity test + 新 types test）
- [ ] `pnpm lint` 無錯誤
- [ ] 未動既有檔案（除 `src/types/.gitkeep` 可刪除）

## 規則（重要）
1. **不修改任何 docs/plans/ 檔案**
2. **不實作任何業務邏輯**（不寫 `createBoard()` / `getCell()` 等 helper，那是 10-board-core 的事）
3. **不加額外型別**（除非為了讓上述型別 typecheck 通過必要的 internal helper）
4. **不安裝額外依賴**
5. 型別命名、欄位順序、註解內容請**完全照規格**
6. 使用 `import type` 引入型別（純型別 import，避免 runtime 副作用）
7. 路徑使用 `@/types` 別名（已在 00-scaffold 設定）

## 完工回報格式
做完後請把以下內容**寫入** `docs/plans/dispatch/01-shared-types.report.md`：

```
[01-shared-types] 完工回報

變更檔案：
  + src/types/board.ts
  + src/types/technique.ts
  + src/types/puzzle.ts
  + src/types/index.ts
  + src/__tests__/types.test.ts
  - src/types/.gitkeep  (移除，已有實際檔案)

匯出符號清單（從 index.ts 抓）：
  - CellValue, Candidates, CellIndex, Cell, Board, UnitType, Conflict
  - TechniqueId, TechniqueMeta, TechniqueStep, TechniqueSolver
  - Difficulty, Puzzle, SolveResult

測試結果：
  $ pnpm typecheck    → PASS / FAIL (錯誤摘要)
  $ pnpm test         → X passed / Y failed
  $ pnpm lint         → PASS / FAIL (錯誤摘要)

完工條件勾選：
  [x] src/types/*.ts 全部建立
  [x] 型別規格與 prompt 一致
  [x] 繁中註解齊備
  [x] types.test.ts 含至少 5 個測試
  [x] pnpm typecheck / test / lint 全綠
  [x] 未動既有檔案

一句話總結：建立 13 個共用型別，後續所有任務的介面合約已就緒。

（若有任何偏離規格 / 卡關 / 需要主 agent 決策，列在這裡）
```

## 操作提醒
- 請在 Cursor 開**新 chat**（不要沿用 00-scaffold 的 chat）
- 完工 → 寫 `docs/plans/dispatch/01-shared-types.report.md` 即可
