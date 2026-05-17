import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import SudokuBoard from './SudokuBoard.vue'
import { createBoardFromGiven } from '@/core/board'
import type { Board, CellValue, Conflict, CellIndex } from '@/types'

// ────────────────────────────────────────────────
// 測試輔助
// ────────────────────────────────────────────────

/** 建立全空棋盤（81 個 0） */
function makeEmptyBoard(): Board {
  return createBoardFromGiven(Array(81).fill(0) as CellValue[])
}

/** 建立含部分 given 的測試棋盤
 *  given 格：index 0=5、index 10=3，其餘空
 */
function makeSampleBoard(): Board {
  const values = Array(81).fill(0) as CellValue[]
  values[0] = 5
  values[10] = 3
  return createBoardFromGiven(values)
}

// ────────────────────────────────────────────────
// 測試套件
// ────────────────────────────────────────────────

describe('SudokuBoard', () => {
  it('mount 後應渲染 81 個 .cell DOM', () => {
    const board = makeEmptyBoard()
    const wrapper = mount(SudokuBoard, {
      props: {
        board,
        selectedIndex: null,
        conflicts: [],
        showCandidates: false,
      },
    })

    const cells = wrapper.findAll('.cell')
    expect(cells).toHaveLength(81)
  })

  it('given 格應有 .is-given class', () => {
    const board = makeSampleBoard()
    const wrapper = mount(SudokuBoard, {
      props: {
        board,
        selectedIndex: null,
        conflicts: [],
        showCandidates: false,
      },
    })

    const cells = wrapper.findAll('.cell')
    // index 0 是 given
    expect(cells[0].classes()).toContain('is-given')
    // index 10 是 given
    expect(cells[10].classes()).toContain('is-given')
    // index 1 非 given
    expect(cells[1].classes()).not.toContain('is-given')
  })

  it('點擊 cell → emit selectCell 含正確 index', async () => {
    const board = makeEmptyBoard()
    const wrapper = mount(SudokuBoard, {
      props: {
        board,
        selectedIndex: null,
        conflicts: [],
        showCandidates: false,
      },
    })

    const cells = wrapper.findAll('.cell')
    // 點擊 index=5 的格子
    await cells[5].trigger('click')

    const emitted = wrapper.emitted('selectCell')
    expect(emitted).toBeTruthy()
    expect(emitted![0]).toEqual([5])
  })

  it('點擊多個格子 → emit 含正確各自 index', async () => {
    const board = makeEmptyBoard()
    const wrapper = mount(SudokuBoard, {
      props: {
        board,
        selectedIndex: null,
        conflicts: [],
        showCandidates: false,
      },
    })

    const cells = wrapper.findAll('.cell')
    await cells[0].trigger('click')
    await cells[40].trigger('click')
    await cells[80].trigger('click')

    const emitted = wrapper.emitted('selectCell')
    expect(emitted).toHaveLength(3)
    expect(emitted![0]).toEqual([0])
    expect(emitted![1]).toEqual([40])
    expect(emitted![2]).toEqual([80])
  })

  it('傳入 conflicts → 衝突格有 .is-conflict class', () => {
    const board = makeEmptyBoard()
    const conflicts: Conflict[] = [
      { index: 3, conflictWith: [12, 21] },
      { index: 12, conflictWith: [3] },
    ]
    const wrapper = mount(SudokuBoard, {
      props: {
        board,
        selectedIndex: null,
        conflicts,
        showCandidates: false,
      },
    })

    const cells = wrapper.findAll('.cell')
    expect(cells[3].classes()).toContain('is-conflict')
    expect(cells[12].classes()).toContain('is-conflict')
    expect(cells[0].classes()).not.toContain('is-conflict')
  })

  it('傳入 selectedIndex → 該格有 .is-selected', () => {
    const board = makeEmptyBoard()
    const wrapper = mount(SudokuBoard, {
      props: {
        board,
        selectedIndex: 20 as CellIndex,
        conflicts: [],
        showCandidates: false,
      },
    })

    const cells = wrapper.findAll('.cell')
    expect(cells[20].classes()).toContain('is-selected')
    expect(cells[0].classes()).not.toContain('is-selected')
  })

  it('傳入 selectedIndex → 同 row/col/box peer 格有 .is-peer', () => {
    const board = makeEmptyBoard()
    // 選 index=40（row=4, col=4, box=4）
    const wrapper = mount(SudokuBoard, {
      props: {
        board,
        selectedIndex: 40 as CellIndex,
        conflicts: [],
        showCandidates: false,
      },
    })

    const cells = wrapper.findAll('.cell')

    // 同 row 4（index 36..44）—— 排除自身 40
    expect(cells[36].classes()).toContain('is-peer')
    expect(cells[44].classes()).toContain('is-peer')

    // 同 col 4（index 4, 13, 22, 31, 49, 58, 67, 76）
    expect(cells[4].classes()).toContain('is-peer')
    expect(cells[76].classes()).toContain('is-peer')

    // 同 box 4（index 30,31,32,39,40,41,48,49,50）—— 排除自身
    expect(cells[30].classes()).toContain('is-peer')
    expect(cells[50].classes()).toContain('is-peer')

    // 非 peer 格
    expect(cells[0].classes()).not.toContain('is-peer')
    expect(cells[80].classes()).not.toContain('is-peer')
  })

  it('傳入 selectedIndex → 與選中格同值的格有 .is-same-value', () => {
    // 多個格子有相同值 5
    const values = Array(81).fill(0) as CellValue[]
    values[0] = 5  // given
    values[20] = 5 // given，同值
    values[40] = 5 // given，選中
    const board = createBoardFromGiven(values)

    const wrapper = mount(SudokuBoard, {
      props: {
        board,
        selectedIndex: 40 as CellIndex,
        conflicts: [],
        showCandidates: false,
      },
    })

    const cells = wrapper.findAll('.cell')
    // 選中格自身不應有 is-same-value
    expect(cells[40].classes()).not.toContain('is-same-value')
    // 同值格應有 is-same-value（且 0 同 20 不是 peer，也有此 class）
    expect(cells[0].classes()).toContain('is-same-value')
    expect(cells[20].classes()).toContain('is-same-value')
  })

  it('傳入 hintHighlight → targets 有 .is-hint-target，related 有 .is-hint-related', () => {
    const board = makeEmptyBoard()
    const wrapper = mount(SudokuBoard, {
      props: {
        board,
        selectedIndex: null,
        conflicts: [],
        showCandidates: false,
        hintHighlight: {
          targets: [5, 14] as CellIndex[],
          related: [23, 32] as CellIndex[],
        },
      },
    })

    const cells = wrapper.findAll('.cell')
    expect(cells[5].classes()).toContain('is-hint-target')
    expect(cells[14].classes()).toContain('is-hint-target')
    expect(cells[23].classes()).toContain('is-hint-related')
    expect(cells[32].classes()).toContain('is-hint-related')
    expect(cells[0].classes()).not.toContain('is-hint-target')
    expect(cells[0].classes()).not.toContain('is-hint-related')
  })

  it('hintHighlight=null → 無任何 .is-hint-target 或 .is-hint-related', () => {
    const board = makeEmptyBoard()
    const wrapper = mount(SudokuBoard, {
      props: {
        board,
        selectedIndex: null,
        conflicts: [],
        showCandidates: false,
        hintHighlight: null,
      },
    })

    const cells = wrapper.findAll('.cell')
    for (const cell of cells) {
      expect(cell.classes()).not.toContain('is-hint-target')
      expect(cell.classes()).not.toContain('is-hint-related')
    }
  })

  it('showCandidates=true 且格有候選數 → 顯示候選數微網格', () => {
    const board = makeEmptyBoard()
    // 在 index=0 加入候選數 1、5、9
    board.cells[0].candidates.add(1)
    board.cells[0].candidates.add(5)
    board.cells[0].candidates.add(9)

    const wrapper = mount(SudokuBoard, {
      props: {
        board,
        selectedIndex: null,
        conflicts: [],
        showCandidates: true,
      },
    })

    const cells = wrapper.findAll('.cell')
    const candidatesGrid = cells[0].find('.candidates-grid')
    expect(candidatesGrid.exists()).toBe(true)

    // 候選數微網格應有 9 個 span
    const candidateSpans = cells[0].findAll('.candidate')
    expect(candidateSpans).toHaveLength(9)
  })

  it('showCandidates=false → 不顯示候選數微網格', () => {
    const board = makeEmptyBoard()
    board.cells[0].candidates.add(1)

    const wrapper = mount(SudokuBoard, {
      props: {
        board,
        selectedIndex: null,
        conflicts: [],
        showCandidates: false,
      },
    })

    const cells = wrapper.findAll('.cell')
    expect(cells[0].find('.candidates-grid').exists()).toBe(false)
  })
})
