import type { Board, Cell, CellValue } from '@/types'
import { createBoardFromGiven } from '@/core/board'

/** 序列化錯誤原因 */
export type SerializeErrorReason = 'length' | 'invalid-char' | 'json-parse'

/** 序列化錯誤 */
export class SerializeError extends Error {
  public readonly reason: SerializeErrorReason

  constructor(reason: SerializeErrorReason, message: string) {
    super(message)
    this.reason = reason
    this.name = 'SerializeError'
  }
}

/** 將 81 字串解析為 Board；接受 '.'、'0'、空白作為空格 */
export function parseBoardString(input: string): Board {
  // 1. 去除空白與換行
  const compact = input.replace(/\s+/g, '')

  // 2. 長度檢查
  if (compact.length !== 81) {
    throw new SerializeError('length', `expected 81 chars after stripping whitespace, got ${compact.length}`)
  }

  // 3. 字元檢查 + 轉成 CellValue[]
  const values: CellValue[] = []
  for (let i = 0; i < compact.length; i++) {
    const ch = compact[i]
    if (ch === '.' || ch === '0') {
      values.push(0)
    } else if (ch >= '1' && ch <= '9') {
      values.push(Number(ch) as CellValue)
    } else {
      throw new SerializeError('invalid-char', `invalid character '${ch}' at position ${i}`)
    }
  }

  return createBoardFromGiven(values)
}

/** Board → 81 字元字串（空格用 '.'） */
export function toBoardString(board: Board): string {
  return board.cells.map((c) => (c.value === 0 ? '.' : String(c.value))).join('')
}

/** 序列化用的 cell 形狀（candidates 轉 array） */
interface SerializedCell {
  index: number
  row: number
  col: number
  box: number
  value: number
  isGiven: boolean
  candidates: number[]
}

/** Board → JSON 字串（candidates Set 轉 array） */
export function toJSON(board: Board): string {
  const cells: SerializedCell[] = board.cells.map((c) => ({
    index: c.index,
    row: c.row,
    col: c.col,
    box: c.box,
    value: c.value,
    isGiven: c.isGiven,
    candidates: [...c.candidates],
  }))
  return JSON.stringify({ cells })
}

/** JSON 字串 → Board（candidates array 還原為 Set） */
export function fromJSON(json: string): Board {
  let parsed: { cells: SerializedCell[] }
  try {
    parsed = JSON.parse(json)
  } catch (e) {
    throw new SerializeError('json-parse', `failed to parse JSON: ${(e as Error).message}`)
  }

  if (!parsed || !Array.isArray(parsed.cells) || parsed.cells.length !== 81) {
    throw new SerializeError('json-parse', 'invalid board JSON shape')
  }

  const cells: Cell[] = parsed.cells.map((c) => ({
    index: c.index,
    row: c.row,
    col: c.col,
    box: c.box,
    value: c.value as CellValue,
    isGiven: c.isGiven,
    candidates: new Set(c.candidates),
  }))

  return { cells }
}
