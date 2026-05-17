import type { Difficulty, TechniqueId } from '@/types'

/** 完整題目 fixture（用 81 字串便於閱讀與序列化） */
export interface FixturePuzzle {
  /** 唯一 ID（格式：'<difficulty>-NN'） */
  id: string
  difficulty: Difficulty
  /** 81 字元字串；'.' 或 '0' 表示空格，其他字元為 '1'-'9' */
  given: string
  /** 81 字元字串；唯一解（全填，無 '.' 或 '0'） */
  solution: string
  /** 預期解此題會用到的技巧 ID 清單（含 fallback；用於難度判定驗證） */
  expectedTechniques: TechniqueId[]
}

interface PuzzleSeed {
  difficulty: Difficulty
  given: string
  solution: string
  expectedTechniques: TechniqueId[]
}

interface PuzzleVariant {
  digitShift: number
  reverseDigits: boolean
  transpose: boolean
  rotate180: boolean
}

const puzzleSeeds: PuzzleSeed[] = [
  {
    difficulty: 'easy',
    given:
      '5346.891..7.1...4.....42..78.976.4...26...7.171...4.56.61.3728..87..9.3534.......',
    solution: '534678912672195348198342567859761423426853791713924856961537284287419635345286179',
    expectedTechniques: ['naked-single'],
  },
  {
    difficulty: 'medium',
    given:
      '.....3.54.47..5..35.384...176....42.2.8.6.7.54352........3.49........387.2..87...',
    solution: '182793654647125893593846271769531428218469735435278169876354912954612387321987546',
    expectedTechniques: ['naked-single', 'hidden-single'],
  },
  {
    difficulty: 'hard',
    given:
      '.49.........5..4.......7..549....56.3..4.8.9.2.8.7..1.....3..4..6.8..2.3.2379.6..',
    solution: '549263187731589426682147935497321568316458792258976314175632849964815273823794651',
    expectedTechniques: [
      'naked-single',
      'hidden-single',
      'naked-pair',
      'hidden-pair',
      'pointing-pair',
    ],
  },
  {
    difficulty: 'expert',
    given:
      '.1.........93....5725....9..8..5.6...3..8....6.7.91...1.8.....4....34..9...2..7..',
    solution: '314925876869347125725168493982753641431682957657491382198576234276834519543219768',
    expectedTechniques: [
      'naked-single',
      'hidden-single',
      'naked-pair',
      'hidden-pair',
      'pointing-pair',
      'naked-triple',
      'box-line-reduction',
    ],
  },
]

const puzzleVariants: PuzzleVariant[] = [
  { digitShift: 0, reverseDigits: false, transpose: false, rotate180: false },
  { digitShift: 1, reverseDigits: false, transpose: false, rotate180: true },
  { digitShift: 2, reverseDigits: false, transpose: true, rotate180: false },
  { digitShift: 0, reverseDigits: true, transpose: false, rotate180: false },
  { digitShift: 4, reverseDigits: false, transpose: true, rotate180: true },
]

/** 讓數字循環位移，以保留同構數獨的唯一解結構。 */
function shiftDigit(char: string, offset: number): string {
  if (char < '1' || char > '9') {
    return char
  }

  const digit = Number(char) - 1
  return String(((digit + offset) % 9) + 1)
}

/** 將數字做鏡射映射（1<->9、2<->8...），同樣可保留題目合法性。 */
function reverseDigit(char: string): string {
  if (char < '1' || char > '9') {
    return char
  }

  return String(10 - Number(char))
}

/** 對 81 字串做數字重映射，不改動空格符號。 */
function remapBoard(board: string, variant: PuzzleVariant): string {
  return board
    .split('')
    .map((char) => {
      const shifted = shiftDigit(char, variant.digitShift)
      return variant.reverseDigits ? reverseDigit(shifted) : shifted
    })
    .join('')
}

/** 將盤面做主對角線轉置，生成結構等價但外觀不同的題目。 */
function transposeBoard(board: string): string {
  const output = Array.from({ length: 81 }, () => '.')

  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      output[col * 9 + row] = board[row * 9 + col]
    }
  }

  return output.join('')
}

/** 將盤面做 180 度旋轉，保留數獨約束並製造更多 fixture 變體。 */
function rotateBoard180(board: string): string {
  return board.split('').reverse().join('')
}

/** 依變體設定套用合法變換，避免手抄大量重複題目。 */
function transformBoard(board: string, variant: PuzzleVariant): string {
  let transformed = remapBoard(board, variant)

  if (variant.transpose) {
    transformed = transposeBoard(transformed)
  }

  if (variant.rotate180) {
    transformed = rotateBoard180(transformed)
  }

  return transformed
}

/** 將單一種子題擴展為 5 題同構變體，滿足每個難度至少 5 題。 */
function buildPuzzlesFromSeed(seed: PuzzleSeed): FixturePuzzle[] {
  return puzzleVariants.map((variant, index) => ({
    id: `${seed.difficulty}-${String(index + 1).padStart(2, '0')}`,
    difficulty: seed.difficulty,
    given: transformBoard(seed.given, variant),
    solution: transformBoard(seed.solution, variant),
    expectedTechniques: [...seed.expectedTechniques],
  }))
}

export const fixturePuzzles: FixturePuzzle[] = puzzleSeeds.flatMap(buildPuzzlesFromSeed)
