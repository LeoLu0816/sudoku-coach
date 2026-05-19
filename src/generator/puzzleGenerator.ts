import type { CellValue, Difficulty, Puzzle, TechniqueId } from '@/types'
import { createBoardFromGiven } from '@/core/board'
import { parseBoardString, toBoardString } from '@/core/serializer'
import { countSolutions } from '@/solver/backtrack'
import { solveWithSteps } from '@/solver/orchestrator'
import { fixturePuzzles } from '@/fixtures'

/** 生成選項 */
export interface GenerateOptions {
  difficulty: Difficulty
  /** 可選 seed；提供時 deterministic */
  seed?: number
  /** 上限時間（毫秒）；超時則回備用 fixture 題 */
  timeoutMs?: number
}

/**
 * 已知合法基準解（fixturePuzzles 中 easy seed 的解，已驗證合法）
 */
const BASE_SOLUTION = '534678912672195348198342567859761423426853791713924856961537284287419635345286179'

/** 各難度目標 givens 數量（粗略指引，最終由技巧檢測決定） */
const DIFFICULTY_TARGET_GIVENS: Record<Difficulty, { min: number; max: number }> = {
  easy: { min: 36, max: 50 },
  medium: { min: 30, max: 40 },
  hard: { min: 25, max: 32 },
  expert: { min: 17, max: 28 },
  // master 暫時複用 expert 的 givens 範圍；T61 會用「至少用到一個高階技巧」做真正分級
  master: { min: 17, max: 26 },
}

/**
 * 簡易 seedable 隨機數產生器（mulberry32）
 * 若無 seed 則用 Math.random
 */
function createRng(seed?: number): () => number {
  if (seed === undefined) return Math.random
  let s = seed >>> 0
  return () => {
    s |= 0
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Fisher-Yates shuffle（in-place） */
function shuffle<T>(arr: T[], rng: () => number): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

/** 將基準解套用合法變換（數字重映射 + 轉置 + 旋轉），生成同構解 */
function transformSolution(rng: () => number): string {
  const digitMap: Record<string, string> = {}
  const digits = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9], rng)
  for (let i = 0; i < 9; i++) digitMap[String(i + 1)] = String(digits[i])

  let board = BASE_SOLUTION.split('')
    .map((c) => digitMap[c])
    .join('')

  // 隨機轉置
  if (rng() < 0.5) {
    const t = Array.from({ length: 81 }, (_, idx) => {
      const r = Math.floor(idx / 9)
      const c = idx % 9
      return board[c * 9 + r]
    })
    board = t.join('')
  }

  // 隨機 180 度旋轉
  if (rng() < 0.5) {
    board = board.split('').reverse().join('')
  }

  return board
}

/** 高階技巧（Tier 1 + Tier 2）— 用到任一即達 master 等級 */
const ADVANCED_TECHNIQUES: TechniqueId[] = [
  'hidden-triple',
  'naked-quad',
  'x-wing',
  'swordfish',
  'xy-wing',
  'skyscraper',
  'simple-coloring',
  'unique-rectangle',
  'xyz-wing',
]

/**
 * 判斷一個 puzzle 用 orchestrator 解的最高層級
 * - 'easy': 只用 naked-single
 * - 'medium': naked-single + hidden-single（無 fallback）
 * - 'master': 用到至少 1 個高階技巧（Tier 1 / Tier 2）且無 fallback
 * - 'hard-or-expert': 需要中階技巧但未用高階，或需 fallback（P1 沒有中階技巧時的舊行為）
 */
function classifyDifficulty(givenStr: string): Difficulty | 'hard-or-expert' {
  const board = parseBoardString(givenStr)
  const result = solveWithSteps(board)

  if (!result.solved) { return 'hard-or-expert' }

  const usage = result.techniqueUsage
  const techniques = Object.keys(usage) as TechniqueId[]

  if (result.fallbackUsed) { return 'hard-or-expert' }

  // master：用到任一高階技巧
  const usedAdvanced = ADVANCED_TECHNIQUES.some((t) => (usage[t] ?? 0) > 0)
  if (usedAdvanced) { return 'master' }

  if (techniques.every((t) => t === 'naked-single')) { return 'easy' }
  if (techniques.every((t) => t === 'naked-single' || t === 'hidden-single')) { return 'medium' }

  return 'hard-or-expert'
}

