import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Board, Difficulty, SolveResult, TechniqueId } from '@/types'
import { countSolutions } from '@/solver/backtrack'
import { solveWithSteps } from '@/solver/orchestrator'

/**
 * 分析結果介面
 */
export interface AnalyzeResult {
  /** 是否為唯一解 */
  isUnique: boolean
  /** 唯一解時的難度判定；非唯一解時為 null */
  difficulty: Difficulty | null
  /** 唯一解時的 orchestrator 解題結果；非唯一解時為 null */
  solveResult: SolveResult | null
  /** 無解或多解時的錯誤訊息 */
  error?: string
}

/**
 * 依 techniqueUsage 與 fallbackUsed 判定難度等級
 *
 * 規則（由高到低優先）：
 * 1. fallbackUsed = true → 'expert'
 * 2. 出現 box-line-reduction / pointing-pair / naked-triple → 'expert'
 * 3. 出現 naked-pair / hidden-pair → 'hard'
 * 4. 出現 hidden-single → 'medium'
 * 5. 其餘（僅 naked-single）→ 'easy'
 */
export function determineDifficulty(
  usage: Partial<Record<TechniqueId, number>>,
  fallbackUsed: boolean,
): Difficulty {
  // fallback 使用到 backtrack，超出技巧範圍
  if (fallbackUsed) {
    return 'expert'
  }

  // 檢查是否用到進階技巧（expert 等級）
  const expertTechniques: TechniqueId[] = ['box-line-reduction', 'pointing-pair', 'naked-triple']
  for (const tech of expertTechniques) {
    if ((usage[tech] ?? 0) > 0) {
      return 'expert'
    }
  }

  // 檢查是否用到中高階技巧（hard 等級）
  const hardTechniques: TechniqueId[] = ['naked-pair', 'hidden-pair']
  for (const tech of hardTechniques) {
    if ((usage[tech] ?? 0) > 0) {
      return 'hard'
    }
  }

  // 檢查是否用到隱性單數（medium 等級）
  if ((usage['hidden-single'] ?? 0) > 0) {
    return 'medium'
  }

  // 僅用 naked-single
  return 'easy'
}

/**
 * 分析模式 Pinia store（Setup 形式）
 * - setInputBoard：設定輸入盤面（不分析）
 * - analyze：執行分析，判定唯一性 / 難度 / 解題步驟
 * - clear：清空所有狀態
 */
export const useAnalyzeStore = defineStore('analyze', () => {
  // ─── State ────────────────────────────────────────────────────────────
  const inputBoard = ref<Board | null>(null)
  const result = ref<AnalyzeResult | null>(null)

  // ─── Actions ──────────────────────────────────────────────────────────

  /**
   * 設定輸入盤面，不觸發分析
   */
  function setInputBoard(board: Board): void {
    inputBoard.value = board
  }

  /**
   * 分析指定盤面
   * 1. countSolutions(board, 2) 檢查解的數量
   * 2. 0 解 → 設定無解錯誤
   * 3. ≥2 解 → 設定多解錯誤
   * 4. 唯一解 → solveWithSteps 取得步驟，判定難度
   */
  function analyze(board: Board): void {
    inputBoard.value = board

    // 1. 檢查解的數量（最多計到 2）
    const count = countSolutions(board, 2)

    if (count === 0) {
      // 無解情況
      result.value = {
        isUnique: false,
        difficulty: null,
        solveResult: null,
        error: '此盤面無解',
      }
      return
    }

    if (count >= 2) {
      // 多解情況
      result.value = {
        isUnique: false,
        difficulty: null,
        solveResult: null,
        error: '此盤面非唯一解，無法分析',
      }
      return
    }

    // 唯一解：取得完整解題步驟並判定難度
    const solveResult = solveWithSteps(board)
    const difficulty = determineDifficulty(solveResult.techniqueUsage, solveResult.fallbackUsed)

    result.value = {
      isUnique: true,
      difficulty,
      solveResult,
    }
  }

  /**
   * 清空所有狀態
   */
  function clear(): void {
    inputBoard.value = null
    result.value = null
  }

  return {
    // state
    inputBoard,
    result,
    // actions
    setInputBoard,
    analyze,
    clear,
  }
})
