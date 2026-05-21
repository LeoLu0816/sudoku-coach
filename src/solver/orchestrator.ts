import type {
  Board,
  CellValue,
  SolveResult,
  TechniqueId,
  TechniqueSolver,
  TechniqueStep,
} from '@/types'
import { setCellValue, setCandidates, getPeers } from '@/core/board'
import { isSolved, recomputeAllCandidates } from '@/core/validator'
import { solve as backtrackSolve } from '@/solver/backtrack'
import { nakedSingleSolver } from '@/techniques/nakedSingle'
import { hiddenSingleSolver } from '@/techniques/hiddenSingle'
import { nakedPairSolver } from '@/techniques/nakedPair'
import { hiddenPairSolver } from '@/techniques/hiddenPair'
import { nakedTripleSolver } from '@/techniques/nakedTriple'
import { pointingPairSolver } from '@/techniques/pointingPair'
import { boxLineReductionSolver } from '@/techniques/boxLineReduction'
import { hiddenTripleSolver } from '@/techniques/hiddenTriple'
import { nakedQuadSolver } from '@/techniques/nakedQuad'
import { xWingSolver } from '@/techniques/xWing'
import { swordfishSolver } from '@/techniques/swordfish'
import { xyWingSolver } from '@/techniques/xyWing'
import { skyscraperSolver } from '@/techniques/skyscraper'
import { simpleColoringSolver } from '@/techniques/simpleColoring'
import { uniqueRectangleSolver } from '@/techniques/uniqueRectangle'
import { xyzWingSolver } from '@/techniques/xyzWing'

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
  boxLineReductionSolver,
  // Tier 1 高階（依易理解度排序）
  hiddenTripleSolver,
  nakedQuadSolver,
  xWingSolver,
  swordfishSolver,
  xyWingSolver,
  // Tier 2 高階 / 5B（更高階；user-puzzle 仍 fallback 時啟用）
  skyscraperSolver,
  uniqueRectangleSolver,
  xyzWingSolver,
  simpleColoringSolver,
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
 * 套用 step 並做 **增量式** 候選更新，**不會**整盤重算（保留先前 technique 的消去結果）
 * - place：清空目標格自身候選，並從 peer 候選中移除已放入的值
 * - eliminate：applyStep 已完成消去，無需後處理
 *
 * 用途：solveWithSteps / playback 等需要連續套用多個 step 的場景。
 * 不可用 recomputeAllCandidates 取代，否則 eliminate 步驟產生的消去會被一筆抹回。
 */
function applyStepAndUpdate(board: Board, step: TechniqueStep): Board {
  let next = applyStep(board, step)
  if (step.action === 'place' && step.placements) {
    for (const p of step.placements) {
      // 清空已放值格子自身候選
      next = setCandidates(next, p.index, new Set())
      // 從 peer 的候選中移除已放入的值
      for (const peer of getPeers(next, p.index)) {
        if (peer.value !== 0) continue
        if (!peer.candidates.has(p.value)) continue
        const newCands = new Set(peer.candidates)
        newCands.delete(p.value)
        next = setCandidates(next, peer.index, newCands)
      }
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
        outOfTechniqueScope: false,
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
          outOfTechniqueScope: true,
        }
      }
      return {
        solved: false,
        finalBoard: current,
        steps,
        techniqueUsage,
        fallbackUsed: true,
        outOfTechniqueScope: true,
      }
    }

    // 記錄使用次數
    techniqueUsage[found.technique] = (techniqueUsage[found.technique] ?? 0) + 1
    steps.push(found)

    // 套用 step 並做增量更新（保留先前 eliminate 步驟的消去結果）
    current = applyStepAndUpdate(current, found)
  }

  // 迭代上限保護觸發（理論不應發生）
  return {
    solved: false,
    finalBoard: current,
    steps,
    techniqueUsage,
    fallbackUsed: false,
    outOfTechniqueScope: false,
  }
}

/**
 * 給遊戲模式「提示」按鈕用：找下一步推薦
 * 對當前盤面找一個技巧 step；找不到回 null
 *
 * 候選來源策略：
 *   - board 已有候選（使用者按過自動候選、或先前 eliminate hint 已套用）→ 直接沿用，
 *     **不可** 整盤 recompute，否則會把先前 eliminate 步驟消去的候選抹回，
 *     導致同一個裸對 / 隱對被反覆推薦（玩家視覺上「卡住」）。
 *   - board 完全沒候選（使用者沒按過自動候選）→ 整盤重算以便能找到 single 類提示。
 */
export function nextHintStep(board: Board): TechniqueStep | null {
  if (isSolved(board)) return null

  const hasAnyCandidates = board.cells.some((c) => c.candidates.size > 0)
  const current = hasAnyCandidates ? board : recomputeAllCandidates(board)

  for (const tech of registeredTechniques) {
    const step = tech.apply(current)
    if (step) return step
  }
  return null
}

/**
 * 遊戲模式提示：先試技巧，技巧全部失效時 fallback 到「暴力回溯」
 *
 * 行為：
 *   1. 先呼叫 nextHintStep 走標準技巧 pipeline
 *   2. 技巧找不到時：從 puzzle.solution 取出 **index 最小的空格** 的答案，
 *      包成 `place` step（technique='backtrack'）供玩家套用
 *   3. 已解盤 → null
 *
 * 與 solveWithSteps 的 backtrack fallback 不同：
 *   - 這裡每次只回「一格」step，因為提示是逐步引導
 *   - 直接用既有 solution，不重跑 backtrack（更快，也避開使用者填錯值導致盤面無解的情況）
 */
export function nextHintStepWithFallback(
  board: Board,
  solution: ReadonlyArray<number>,
): TechniqueStep | null {
  const techStep = nextHintStep(board)
  if (techStep) return techStep

  if (isSolved(board)) return null

  // 技巧失效：挑 index 最小的空格給暴力回溯提示
  let targetIndex = -1
  for (let i = 0; i < 81; i++) {
    if (board.cells[i].value === 0) {
      targetIndex = i
      break
    }
  }
  if (targetIndex === -1) return null

  const value = solution[targetIndex]
  const row = Math.floor(targetIndex / 9) + 1
  const col = (targetIndex % 9) + 1

  return {
    technique: 'backtrack',
    targets: [targetIndex],
    related: [],
    action: 'place',
    placements: [{ index: targetIndex, value }],
    explanation: `目前已無可推導的邏輯技巧，改用暴力回溯：R${row}C${col} 應填入 ${value}。`,
  }
}

/** 暴露給其他模組（包括測試）的 helper */
export { applyStep, applyStepAndUpdate }

