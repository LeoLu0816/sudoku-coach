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