/** 嘗試挖洞生成題目；若無法達標則回 null */
function tryGenerate(difficulty: Difficulty, seed: number | undefined, deadline: number): Puzzle | null {
  const rng = createRng(seed)
  const solution = transformSolution(rng)
  const target = DIFFICULTY_TARGET_GIVENS[difficulty]

  // 從完整解開始挖洞
  const cells = shuffle(Array.from({ length: 81 }, (_, i) => i), rng)
  const current = solution.split('')
  let givens = 81

  for (const idx of cells) {
    if (Date.now() > deadline) break
    if (givens <= target.min) break

    const saved = current[idx]
    current[idx] = '.'

    const givenStr = current.join('')

    // 唯一性檢查
    const board = parseBoardString(givenStr)
    if (countSolutions(board, 2) !== 1) {
      // 多解 → 還原
      current[idx] = saved
      continue
    }

    // 難度上限：若超出目標難度（如想要 easy 但已達 medium 以上），還原
    if (givens <= target.max) {
      const classified = classifyDifficulty(givenStr)
      if (
        (difficulty === 'easy' && classified !== 'easy') ||
        (difficulty === 'medium' && classified !== 'easy' && classified !== 'medium') ||
        ((difficulty === 'hard' || difficulty === 'expert') &&
          classified !== 'hard-or-expert' &&
          classified !== 'master') ||
        (difficulty === 'master' && classified !== 'master')
      ) {
        current[idx] = saved
        continue
      }
    }

    givens -= 1
  }

  const finalGiven = current.join('')
  if (givens > target.max) return null
  if (Date.now() > deadline) return null

  // 最終驗證
  const classified = classifyDifficulty(finalGiven)
  if (difficulty === 'easy' && classified !== 'easy') { return null }
  if (difficulty === 'medium' && classified !== 'easy' && classified !== 'medium') { return null }
  if (
    (difficulty === 'hard' || difficulty === 'expert') &&
    classified !== 'hard-or-expert' &&
    classified !== 'master'
  ) {
    return null
  }
  if (difficulty === 'master' && classified !== 'master') { return null }

  return {
    id: `gen-${Date.now()}-${seed ?? 'r'}`,
    difficulty,
    given: finalGiven.split('').map((c) => (c === '.' ? 0 : Number(c))) as CellValue[],
    solution: solution.split('').map((c) => Number(c)) as CellValue[],
  }
}

/**
 * 生成一個指定難度的題目
 * P1 階段：easy / medium 可正確生成；hard / expert 因技巧層尚未完整，採「題目較少 given」+「fallback 必要」作為近似條件
 */
export function generatePuzzle(opts: GenerateOptions): Puzzle {
  const timeout = opts.timeoutMs ?? 10000
  const deadline = Date.now() + timeout

  // 最多嘗試 5 次（不同 variant）
  const maxAttempts = 5
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const seed = opts.seed === undefined ? undefined : opts.seed + attempt
    const puzzle = tryGenerate(opts.difficulty, seed, deadline)
    if (puzzle) return puzzle
    if (Date.now() > deadline) break
  }

  // Fallback：回傳備用 fixture 題目；master 沒有 fixture，退階用 expert
  const fallbackDifficulty: Difficulty =
    opts.difficulty === 'master' ? 'expert' : opts.difficulty
  const candidates = fixturePuzzles.filter((p) => p.difficulty === fallbackDifficulty)
  if (candidates.length === 0) {
    throw new Error(`No fallback fixture for difficulty ${opts.difficulty}`)
  }
  const fixture = candidates[0]
  return {
    id: `fixture-fallback-${fixture.id}`,
    // 保持使用者請求的難度標籤（即使 fixture 來自 expert，仍標示為原請求）
    difficulty: opts.difficulty,
    given: fixture.given.split('').map((c) => (c === '.' || c === '0' ? 0 : Number(c))) as CellValue[],
    solution: fixture.solution.split('').map((c) => Number(c)) as CellValue[],
  }
}

/** 給測試用：以 81 字串建立 Board */
export { parseBoardString, toBoardString, createBoardFromGiven }
