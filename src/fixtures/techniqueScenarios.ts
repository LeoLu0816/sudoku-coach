import type { TechniqueId } from '@/types'

/** 技巧場景輸入（部分候選盤面） */
export interface TechniqueScenarioGiven {
  /** 81 字元字串；'.' 或 '0' = 空 */
  given: string
  /**
   * 可選：每格的候選數（length 81）；若該題需要明確指定候選才能展示技巧
   * 用字串表達該格候選，如 "138" 表示 {1,3,8}；空格用空字串 ""
   * 若整題不提供，則由消費端用 validator.recomputeAllCandidates 算
   */
  candidates?: string[]
}

/** 預期技巧步驟（簡化版，符合 TechniqueStep 子集） */
export interface TechniqueScenarioExpected {
  targets: number[]
  action: 'place' | 'eliminate'
  placements?: { index: number; value: number }[]
  eliminations?: { index: number; values: number[] }[]
}

/** 技巧場景：一個最小例證盤面 + 預期下一步 */
export interface TechniqueScenario {
  /** 唯一 ID（格式：'<technique-id>-NN'） */
  id: string
  technique: TechniqueId
  /** 場景說明（中文） */
  description: string
  input: TechniqueScenarioGiven
  expected: TechniqueScenarioExpected
}

const solvedBoard = '534678912672195348198342567859761423426853791713924856961537284287419635345286179'

/** 將人類常用的 R/C（1-based）座標轉成 row-major index。 */
function indexOf(row: number, col: number): number {
  return (row - 1) * 9 + (col - 1)
}

/** 由完整解答挖空指定格子，產生最小化的技巧場景盤面。 */
function buildGiven(emptyCells: Array<[row: number, col: number]>): string {
  const chars = solvedBoard.split('')

  for (const [row, col] of emptyCells) {
    chars[indexOf(row, col)] = '.'
  }

  return chars.join('')
}

/** 建立 length 81 的候選數陣列，未指定位置一律留空字串。 */
function buildCandidates(entries: Array<[row: number, col: number, value: string]>): string[] {
  const candidates = Array.from({ length: 81 }, () => '')

  for (const [row, col, value] of entries) {
    candidates[indexOf(row, col)] = value
  }

  return candidates
}

/** 封裝場景輸入，只有在需要時才附帶 candidates。 */
function buildInput(
  emptyCells: Array<[row: number, col: number]>,
  candidateEntries?: Array<[row: number, col: number, value: string]>,
): TechniqueScenarioGiven {
  if (!candidateEntries || candidateEntries.length === 0) {
    return { given: buildGiven(emptyCells) }
  }

  return {
    given: buildGiven(emptyCells),
    candidates: buildCandidates(candidateEntries),
  }
}

