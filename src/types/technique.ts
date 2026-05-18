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
  // Tier 1 高階
  | 'hidden-triple'
  | 'naked-quad'
  | 'x-wing'
  | 'swordfish'
  | 'xy-wing'
  // Tier 2 高階（5B）
  | 'skyscraper'
  | 'simple-coloring'
  | 'unique-rectangle'
  | 'xyz-wing'
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
