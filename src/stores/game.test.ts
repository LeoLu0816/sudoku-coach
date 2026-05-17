// @vitest-environment node
import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { fixturePuzzles } from '@/fixtures'
import type { Puzzle } from '@/types'
import { useGameStore } from '@/stores/game'

/** 由 fixture 取得一個 puzzle 物件 */
function fixtureToPuzzle(id: string): Puzzle {
  const p = fixturePuzzles.find((x) => x.id === id)!
  return {
    id: p.id,
    difficulty: p.difficulty,
    given: p.given.split('').map((c) => (c === '.' || c === '0' ? 0 : Number(c))) as Puzzle['given'],
    solution: p.solution.split('').map((c) => Number(c)) as Puzzle['solution'],
  }
}

describe('useGameStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('初始狀態為空', () => {
    const s = useGameStore()
    expect(s.board).toBeNull()
    expect(s.puzzle).toBeNull()
    expect(s.selectedIndex).toBeNull()
    expect(s.canUndo).toBe(false)
    expect(s.canRedo).toBe(false)
  })

  it('loadPuzzle 後 board 就緒', () => {
    const s = useGameStore()
    s.loadPuzzle(fixtureToPuzzle('easy-01'))
    expect(s.board).not.toBeNull()
    expect(s.board!.cells).toHaveLength(81)
  })

  it('selectCell 設定 selectedIndex', () => {
    const s = useGameStore()
    s.loadPuzzle(fixtureToPuzzle('easy-01'))
    s.selectCell(40)
    expect(s.selectedIndex).toBe(40)
  })

  it('inputNumber 非鉛筆模式 → 填值', () => {
    const s = useGameStore()
    s.loadPuzzle(fixtureToPuzzle('easy-01'))
    // 找一個非 given 格
    const empty = s.board!.cells.find((c) => !c.isGiven)!
    s.selectCell(empty.index)
    s.inputNumber(5)
    expect(s.board!.cells[empty.index].value).toBe(5)
  })

  it('inputNumber 鉛筆模式 → 切換候選', () => {
    const s = useGameStore()
    s.loadPuzzle(fixtureToPuzzle('easy-01'))
    const empty = s.board!.cells.find((c) => !c.isGiven)!
    s.selectCell(empty.index)
    s.togglePencil()
    s.inputNumber(3)
    expect(s.board!.cells[empty.index].candidates.has(3)).toBe(true)
    s.inputNumber(3)
    expect(s.board!.cells[empty.index].candidates.has(3)).toBe(false)
  })

  it('給定格不可修改', () => {
    const s = useGameStore()
    s.loadPuzzle(fixtureToPuzzle('easy-01'))
    const given = s.board!.cells.find((c) => c.isGiven)!
    const before = given.value
    s.selectCell(given.index)
    s.inputNumber(9)
    expect(s.board!.cells[given.index].value).toBe(before)
  })

  it('undo / redo 序列正確', () => {
    const s = useGameStore()
    s.loadPuzzle(fixtureToPuzzle('easy-01'))
    const empty = s.board!.cells.find((c) => !c.isGiven)!
    s.selectCell(empty.index)
    s.inputNumber(5)
    expect(s.board!.cells[empty.index].value).toBe(5)
    s.undo()
    expect(s.board!.cells[empty.index].value).toBe(0)
    s.redo()
    expect(s.board!.cells[empty.index].value).toBe(5)
  })

  it('clearCell 清除值', () => {
    const s = useGameStore()
    s.loadPuzzle(fixtureToPuzzle('easy-01'))
    const empty = s.board!.cells.find((c) => !c.isGiven)!
    s.selectCell(empty.index)
    s.inputNumber(5)
    s.clearCell()
    expect(s.board!.cells[empty.index].value).toBe(0)
  })

  it('requestHint 對未解盤回 step', () => {
    const s = useGameStore()
    s.loadPuzzle(fixtureToPuzzle('easy-01'))
    s.requestHint()
    expect(s.currentHint).not.toBeNull()
  })

  it('applyHint 套用 hint 並推進 board', () => {
    const s = useGameStore()
    s.loadPuzzle(fixtureToPuzzle('easy-01'))
    s.requestHint()
    const hint = s.currentHint!
    s.applyHint()
    expect(s.board!.cells[hint.placements![0].index].value).toBe(hint.placements![0].value)
    expect(s.currentHint).toBeNull() // applyHint 後清空
  })

  it('remainingCounts 反映已填數', () => {
    const s = useGameStore()
    s.loadPuzzle(fixtureToPuzzle('easy-01'))
    const counts = s.remainingCounts
    expect(counts).toHaveLength(9)
    expect(counts.every((c) => c >= 0 && c <= 9)).toBe(true)
  })
})
