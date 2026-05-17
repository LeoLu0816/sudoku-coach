import type {
  Board,
  CellValue,
  SolveResult,
  TechniqueId,
  TechniqueSolver,
  TechniqueStep,
} from '@/types'
import { setCellValue, setCandidates } from '@/core/board'
import { isSolved, recomputeAllCandidates } from '@/core/validator'
import { solve as backtrackSolve } from '@/solver/backtrack'
import { nakedSingleSolver } from '@/techniques/nakedSingle'
import { hiddenSingleSolver } from '@/techniques/hiddenSingle'
import { nakedPairSolver } from '@/techniques/nakedPair'
import { hiddenPairSolver } from '@/techniques/hiddenPair'
import { nakedTripleSolver } from '@/techniques/nakedTriple'
import { pointingPairSolver } from '@/techniques/pointingPair'

/**
 * 已註冊的技巧 solver 清單（依難度由低到高，與難度分級對應）
 * 順序與難度分級一致：基礎（single）→ 中階（pair/triple/pointing/box-line）
 */
const registeredTechniques: TechniqueSolver[] = [
  nakedSingleSolver,
  hiddenSingleSolver,
  nakedPairSolver,
  hiddenPairSolver,
  nakedTripleSolver,
  pointingPairSolver,
]

/** 取得所有已註冊技巧（依優先順序） */
export function getRegisteredTechniques(): TechniqueSolver[] {
  return [...registeredTechniques]
}

/**
 * 將 TechniqueStep 套用到 Board，回傳新 Board
 * - action='place'：對 placements 中每筆呼叫 setCellValue
 * - action='eliminate'：從 candidates 移除對應值
 */
function applyStep(board: Board, step: TechniqueStep): Board {
  let next = board
  if (step.action === 'place' && step.placements) {
    for (const p of step.placements) {
      next = setCellValue(next, p.index, p.value as CellValue)
    }
  } else if (step.action === 'eliminate' && step.eliminations) {
    for (const e of step.eliminations) {
      const current = new Set(next.cells[e.index].candidates)
      for (const v of e.values) current.delete(v)
      next = setCandidates(next, e.index, current)
    }
  }
  return next
}

/**
 * 完整解題：迭代套用技巧 solver，全部失效時 fallback 到 backtrack
 *
 * 流程：
 * 1. recompute candidates
 * 2. 依優先順序試每個技巧
 * 3. 找到 step → 套用 → recompute candidates → 回到步驟 2
 * 4. 全部技巧都找不到 step → fallback 到 backtrack
 * 5. 解完 / 解不開 → 回傳 SolveResult
 */
export function solveWithSteps(board: Board): SolveResult {
  let current = recomputeAllCandidates(board)
  const steps: TechniqueStep[] = []
  const techniqueUsage: Partial<Record<TechniqueId, number>> = {}

  // 上限保護：避免任何邏輯錯誤造成無限迴圈
  const maxIterations = 1000

  for (let iter = 0; iter < maxIterations; iter++) {
    if (isSolved(current)) {
      return {
        solved: true,
        finalBoard: current,
        steps,
        techniqueUsage,
        fallbackUsed: false,
      }
    }

    let found: TechniqueStep | null = null
    for (const tech of registeredTechniques) {
      const step = tech.apply(current)
      if (step) {
        found = step
        break
      }
    }

    if (!found) {
      // 技巧層全部失效，fallback 到 backtrack
      const fallback = backtrackSolve(current)
      if (fallback) {
        return {
          solved: true,
          finalBoard: fallback,
          steps,
          techniqueUsage,
          fallbackUsed: true,
        }
      }
      return {
        solved: false,
        finalBoard: current,
        steps,
        techniqueUsage,
        fallbackUsed: true,
      }
    }

    // 記錄使用次數
    techniqueUsage[found.technique] = (techniqueUsage[found.technique] ?? 0) + 1
    steps.push(found)

    // 套用 step 並重算 candidates，準備下一輪
    current = recomputeAllCandidates(applyStep(current, found))
  }

  // 迭代上限保護觸發（理論不應發生）
  return {
    solved: false,
    finalBoard: current,
    steps,
    techniqueUsage,
    fallbackUsed: false,
  }
}

/**
 * 給遊戲模式「提示」按鈕用：找下一步推薦
 * 對當前盤面找一個技巧 step；找不到回 null
 */
export function nextHintStep(board: Board): TechniqueStep | null {
  if (isSolved(board)) return null

  const current = recomputeAllCandidates(board)
  for (const tech of registeredTechniques) {
    const step = tech.apply(current)
    if (step) return step
  }
  return null
}

/** 暴露給其他模組（包括測試）的 applyStep helper */
export { applyStep }

