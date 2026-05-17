/**
 * PuzzleInputPanel.vue 測試
 *
 * 測試流程：
 * 1. 文字輸入區：合法字串 / 長度錯誤 / 非法字元 → emit 驗證
 * 2. 按鈕：清空 / 載入範例 / 分析（已有 board / board=null）
 * 3. 棋盤：點格 selectCell / 鍵盤輸入 1-9 / Backspace
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import PuzzleInputPanel from './PuzzleInputPanel.vue'
import { createBoardFromGiven } from '@/core/board'
import type { Board } from '@/types'

// ────────────────────────────────────────────────
// 測試 fixture
// ────────────────────────────────────────────────

/** 81 全空盤面 */
const emptyBoard = createBoardFromGiven(new Array(81).fill(0) as number[] as Parameters<typeof createBoardFromGiven>[0])

/** 合法的 81 字串（標準題目，第一格為 5） */
const VALID_STRING = '530070000600195000098000060800060003400803001700020006060000280000419005000080079'

/** 建立已填部分格的 board（前 9 格為第一列） */
function makeSampleBoard(): Board {
  const values = new Array(81).fill(0)
  values[0] = 5
  values[1] = 3
  return createBoardFromGiven(values as Parameters<typeof createBoardFromGiven>[0])
}

// ────────────────────────────────────────────────
// 輔助：掛載元件
// ────────────────────────────────────────────────

function mountPanel(props: { board: Board | null; selectedIndex: number | null }) {
  return mount(PuzzleInputPanel, {
    props,
    global: {
      // SudokuBoard 需要 focus 能力，jsdom 環境下 stub 掉即可
      stubs: {
        SudokuBoard: {
          template: '<div class="stub-board" @click="$emit(\'selectCell\', 0)" />',
          emits: ['selectCell', 'keyInput'],
          props: ['board', 'selectedIndex', 'conflicts', 'showCandidates'],
        },
      },
    },
  })
}

// ────────────────────────────────────────────────
// 測試案例
// ────────────────────────────────────────────────

describe('PuzzleInputPanel', () => {
  describe('文字輸入 → 載入按鈕', () => {
    it('貼合法 81 字串 → 點載入 → emit update:board，cells[0].value 對應字串首字', async () => {
      const wrapper = mountPanel({ board: null, selectedIndex: null })
      const textarea = wrapper.find('[data-testid="text-input"]')
      await textarea.setValue(VALID_STRING)
      await wrapper.find('[data-testid="btn-load"]').trigger('click')

      const emitted = wrapper.emitted('update:board')
      expect(emitted).toBeTruthy()
      expect(emitted!.length).toBe(1)
      const board = emitted![0][0] as Board
      // VALID_STRING[0] = '5'
      expect(board.cells[0].value).toBe(5)
    })

    it('貼長度錯誤字串 → 點載入 → 顯示含「長度」的錯誤訊息，不 emit update:board', async () => {
      const wrapper = mountPanel({ board: null, selectedIndex: null })
      await wrapper.find('[data-testid="text-input"]').setValue('1234')
      await wrapper.find('[data-testid="btn-load"]').trigger('click')

      expect(wrapper.emitted('update:board')).toBeFalsy()
      const errEl = wrapper.find('[data-testid="error-msg"]')
      expect(errEl.exists()).toBe(true)
      expect(errEl.text()).toContain('長度')
    })

    it('貼非法字元字串 → 點載入 → 顯示含「非法字元」的錯誤訊息', async () => {
      // 81 個字元但包含非法字元 'a'
      const invalidStr = 'a' + '0'.repeat(80)
      const wrapper = mountPanel({ board: null, selectedIndex: null })
      await wrapper.find('[data-testid="text-input"]').setValue(invalidStr)
      await wrapper.find('[data-testid="btn-load"]').trigger('click')

      expect(wrapper.emitted('update:board')).toBeFalsy()
      const errEl = wrapper.find('[data-testid="error-msg"]')
      expect(errEl.exists()).toBe(true)
      expect(errEl.text()).toContain('非法字元')
    })
  })

  describe('按鈕功能', () => {
    it('點清空按鈕 → emit clear', async () => {
      const wrapper = mountPanel({ board: null, selectedIndex: null })
      await wrapper.find('[data-testid="btn-clear"]').trigger('click')
      expect(wrapper.emitted('clear')).toBeTruthy()
    })

    it('點載入範例 → emit loadSample', async () => {
      const wrapper = mountPanel({ board: null, selectedIndex: null })
      await wrapper.find('[data-testid="btn-sample"]').trigger('click')
      expect(wrapper.emitted('loadSample')).toBeTruthy()
    })

    it('board 已設定時點分析 → emit analyze', async () => {
      const board = makeSampleBoard()
      const wrapper = mountPanel({ board, selectedIndex: null })
      await wrapper.find('[data-testid="btn-analyze"]').trigger('click')

      const emitted = wrapper.emitted('analyze')
      expect(emitted).toBeTruthy()
      expect(emitted!.length).toBe(1)
    })

    it('board=null 時分析按鈕 disabled，不 emit analyze', async () => {
      const wrapper = mountPanel({ board: null, selectedIndex: null })
      const analyzeBtn = wrapper.find('[data-testid="btn-analyze"]')
      expect((analyzeBtn.element as HTMLButtonElement).disabled).toBe(true)

      await analyzeBtn.trigger('click')
      expect(wrapper.emitted('analyze')).toBeFalsy()
    })
  })

  describe('棋盤互動', () => {
    it('棋盤點格子 → emit selectCell', async () => {
      const wrapper = mountPanel({ board: null, selectedIndex: null })
      // stub board 點擊會 emit selectCell(0)
      await wrapper.find('.stub-board').trigger('click')
      expect(wrapper.emitted('selectCell')).toBeTruthy()
    })

    it('鍵盤輸入 1-9（board + selectedIndex 已設定）→ emit update:board，對應格 value=N, isGiven=true', async () => {
      const board = emptyBoard
      const wrapper = mountPanel({ board, selectedIndex: 0 })

      // 直接觸發 SudokuBoard stub 的 keyInput 事件
      const boardStub = wrapper.findComponent({ name: 'SudokuBoard' })
      // stub 沒有 keyInput 觸發能力，改找 vm 並直接呼叫 handleKeyInput
      const vm = wrapper.vm as unknown as { handleKeyInput: (p: { index: number; key: string }) => void }
      vm.handleKeyInput({ index: 5, key: '7' })
      await wrapper.vm.$nextTick()

      const emitted = wrapper.emitted('update:board')
      expect(emitted).toBeTruthy()
      const newBoard = emitted![0][0] as Board
      expect(newBoard.cells[5].value).toBe(7)
      expect(newBoard.cells[5].isGiven).toBe(true)
    })

    it('鍵盤 Backspace → emit update:board，對應格 value=0, isGiven=false', async () => {
      const board = makeSampleBoard()
      const wrapper = mountPanel({ board, selectedIndex: 0 })

      const vm = wrapper.vm as unknown as { handleKeyInput: (p: { index: number; key: string }) => void }
      vm.handleKeyInput({ index: 0, key: 'Backspace' })
      await wrapper.vm.$nextTick()

      const emitted = wrapper.emitted('update:board')
      expect(emitted).toBeTruthy()
      const newBoard = emitted![0][0] as Board
      expect(newBoard.cells[0].value).toBe(0)
      expect(newBoard.cells[0].isGiven).toBe(false)
    })
  })
})
