import { describe, expect, it } from 'vitest'
import {
  fixturePuzzles,
  getPuzzle,
  getPuzzlesByDifficulty,
  getScenariosFor,
  techniqueScenarios,
} from '@/fixtures'
import type { TechniqueId } from '@/types'

/** 預先建立每一格的 peer，避免唯一解驗證重複計算。 */
const peerMap = Array.from({ length: 81 }, (_, index) => {
  const row = Math.floor(index / 9)
  const col = index % 9
  const peers = new Set<number>()

  for (let peerCol = 0; peerCol < 9; peerCol++) {
    peers.add(row * 9 + peerCol)
  }

  for (let peerRow = 0; peerRow < 9; peerRow++) {
    peers.add(peerRow * 9 + col)
  }

  const boxRow = Math.floor(row / 3) * 3
  const boxCol = Math.floor(col / 3) * 3
  for (let r = boxRow; r < boxRow + 3; r++) {
    for (let c = boxCol; c < boxCol + 3; c++) {
      peers.add(r * 9 + c)
    }
  }

  peers.delete(index)
  return [...peers]
})

/** 取得某格目前可填的候選數，用於驗證題目是否仍維持唯一解。 */
function getCandidates(grid: number[], index: number): number[] {
  if (grid[index] !== 0) {
    return []
  }

  const used = new Set<number>()
  for (const peer of peerMap[index]) {
    const value = grid[peer]
    if (value !== 0) {
      used.add(value)
    }
  }

  return Array.from({ length: 9 }, (_, value) => value + 1).filter((value) => !used.has(value))
}

/** 用最少搜尋量計數解答數，足以驗證 fixture 是否為唯一解。 */
function countSolutions(grid: number[], limit = 2): number {
  let solutions = 0

  const search = () => {
    if (solutions >= limit) {
      return
    }

    let targetIndex = -1
    let targetCandidates: number[] | null = null

    for (let i = 0; i < 81; i++) {
      if (grid[i] !== 0) {
        continue
      }

      const candidates = getCandidates(grid, i)
      if (candidates.length === 0) {
        return
      }

      if (targetCandidates === null || candidates.length < targetCandidates.length) {
        targetIndex = i
        targetCandidates = candidates
        if (candidates.length === 1) {
          break
        }
      }
    }

    if (targetIndex === -1) {
      solutions += 1
      return
    }

    for (const candidate of targetCandidates ?? []) {
      grid[targetIndex] = candidate
      search()
      grid[targetIndex] = 0
    }
  }

  search()
  return solutions
}

describe('fixturePuzzles', () => {
  it.each(fixturePuzzles)('$id: given/solution length === 81', (p) => {
    expect(p.given).toHaveLength(81)
    expect(p.solution).toHaveLength(81)
  })

  it.each(fixturePuzzles)('$id: given 與 solution 在已填格上一致', (p) => {
    for (let i = 0; i < 81; i++) {
      const givenChar = p.given[i]
      if (givenChar !== '.' && givenChar !== '0') {
        expect(p.solution[i]).toBe(givenChar)
      }
    }
  })

  it.each(fixturePuzzles)('$id: solution 全填且合法（每 row/col/box 含 1-9 各一次）', (p) => {
    expect(p.solution).not.toMatch(/[.0]/)

    const grid = p.solution.split('').map(Number)
    const checkUnit = (indices: number[]) => {
      const values = indices.map((i) => grid[i]).sort((a, b) => a - b)
      expect(values).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9])
    }

    for (let row = 0; row < 9; row++) {
      checkUnit(Array.from({ length: 9 }, (_, col) => row * 9 + col))
    }

    for (let col = 0; col < 9; col++) {
      checkUnit(Array.from({ length: 9 }, (_, row) => row * 9 + col))
    }

    for (let box = 0; box < 9; box++) {
      const boxRow = Math.floor(box / 3) * 3
      const boxCol = (box % 3) * 3
      checkUnit(
        Array.from(
          { length: 9 },
          (_, index) => (boxRow + Math.floor(index / 3)) * 9 + (boxCol + (index % 3)),
        ),
      )
    }
  })

  it('每個難度都有至少 5 題', () => {
    expect(getPuzzlesByDifficulty('easy').length).toBeGreaterThanOrEqual(5)
    expect(getPuzzlesByDifficulty('medium').length).toBeGreaterThanOrEqual(5)
    expect(getPuzzlesByDifficulty('hard').length).toBeGreaterThanOrEqual(5)
    expect(getPuzzlesByDifficulty('expert').length).toBeGreaterThanOrEqual(5)
  })

  it('id 全部唯一', () => {
    const ids = fixturePuzzles.map((p) => p.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it.each(fixturePuzzles)('$id: 題目具有唯一解', (p) => {
    const grid = p.given.split('').map((char) => (char === '.' || char === '0' ? 0 : Number(char)))
    expect(countSolutions(grid)).toBe(1)
  })
})

describe('techniqueScenarios', () => {
  it.each(techniqueScenarios)('$id: given length === 81', (s) => {
    expect(s.input.given).toHaveLength(81)
  })

  it.each(techniqueScenarios)('$id: expected 結構正確', (s) => {
    expect(s.expected.targets.length).toBeGreaterThan(0)

    if (s.expected.action === 'place') {
      expect(s.expected.placements).toBeDefined()
      expect(s.expected.placements?.length).toBeGreaterThan(0)
    } else {
      expect(s.expected.eliminations).toBeDefined()
      expect(s.expected.eliminations?.length).toBeGreaterThan(0)
    }
  })

  it('每個技巧都有至少 3 個場景', () => {
    const techniques: TechniqueId[] = [
      'naked-single',
      'hidden-single',
      'naked-pair',
      'hidden-pair',
      'naked-triple',
      'pointing-pair',
      'box-line-reduction',
    ]

    for (const technique of techniques) {
      expect(getScenariosFor(technique).length).toBeGreaterThanOrEqual(3)
    }
  })

  it('id 全部唯一', () => {
    const ids = techniqueScenarios.map((s) => s.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('helpers', () => {
  it('getPuzzle 找得到', () => {
    const first = fixturePuzzles[0]
    expect(getPuzzle(first.id)).toEqual(first)
  })

  it('getPuzzle 找不到回 undefined', () => {
    expect(getPuzzle('nonexistent-99')).toBeUndefined()
  })
})
