---
id: 01-shared-types
phase: P0
status: todo
depends_on: [00-scaffold]
assignee: null
estimated_complexity: S
acceptance:
  - "src/types/ 下完整型別檔，匯出於 src/types/index.ts"
  - "pnpm typecheck 通過"
  - "所有型別附繁中註解說明用途"
  - "對應 dummy test 通過（驗證型別可組合）"
deliverables:
  - "src/types/index.ts"
  - "src/types/board.ts"
  - "src/types/technique.ts"
  - "src/types/puzzle.ts"
  - "src/__tests__/types.test.ts"
---

# 01 — 共享型別契約

## 目標
定義整個專案所有模組共用的型別。這是子任務間的「介面合約」，後續任何修改需經主 agent 同意。

## 必含型別

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
  index: CellIndex;       // 0..80
  row: number;            // 0..8
  col: number;            // 0..8
  box: number;            // 0..8（3x3 宮編號，row-major）
  value: CellValue;
  isGiven: boolean;       // 是否為題目原始給定（不可改）
  candidates: Candidates; // 候選數（pencil marks）
}

/** 棋盤狀態 */
export interface Board {
  cells: Cell[]; // length 81
}

/** 區域類型 */
export type UnitType = 'row' | 'col' | 'box';

/** 操作衝突資訊 */
export interface Conflict {
  index: CellIndex;
  conflictWith: CellIndex[]; // 與此格衝突的其他格 index
}
```

### `src/types/technique.ts`

```ts
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
  name: string;           // 中文名（如「裸單」）
  shortDesc: string;      // 一句話技巧簡介
}

/** 一個解題步驟 */
export interface TechniqueStep {
  technique: TechniqueId;
  /** 本步驟作用的目標格 */
  targets: CellIndex[];
  /** 推理過程涉及的參考格（用於高亮） */
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

/** 技巧 solver 統一介面 — 純函式 */
export interface TechniqueSolver {
  meta: TechniqueMeta;
  /**
   * 嘗試在當前盤面找出一個可套用的步驟
   * @returns 找到回傳 TechniqueStep；找不到回傳 null
   */
  apply(board: Board): TechniqueStep | null;
}
```

### `src/types/puzzle.ts`

```ts
import type { Board, CellValue } from './board';
import type { TechniqueStep } from './technique';

/** 難度 */
export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert';

/** 題目 */
export interface Puzzle {
  id: string;             // 唯一 ID（如 hash）
  difficulty: Difficulty;
  given: CellValue[];     // length 81，題目給定數字（0 = 空）
  solution: CellValue[];  // length 81，唯一解
}

/** 解題編排器輸出 */
export interface SolveResult {
  solved: boolean;
  finalBoard: Board;
  steps: TechniqueStep[]; // 完整解題步驟（依序）
  techniqueUsage: Partial<Record<import('./technique').TechniqueId, number>>;
  /** 若 solver 嘗試所有技巧後仍解不出，會 fallback 到 backtrack */
  fallbackUsed: boolean;
}
```

### `src/types/index.ts`
re-export 所有型別。

## 設計原則
- **不可變優先**：所有操作回傳新 Board，不就地修改。Cell 可考慮 `readonly`。
- **純資料**：型別只描述資料形狀，不含 method（method 放 core/）
- **Set 序列化**：candidates 用 `Set`，序列化時轉 array
- **註解必備**：每個 type / interface / 欄位都要繁中註解

## 測試項目
`src/__tests__/types.test.ts`：
- 建立一個 `Board` 物件 → typecheck 通過
- 建立一個 `TechniqueStep` 物件 → typecheck 通過
- 確認 `TechniqueSolver` interface 可被滿足（建一個 dummy solver）

## 完工條件
- 上述四個檔案完整、註解齊備
- `pnpm typecheck` 通過
- `pnpm test src/__tests__/types.test.ts` 通過
