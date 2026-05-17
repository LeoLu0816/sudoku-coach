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
