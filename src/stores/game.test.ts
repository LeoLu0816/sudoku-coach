// @vitest-environment node
import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { fixturePuzzles } from '@/fixtures'
import type { Puzzle } from '@/types'
import { useGameStore } from '@/stores/game'
import { recomputeAllCandidates } from '@/core/validator'

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

  it('applyHint 套用 hint 並推進 board，且自動載入下一步提示', () => {
    const s = useGameStore()
    s.loadPuzzle(fixtureToPuzzle('easy-01'))
    s.requestHint()
    const hint = s.currentHint!
    s.applyHint()
    expect(s.board!.cells[hint.placements![0].index].value).toBe(hint.placements![0].value)
    // easy 題目套用後通常還有下一步；currentHint 應為新的 step（非原 hint），或盤面已解開時為 null
    if (s.currentHint !== null) {
      expect(s.currentHint).not.toBe(hint)
    }
  })

  it('remainingCounts 反映已填數', () => {
    const s = useGameStore()
    s.loadPuzzle(fixtureToPuzzle('easy-01'))
    const counts = s.remainingCounts
    expect(counts).toHaveLength(9)
    expect(counts.every((c) => c >= 0 && c <= 9)).toBe(true)
  })

  it('輸入錯誤值（與 solution 不符）→ errorCount +1 且 wrongCells 含該格', () => {
    const s = useGameStore()
    const puzzle = fixtureToPuzzle('easy-01')
    s.loadPuzzle(puzzle)
    // 找一個非 given 格，故意填一個與 solution 不同的值
    const empty = s.board!.cells.find((c) => !c.isGiven)!
    const correct = puzzle.solution[empty.index]
    const wrong = (correct % 9) + 1 // 不等於 correct 的 1-9 值
    s.selectCell(empty.index)
    s.inputNumber(wrong)
    expect(s.errorCount).toBe(1)
    expect(s.wrongCells).toContain(empty.index)
  })

  it('輸入正確值（與 solution 一致）→ errorCount 不變且 wrongCells 不含該格', () => {
    const s = useGameStore()
    const puzzle = fixtureToPuzzle('easy-01')
    s.loadPuzzle(puzzle)
    const empty = s.board!.cells.find((c) => !c.isGiven)!
    const correct = puzzle.solution[empty.index]
    s.selectCell(empty.index)
    s.inputNumber(correct)
    expect(s.errorCount).toBe(0)
    expect(s.wrongCells).not.toContain(empty.index)
  })

  it('反覆改錯 → errorCount 累加；改回正確 → wrongCells 移除該格但 errorCount 不減', () => {
    const s = useGameStore()
    const puzzle = fixtureToPuzzle('easy-01')
    s.loadPuzzle(puzzle)
    const empty = s.board!.cells.find((c) => !c.isGiven)!
    const correct = puzzle.solution[empty.index]
    const wrong1 = (correct % 9) + 1
    const wrong2 = ((correct + 1) % 9) + 1
    s.selectCell(empty.index)
    s.inputNumber(wrong1)
    s.inputNumber(wrong2 === wrong1 ? ((wrong1 % 9) + 1) : wrong2)
    expect(s.errorCount).toBe(2)
    expect(s.wrongCells).toContain(empty.index)
    s.inputNumber(correct)
    expect(s.errorCount).toBe(2)
    expect(s.wrongCells).not.toContain(empty.index)
  })

  it('applyHint 對 eliminate 類技巧套用後，下一步提示不會回到同一個 eliminate（regression：裸對卡住）', () => {
    const s = useGameStore()
    s.loadPuzzle(fixtureToPuzzle('easy-01'))
    s.fillAllCandidates()
    // 構造一個會真的消去候選的 eliminate hint
    const target = s.board!.cells.find((c) => c.candidates.size >= 2)!
    const toRemove = [...target.candidates][0]
    const fakeHint = {
      technique: 'naked-pair' as const,
      targets: [target.index],
      related: [],
      action: 'eliminate' as const,
      eliminations: [{ index: target.index, values: [toRemove] }],
      explanation: '測試用：模擬裸對 eliminate',
    }
    s.currentHint = fakeHint
    s.applyHint()
    // 套用後該格已不含 toRemove
    expect(s.board!.cells[target.index].candidates.has(toRemove)).toBe(false)
    // currentHint 不應該又指向同樣那筆（含 toRemove）的 eliminate；
    // 也就是 nextHintStep 不能因為整盤重算把 toRemove 抹回後又推薦相同消去
    if (s.currentHint !== null) {
      const stillRecommendsSameElim = s.currentHint.eliminations?.some(
        (e) => e.index === target.index && e.values.includes(toRemove),
      )
      expect(stillRecommendsSameElim).not.toBe(true)
    }
  })

  it('applyHint 對 eliminate 類技巧（隱對/裸對）確實消去候選', () => {
    const s = useGameStore()
    s.loadPuzzle(fixtureToPuzzle('easy-01'))
    // 先一次性把候選算好，模擬使用者按過「自動候選」
    s.fillAllCandidates()
    const cellWithCandidates = s.board!.cells.find((c) => c.candidates.size >= 2)
    if (!cellWithCandidates) {
      throw new Error('找不到有 2+ 候選的格子')
    }
    const toRemove = [...cellWithCandidates.candidates][0]
    const before = new Set(cellWithCandidates.candidates)
    s.currentHint = {
      technique: 'hidden-pair',
      targets: [cellWithCandidates.index],
      related: [],
      action: 'eliminate',
      eliminations: [{ index: cellWithCandidates.index, values: [toRemove] }],
      explanation: '測試用',
    }
    s.applyHint()
    const after = s.board!.cells[cellWithCandidates.index].candidates
    expect(after.has(toRemove)).toBe(false)
    expect(after.size).toBe(before.size - 1)
  })

  it('applyHint 對 eliminate 類技巧 (board 候選全空) 自動補上候選並消去', () => {
    const s = useGameStore()
    s.loadPuzzle(fixtureToPuzzle('easy-01'))
    // 候選全空
    expect(s.board!.cells.every((c) => c.candidates.size === 0)).toBe(true)
    // 先 recompute 一次以取得某格的合法候選作為「待消除」標的
    const tempBoard = recomputeAllCandidates(s.board!)
    const targetCell = tempBoard.cells.find((c) => c.candidates.size >= 2)!
    const toRemove = [...targetCell.candidates][0]
    s.currentHint = {
      technique: 'hidden-pair',
      targets: [targetCell.index],
      related: [],
      action: 'eliminate',
      eliminations: [{ index: targetCell.index, values: [toRemove] }],
      explanation: '測試用',
    }
    s.applyHint()
    // 候選被消去（applyHint 內部已先補候選）
    expect(s.board!.cells[targetCell.index].candidates.has(toRemove)).toBe(false)
    // 其他空格也都有候選了
    expect(s.board!.cells.some((c) => c.candidates.size > 0)).toBe(true)
  })

  it('fillAllCandidates 一次填入所有空格的合法候選', () => {
    const s = useGameStore()
    s.loadPuzzle(fixtureToPuzzle('easy-01'))
    // 初始候選全空
    expect(s.board!.cells.every((c) => c.candidates.size === 0)).toBe(true)
    s.fillAllCandidates()
    // 所有空格都有候選
    for (const cell of s.board!.cells) {
      if (cell.value === 0) {
        expect(cell.candidates.size).toBeGreaterThan(0)
      } else {
        expect(cell.candidates.size).toBe(0)
      }
    }
  })

  it('clearAllCandidates 清空所有候選', () => {
    const s = useGameStore()
    s.loadPuzzle(fixtureToPuzzle('easy-01'))
    s.fillAllCandidates()
    expect(s.board!.cells.some((c) => c.candidates.size > 0)).toBe(true)
    s.clearAllCandidates()
    expect(s.board!.cells.every((c) => c.candidates.size === 0)).toBe(true)
  })

  it('inputNumber 填值後對 peer 候選做增量更新（不抹掉先前 hint eliminate）', () => {
    const s = useGameStore()
    s.loadPuzzle(fixtureToPuzzle('easy-01'))
    s.fillAllCandidates()
    // 找一個非 given 的空格，取得其 row/col/box 中某 peer
    const empty = s.board!.cells.find((c) => !c.isGiven && c.value === 0)!
    const peer = s.board!.cells.find(
      (c) =>
        c.index !== empty.index &&
        c.value === 0 &&
        (c.row === empty.row || c.col === empty.col || c.box === empty.box),
    )!
    // 找一個 peer 候選中存在、且我們可以合法填的數字
    const candidatesForEmpty = [...empty.candidates]
    const placedValue = candidatesForEmpty.find((v) => peer.candidates.has(v))
    if (placedValue === undefined) {
      // 找不到就跳過此用例
      return
    }
    s.selectCell(empty.index)
    s.inputNumber(placedValue)
    // peer 候選應已移除 placedValue
    expect(s.board!.cells[peer.index].candidates.has(placedValue)).toBe(false)
    // 自身候選被清空
    expect(s.board!.cells[empty.index].candidates.size).toBe(0)
  })

  it('clearWrongCells 一次清空所有錯誤格，errorCount 不變且可 undo', () => {
    const s = useGameStore()
    const puzzle = fixtureToPuzzle('easy-01')
    s.loadPuzzle(puzzle)
    // 故意在兩個非 given 格填錯
    const emptyCells = s.board!.cells.filter((c) => !c.isGiven).slice(0, 2)
    const wrongValues: number[] = []
    for (const c of emptyCells) {
      const w = (puzzle.solution[c.index] % 9) + 1
      wrongValues.push(w)
      s.selectCell(c.index)
      s.inputNumber(w)
    }
    expect(s.errorCount).toBe(2)
    expect(s.wrongCells.length).toBe(2)

    s.clearWrongCells()
    // 兩格都被清空
    for (const c of emptyCells) {
      expect(s.board!.cells[c.index].value).toBe(0)
    }
    // 錯誤計數保留（為歷史紀錄）
    expect(s.errorCount).toBe(2)
    expect(s.wrongCells.length).toBe(0)

    // undo 一次能把兩格的值同時還原
    s.undo()
    expect(s.board!.cells[emptyCells[0].index].value).toBe(wrongValues[0])
    expect(s.board!.cells[emptyCells[1].index].value).toBe(wrongValues[1])
  })

  it('clearWrongCells 在 wrongCells 為空時為 no-op（不改動 board / history）', () => {
    const s = useGameStore()
    s.loadPuzzle(fixtureToPuzzle('easy-01'))
    const before = s.board
    const hLen = s.history.length
    s.clearWrongCells()
    expect(s.board).toBe(before)
    expect(s.history.length).toBe(hLen)
  })

  it('requestHint 在技巧全部失效時 fallback 到暴力回溯（避免玩家卡關）', () => {
    const s = useGameStore()
    const puzzle = fixtureToPuzzle('easy-01')
    // 拿 easy 題的 solution 構造 puzzle，但 given 全空 → 技巧無法找 step
    const emptyPuzzle: Puzzle = {
      id: 'empty-test',
      difficulty: 'easy',
      given: Array(81).fill(0) as Puzzle['given'],
      solution: puzzle.solution,
    }
    s.loadPuzzle(emptyPuzzle)
    s.requestHint()
    expect(s.currentHint).not.toBeNull()
    expect(s.currentHint!.technique).toBe('backtrack')
    expect(s.currentHint!.action).toBe('place')
    expect(s.currentHint!.placements![0].index).toBe(0)
    expect(s.currentHint!.placements![0].value).toBe(emptyPuzzle.solution[0])
  })

  it('applyHint 套用暴力回溯後，自動推進的下一步仍會優先回到技巧', () => {
    const s = useGameStore()
    const puzzle = fixtureToPuzzle('easy-01')
    const emptyPuzzle: Puzzle = {
      id: 'empty-test',
      difficulty: 'easy',
      given: Array(81).fill(0) as Puzzle['given'],
      solution: puzzle.solution,
    }
    s.loadPuzzle(emptyPuzzle)
    s.requestHint()
    // 第一發：fallback 給 backtrack
    expect(s.currentHint!.technique).toBe('backtrack')
    s.applyHint()
    // 套用後 board 上 index 0 已填入 solution[0]
    expect(s.board!.cells[0].value).toBe(emptyPuzzle.solution[0])
    // 自動推進：可能是技巧或仍是 backtrack（取決於剩餘盤面），但不應該卡住為 null
    expect(s.currentHint).not.toBeNull()
  })

  it('newGame / loadPuzzle 後 errorCount 歸零', () => {
    const s = useGameStore()
    const puzzle = fixtureToPuzzle('easy-01')
    s.loadPuzzle(puzzle)
    const empty = s.board!.cells.find((c) => !c.isGiven)!
    const wrong = (puzzle.solution[empty.index] % 9) + 1
    s.selectCell(empty.index)
    s.inputNumber(wrong)
    expect(s.errorCount).toBe(1)
    s.loadPuzzle(fixtureToPuzzle('easy-01'))
    expect(s.errorCount).toBe(0)
    expect(s.wrongCells).toEqual([])
  })
})