export const techniqueScenarios: TechniqueScenario[] = [
  {
    id: 'naked-single-01',
    technique: 'naked-single',
    description: '列裸單：R1C9 只剩一個空格，因此可直接填入 2。',
    input: buildInput([[1, 9]]),
    expected: {
      targets: [indexOf(1, 9)],
      action: 'place',
      placements: [{ index: indexOf(1, 9), value: 2 }],
    },
  },
  {
    id: 'naked-single-02',
    technique: 'naked-single',
    description: '行裸單：C1 只缺 R9C1，下一步可直接放入 3。',
    input: buildInput([[9, 1]]),
    expected: {
      targets: [indexOf(9, 1)],
      action: 'place',
      placements: [{ index: indexOf(9, 1), value: 3 }],
    },
  },
  {
    id: 'naked-single-03',
    technique: 'naked-single',
    description: '宮裸單：左上宮只缺 R2C2，因此可直接放入 7。',
    input: buildInput([[2, 2]]),
    expected: {
      targets: [indexOf(2, 2)],
      action: 'place',
      placements: [{ index: indexOf(2, 2), value: 7 }],
    },
  },
  {
    id: 'hidden-single-01',
    technique: 'hidden-single',
    description: '列隱單：第 1 列中，數字 2 只會出現在 R1C9。',
    input: buildInput(
      [
        [1, 1],
        [1, 2],
        [1, 9],
      ],
      [
        [1, 1, '35'],
        [1, 2, '34'],
        [1, 9, '27'],
      ],
    ),
    expected: {
      targets: [indexOf(1, 9)],
      action: 'place',
      placements: [{ index: indexOf(1, 9), value: 2 }],
    },
  },
  {
    id: 'hidden-single-02',
    technique: 'hidden-single',
    description: '行隱單：第 1 欄中，數字 3 只會出現在 R9C1。',
    input: buildInput(
      [
        [1, 1],
        [5, 1],
        [9, 1],
      ],
      [
        [1, 1, '56'],
        [5, 1, '45'],
        [9, 1, '23'],
      ],
    ),
    expected: {
      targets: [indexOf(9, 1)],
      action: 'place',
      placements: [{ index: indexOf(9, 1), value: 3 }],
    },
  },
  {
    id: 'hidden-single-03',
    technique: 'hidden-single',
    description: '宮隱單：右下宮中，數字 9 只會出現在 R9C9。',
    input: buildInput(
      [
        [7, 7],
        [8, 8],
        [9, 9],
      ],
      [
        [7, 7, '24'],
        [8, 8, '35'],
        [9, 9, '79'],
      ],
    ),
    expected: {
      targets: [indexOf(9, 9)],
      action: 'place',
      placements: [{ index: indexOf(9, 9), value: 9 }],
    },
  },
  {
    id: 'naked-pair-01',
    technique: 'naked-pair',
    description: '列裸對：R1C8 與 R1C9 形成 {1,2} 裸對，可從同列其他格刪除 1、2。',
    input: buildInput(
      [
        [1, 1],
        [1, 2],
        [1, 8],
        [1, 9],
      ],
      [
        [1, 1, '125'],
        [1, 2, '123'],
        [1, 8, '12'],
        [1, 9, '12'],
      ],
    ),
    expected: {
      targets: [indexOf(1, 1), indexOf(1, 2)],
      action: 'eliminate',
      eliminations: [
        { index: indexOf(1, 1), values: [1, 2] },
        { index: indexOf(1, 2), values: [1, 2] },
      ],
    },
  },
  {
    id: 'naked-pair-02',
    technique: 'naked-pair',
    description: '行裸對：C1 的 R8C1 與 R9C1 形成 {2,3} 裸對，可消去同欄其他格的 2、3。',
    input: buildInput(
      [
        [1, 1],
        [5, 1],
        [8, 1],
        [9, 1],
      ],
      [
        [1, 1, '235'],
        [5, 1, '234'],
        [8, 1, '23'],
        [9, 1, '23'],
      ],
    ),
    expected: {
      targets: [indexOf(1, 1), indexOf(5, 1)],
      action: 'eliminate',
      eliminations: [
        { index: indexOf(1, 1), values: [2, 3] },
        { index: indexOf(5, 1), values: [2, 3] },
      ],
    },
  },
  {
    id: 'naked-pair-03',
    technique: 'naked-pair',
    description: '宮裸對：左上宮的 R2C2 與 R3C1 形成 {1,7} 裸對，可移除宮內其他格的 1 或 7。',
    input: buildInput(
      [
        [1, 1],
        [1, 2],
        [2, 2],
        [3, 1],
      ],
      [
        [1, 1, '157'],
        [1, 2, '347'],
        [2, 2, '17'],
        [3, 1, '17'],
      ],
    ),
    expected: {
      targets: [indexOf(1, 1), indexOf(1, 2)],
      action: 'eliminate',
      eliminations: [
        { index: indexOf(1, 1), values: [1, 7] },
        { index: indexOf(1, 2), values: [7] },
      ],
    },
  },
  {
    id: 'hidden-pair-01',
    technique: 'hidden-pair',
    description: '列隱對：第 1 列只有 R1C8、R1C9 能放 1 與 2，因此可清掉其他雜候選。',
    input: buildInput(
      [
        [1, 1],
        [1, 2],
        [1, 8],
        [1, 9],
      ],
      [
        [1, 1, '35'],
        [1, 2, '34'],
        [1, 8, '127'],
        [1, 9, '128'],
      ],
    ),
    expected: {
      targets: [indexOf(1, 8), indexOf(1, 9)],
      action: 'eliminate',
      eliminations: [
        { index: indexOf(1, 8), values: [7] },
        { index: indexOf(1, 9), values: [8] },
      ],
    },
  },
  {
    id: 'hidden-pair-02',
    technique: 'hidden-pair',
    description: '行隱對：第 1 欄只有 R8C1、R9C1 能放 2 與 3，可移除兩格的額外候選。',
    input: buildInput(
      [
        [1, 1],
        [5, 1],
        [8, 1],
        [9, 1],
      ],
      [
        [1, 1, '56'],
        [5, 1, '45'],
        [8, 1, '236'],
        [9, 1, '235'],
      ],
    ),
    expected: {
      targets: [indexOf(8, 1), indexOf(9, 1)],
      action: 'eliminate',
      eliminations: [
        { index: indexOf(8, 1), values: [6] },
        { index: indexOf(9, 1), values: [5] },
      ],
    },
  },
  {
    id: 'hidden-pair-03',
    technique: 'hidden-pair',
    description: '宮隱對：左上宮只有 R2C2 與 R3C1 能放 1 與 7，因此需刪除其餘候選。',
    input: buildInput(
      [
        [1, 1],
        [1, 2],
        [2, 2],
        [3, 1],
      ],
      [
        [1, 1, '56'],
        [1, 2, '34'],
        [2, 2, '178'],
        [3, 1, '179'],
      ],
    ),
    expected: {
      targets: [indexOf(2, 2), indexOf(3, 1)],
      action: 'eliminate',
      eliminations: [
        { index: indexOf(2, 2), values: [8] },
        { index: indexOf(3, 1), values: [9] },
      ],
    },
  },
  {
    id: 'naked-triple-01',
    technique: 'naked-triple',
    description: '列裸三：R1C2、R1C8、R1C9 形成 {1,2,3} 裸三，可從同列其他格刪除相關候選。',
    input: buildInput(
      [
        [1, 1],
        [1, 2],
        [1, 3],
        [1, 8],
        [1, 9],
      ],
      [
        [1, 1, '135'],
        [1, 2, '123'],
        [1, 3, '234'],
        [1, 8, '13'],
        [1, 9, '23'],
      ],
    ),
    expected: {
      targets: [indexOf(1, 1), indexOf(1, 3)],
      action: 'eliminate',
      eliminations: [
        { index: indexOf(1, 1), values: [1, 3] },
        { index: indexOf(1, 3), values: [2, 3] },
      ],
    },
  },
  {
    id: 'naked-triple-02',
    technique: 'naked-triple',
    description: '行裸三：第 1 欄中三格形成 {1,2,3} 裸三，可從同欄其他格刪除 1、2、3。',
    input: buildInput(
      [
        [1, 1],
        [3, 1],
        [5, 1],
        [8, 1],
        [9, 1],
      ],
      [
        [1, 1, '125'],
        [3, 1, '123'],
        [5, 1, '234'],
        [8, 1, '23'],
        [9, 1, '13'],
      ],
    ),
    expected: {
      targets: [indexOf(1, 1), indexOf(5, 1)],
      action: 'eliminate',
      eliminations: [
        { index: indexOf(1, 1), values: [1, 2] },
        { index: indexOf(5, 1), values: [2, 3] },
      ],
    },
  },
  {
    id: 'naked-triple-03',
    technique: 'naked-triple',
    description: '宮裸三：左上宮三格形成 {1,2,3} 裸三，可移除宮內其他格的重複候選。',
    input: buildInput(
      [
        [1, 1],
        [1, 2],
        [2, 1],
        [2, 3],
        [3, 1],
      ],
      [
        [1, 1, '145'],
        [1, 2, '23'],
        [2, 1, '126'],
        [2, 3, '123'],
        [3, 1, '13'],
      ],
    ),
    expected: {
      targets: [indexOf(1, 1), indexOf(2, 1)],
      action: 'eliminate',
      eliminations: [
        { index: indexOf(1, 1), values: [1] },
        { index: indexOf(2, 1), values: [1, 2] },
      ],
    },
  },
  {
    id: 'pointing-pair-01',
    technique: 'pointing-pair',
    description: '指向對（row 方向）：左上宮的候選 7 只落在第 1 列，可刪掉同列其他格的 7。',
    input: buildInput(
      [
        [1, 1],
        [1, 2],
        [1, 4],
        [1, 5],
      ],
      [
        [1, 1, '57'],
        [1, 2, '37'],
        [1, 4, '67'],
        [1, 5, '57'],
      ],
    ),
    expected: {
      targets: [indexOf(1, 4), indexOf(1, 5)],
      action: 'eliminate',
      eliminations: [
        { index: indexOf(1, 4), values: [7] },
        { index: indexOf(1, 5), values: [7] },
      ],
    },
  },
  {
    id: 'pointing-pair-02',
    technique: 'pointing-pair',
    description: '指向對（col 方向）：左上宮的候選 4 只落在第 1 欄，可刪掉同欄其他格的 4。',
    input: buildInput(
      [
        [1, 1],
        [2, 1],
        [5, 1],
        [6, 1],
      ],
      [
        [1, 1, '45'],
        [2, 1, '46'],
        [5, 1, '47'],
        [6, 1, '47'],
      ],
    ),
    expected: {
      targets: [indexOf(5, 1), indexOf(6, 1)],
      action: 'eliminate',
      eliminations: [
        { index: indexOf(5, 1), values: [4] },
        { index: indexOf(6, 1), values: [4] },
      ],
    },
  },
  {
    id: 'pointing-pair-03',
    technique: 'pointing-pair',
    description: '指向對（row 方向）：右下宮的候選 8 只落在第 9 列，可刪掉同列其他格的 8。',
    input: buildInput(
      [
        [9, 1],
        [9, 2],
        [9, 7],
        [9, 8],
      ],
      [
        [9, 1, '38'],
        [9, 2, '48'],
        [9, 7, '28'],
        [9, 8, '18'],
      ],
    ),
    expected: {
      targets: [indexOf(9, 1), indexOf(9, 2)],
      action: 'eliminate',
      eliminations: [
        { index: indexOf(9, 1), values: [8] },
        { index: indexOf(9, 2), values: [8] },
      ],
    },
  },
  {
    id: 'box-line-reduction-01',
    technique: 'box-line-reduction',
    description: '區塊行列消除（row→box）：第 1 列的候選 7 都在左上宮，可刪掉該宮其他列的 7。',
    input: buildInput(
      [
        [1, 1],
        [1, 2],
        [2, 1],
        [3, 1],
      ],
      [
        [1, 1, '57'],
        [1, 2, '37'],
        [2, 1, '67'],
        [3, 1, '17'],
      ],
    ),
    expected: {
      targets: [indexOf(2, 1), indexOf(3, 1)],
      action: 'eliminate',
      eliminations: [
        { index: indexOf(2, 1), values: [7] },
        { index: indexOf(3, 1), values: [7] },
      ],
    },
  },
  {
    id: 'box-line-reduction-02',
    technique: 'box-line-reduction',
    description: '區塊行列消除（col→box）：第 1 欄的候選 4 都在左上宮，可刪掉該宮其他欄位的 4。',
    input: buildInput(
      [
        [1, 1],
        [1, 2],
        [2, 1],
        [2, 2],
      ],
      [
        [1, 1, '45'],
        [1, 2, '34'],
        [2, 1, '46'],
        [2, 2, '47'],
      ],
    ),
    expected: {
      targets: [indexOf(1, 2), indexOf(2, 2)],
      action: 'eliminate',
      eliminations: [
        { index: indexOf(1, 2), values: [4] },
        { index: indexOf(2, 2), values: [4] },
      ],
    },
  },
  {
    id: 'box-line-reduction-03',
    technique: 'box-line-reduction',
    description: '區塊行列消除（row→box）：第 9 列的候選 8 都落在右下宮，可刪掉該宮其他列的 8。',
    input: buildInput(
      [
        [7, 7],
        [8, 8],
        [9, 7],
        [9, 8],
      ],
      [
        [7, 7, '28'],
        [8, 8, '38'],
        [9, 7, '28'],
        [9, 8, '18'],
      ],
    ),
    expected: {
      targets: [indexOf(7, 7), indexOf(8, 8)],
      action: 'eliminate',
      eliminations: [
        { index: indexOf(7, 7), values: [8] },
        { index: indexOf(8, 8), values: [8] },
      ],
    },
  },
]
