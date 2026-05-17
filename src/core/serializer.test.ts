import { describe, expect, it } from 'vitest'
import { setCandidates, setCellValue } from '@/core/board'
import { SerializeError, fromJSON, parseBoardString, toBoardString, toJSON } from '@/core/serializer'

describe('parseBoardString', () => {
  const sample = '534678912672195348198342567859761423426853791713924856961537284287419635345286179'

  it('解析 81 字串', () => {
    const board = parseBoardString(sample)
    expect(board.cells[0].value).toBe(5)
    expect(board.cells[80].value).toBe(9)
  })

  it("接受 '.' 與 '0' 作為空格", () => {
    const withDot = '.'.repeat(81)
    const withZero = '0'.repeat(81)
    expect(parseBoardString(withDot).cells.every((c) => c.value === 0)).toBe(true)
    expect(parseBoardString(withZero).cells.every((c) => c.value === 0)).toBe(true)
  })

  it('忽略空白與換行', () => {
    const multiline = sample.match(/.{1,9}/g)!.join('\n')
    const board = parseBoardString(multiline)
    expect(board.cells[0].value).toBe(5)
  })

  it('length 錯誤 → SerializeError length', () => {
    try {
      parseBoardString('123')
      throw new Error('expected throw')
    } catch (e) {
      expect(e).toBeInstanceOf(SerializeError)
      expect((e as SerializeError).reason).toBe('length')
    }
  })

  it('invalid char → SerializeError invalid-char', () => {
    const bad = 'a' + '.'.repeat(80)
    try {
      parseBoardString(bad)
      throw new Error('expected throw')
    } catch (e) {
      expect(e).toBeInstanceOf(SerializeError)
      expect((e as SerializeError).reason).toBe('invalid-char')
    }
  })
})

describe('toBoardString', () => {
  it('round-trip 結果一致', () => {
    const sample = '534678912672195348198342567859761423426853791713924856961537284287419635345286179'
    const board = parseBoardString(sample)
    expect(toBoardString(board)).toBe(sample)
  })

  it("空格使用 '.'", () => {
    const board = parseBoardString('.'.repeat(81))
    expect(toBoardString(board)).toBe('.'.repeat(81))
  })
})

describe('JSON round-trip', () => {
  it('保留候選數', () => {
    let board = parseBoardString('.'.repeat(81))
    board = setCellValue(board, 0, 5)
    board = setCandidates(board, 1, new Set([1, 3, 7]))

    const json = toJSON(board)
    const restored = fromJSON(json)

    expect(restored.cells[0].value).toBe(5)
    expect([...restored.cells[1].candidates].sort()).toEqual([1, 3, 7])
  })

  it('壞 JSON → SerializeError json-parse', () => {
    try {
      fromJSON('{ not json')
      throw new Error('expected throw')
    } catch (e) {
      expect(e).toBeInstanceOf(SerializeError)
      expect((e as SerializeError).reason).toBe('json-parse')
    }
  })

  it('cells 長度錯誤 → SerializeError json-parse', () => {
    try {
      fromJSON('{"cells":[]}')
      throw new Error('expected throw')
    } catch (e) {
      expect(e).toBeInstanceOf(SerializeError)
      expect((e as SerializeError).reason).toBe('json-parse')
    }
  })
})
