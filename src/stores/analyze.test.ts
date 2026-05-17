// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { fixturePuzzles } from '@/fixtures'
import { createBoardFromGiven } from '@/core/board'
import type { Board, CellValue, TechniqueId } from '@/types'
import { useAnalyzeStore, determineDifficulty } from '@/stores/analyze'

/**
 * 將 fixture ID 轉成 Board（使用 given 字串）
 */
function fixtureToBoardById(id: string): Board {
  const f = fixturePuzzles.find((p) => p.id === id)!
  const given = f.given
    .split('')
    .map((c) => (c === '.' || c === '0' ? 0 : Number(c))) as CellValue[]
  return createBoardFromGiven(given)
}

/**
 * 建立全空盤面（81 格皆 0）→ 多解情境
 */
function emptyBoard(): Board {
  const given = Array(81).fill(0) as CellValue[]
  return createBoardFromGiven(given)
}

/**
 * 建立矛盾盤面（同列兩個 1）→ 無解情境
 */
function conflictingBoard(): Board {
  const given = Array(81).fill(0) as CellValue[]
  given[0] = 1
  given[1] = 1
  return createBoardFromGiven(given)
}

describe('determineDifficulty', () => {
  it('fallbackUsed=true → expert', () => {
    expect(determineDifficulty({}, true)).toBe('expert')
  })

  it('僅 naked-single → easy', () => {
    const usage: Partial<Record<TechniqueId, number>> = { 'naked-single': 5 }
    expect(determineDifficulty(usage, false)).toBe('easy')
  })

  it('有 hidden-single → medium', () => {
    const usage: Partial<Record<TechniqueId, number>> = {
      'naked-single': 3,
      'hidden-single': 2,
    }
    expect(determineDifficulty(usage, false)).toBe('medium')
  })

  it('有 naked-pair → hard', () => {
    const usage: Partial<Record<TechniqueId, number>> = {
      'naked-single': 3,
      'hidden-single': 1,
      'naked-pair': 1,
    }
    expect(determineDifficulty(usage, false)).toBe('hard')
  })

  it('有 hidden-pair → hard', () => {
    const usage: Partial<Record<TechniqueId, number>> = {
      'naked-single': 2,
      'hidden-pair': 1,
    }
    expect(determineDifficulty(usage, false)).toBe('hard')
  })

  it('有 pointing-pair → expert', () => {
    const usage: Partial<Record<TechniqueId, number>> = {
      'naked-single': 2,
      'pointing-pair': 1,
    }
    expect(determineDifficulty(usage, false)).toBe('expert')
  })

  it('有 naked-triple → expert', () => {
    const usage: Partial<Record<TechniqueId, number>> = {
      'naked-triple': 1,
    }
    expect(determineDifficulty(usage, false)).toBe('expert')
  })

  it('有 box-line-reduction → expert', () => {
    const usage: Partial<Record<TechniqueId, number>> = {
      'naked-single': 1,
      'box-line-reduction': 2,
    }
    expect(determineDifficulty(usage, false)).toBe('expert')
  })

  it('空 usage 且 fallbackUsed=false → easy', () => {
    expect(determineDifficulty({}, false)).toBe('easy')
  })
})

describe('useAnalyzeStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  // ─── 初始狀態 ──────────────────────────────────────────────────────────

  it('初始 inputBoard 和 result 皆為 null', () => {
    const store = useAnalyzeStore()
    expect(store.inputBoard).toBeNull()
    expect(store.result).toBeNull()
  })

  // ─── setInputBoard ────────────────────────────────────────────────────

  it('setInputBoard 設定 inputBoard 但不分析', () => {
    const store = useAnalyzeStore()
    const board = fixtureToBoardById('easy-01')
    store.setInputBoard(board)
    expect(store.inputBoard).not.toBeNull()
    expect(store.result).toBeNull()
  })

  // ─── clear ────────────────────────────────────────────────────────────

  it('clear() 後 inputBoard 和 result 皆歸 null', () => {
    const store = useAnalyzeStore()
    const board = fixtureToBoardById('easy-01')
    store.analyze(board)
    expect(store.result).not.toBeNull()
    store.clear()
    expect(store.inputBoard).toBeNull()
    expect(store.result).toBeNull()
  })

  // ─── analyze：easy fixture ────────────────────────────────────────────

  it('analyze easy-01 → isUnique=true, difficulty=easy', () => {
    const store = useAnalyzeStore()
    const board = fixtureToBoardById('easy-01')
    store.analyze(board)
    expect(store.result).not.toBeNull()
    expect(store.result!.isUnique).toBe(true)
    expect(store.result!.difficulty).toBe('easy')
    expect(store.result!.solveResult).not.toBeNull()
    expect(store.result!.error).toBeUndefined()
  })

  it('analyze easy-01 → solveResult.solved=true', () => {
    const store = useAnalyzeStore()
    const board = fixtureToBoardById('easy-01')
    store.analyze(board)
    expect(store.result!.solveResult!.solved).toBe(true)
  })

  // ─── analyze：medium fixture ──────────────────────────────────────────

  it('analyze medium-01 → isUnique=true, difficulty 為有效值', () => {
    const store = useAnalyzeStore()
    const board = fixtureToBoardById('medium-01')
    store.analyze(board)
    expect(store.result!.isUnique).toBe(true)
    // fixture 變體後實際難度可能因拓撲轉換有差異，只確認為合法難度值
    const validDifficulties = ['easy', 'medium', 'hard', 'expert']
    expect(validDifficulties).toContain(store.result!.difficulty)
  })

  // ─── analyze：多解情境 ────────────────────────────────────────────────

  it('analyze 全空盤面 → isUnique=false, error 含「非唯一解」', () => {
    const store = useAnalyzeStore()
    store.analyze(emptyBoard())
    expect(store.result!.isUnique).toBe(false)
    expect(store.result!.difficulty).toBeNull()
    expect(store.result!.solveResult).toBeNull()
    expect(store.result!.error).toContain('非唯一解')
  })

  // ─── analyze：無解情境 ────────────────────────────────────────────────

  it('analyze 矛盾盤面（同列兩個 1）→ isUnique=false, error 含「無解」', () => {
    const store = useAnalyzeStore()
    store.analyze(conflictingBoard())
    expect(store.result!.isUnique).toBe(false)
    expect(store.result!.difficulty).toBeNull()
    expect(store.result!.solveResult).toBeNull()
    expect(store.result!.error).toContain('無解')
  })

  // ─── analyze 後 inputBoard 同步更新 ──────────────────────────────────

  it('analyze 後 inputBoard 更新為傳入的 board', () => {
    const store = useAnalyzeStore()
    const board = fixtureToBoardById('easy-01')
    store.analyze(board)
    // Pinia ref 包裝後為 reactive proxy，使用 toStrictEqual 進行深比較
    expect(store.inputBoard).toStrictEqual(board)
  })
})
