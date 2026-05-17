// jsdom 環境取得 localStorage（Vitest 預設）
import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { fixturePuzzles } from '@/fixtures'
import type { Puzzle } from '@/types'
import { useGameStore } from '@/stores/game'
import { __STORAGE_KEY__, clearProgress, loadProgress, saveProgress } from '@/stores/persistence'

function fixtureToPuzzle(id: string): Puzzle {
  const p = fixturePuzzles.find((x) => x.id === id)!
  return {
    id: p.id,
    difficulty: p.difficulty,
    given: p.given.split('').map((c) => (c === '.' || c === '0' ? 0 : Number(c))) as Puzzle['given'],
    solution: p.solution.split('').map((c) => Number(c)) as Puzzle['solution'],
  }
}

describe('persistence', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('save → load round-trip 還原 puzzle 與 board', () => {
    const s = useGameStore()
    s.loadPuzzle(fixtureToPuzzle('easy-01'))
    // 模擬玩家動作
    const empty = s.board!.cells.find((c) => !c.isGiven)!
    s.selectCell(empty.index)
    s.inputNumber(5)

    saveProgress()

    // 重置 pinia 與 store
    setActivePinia(createPinia())
    const s2 = useGameStore()
    expect(s2.board).toBeNull()

    expect(loadProgress()).toBe(true)
    expect(s2.puzzle?.id).toBe('easy-01')
    expect(s2.board).not.toBeNull()
    expect(s2.board!.cells[empty.index].value).toBe(5)
  })

  it('loadProgress 對空 storage 回 false', () => {
    expect(loadProgress()).toBe(false)
  })

  it('loadProgress 對壞 JSON 回 false', () => {
    localStorage.setItem(__STORAGE_KEY__, '{not json')
    expect(loadProgress()).toBe(false)
  })

  it('clearProgress 移除 key', () => {
    const s = useGameStore()
    s.loadPuzzle(fixtureToPuzzle('easy-01'))
    saveProgress()
    expect(localStorage.getItem(__STORAGE_KEY__)).not.toBeNull()
    clearProgress()
    expect(localStorage.getItem(__STORAGE_KEY__)).toBeNull()
  })
})
