import type { Board, Cell, CellIndex, TechniqueSolver, TechniqueStep } from '@/types'
import { getCell, indexToBox, indexToRowCol, rowColToIndex } from '@/core/board'

/** 格的人類可讀座標（如 R1C3） */
function cellLabel(cell: Cell): string {
  return `R${cell.row + 1}C${cell.col + 1}`
}

/** 取 bivalue cell 的 [小, 大] 兩個候選 */
function bivalueKey(cell: Cell): string {
  const sorted = [...cell.candidates].sort((a, b) => a - b)
  return `${sorted[0]},${sorted[1]}`
}

/** 解析 bivalueKey 回 [a, b] 數字陣列 */
function parseKey(key: string): [number, number] {
  const [a, b] = key.split(',').map((s) => Number(s))
  return [a, b]
}

/**
 * 嘗試以三個 bivalue 角 (cellA, cellB, cellC) 構成矩形的三角，
 * 推出第 4 角的座標。若三角不在「2 列 × 2 欄」結構中回傳 null。
 * 流程：
 * 1. 收集三角的 row / col
 * 2. row 必須恰有 2 種、col 必須恰有 2 種
 * 3. 找到出現一次的 row 與 col（即第 4 角所在）
 */
function findFourthCornerIndex(cellA: Cell, cellB: Cell, cellC: Cell): CellIndex | null {
  const rows = [cellA.row, cellB.row, cellC.row]
  const cols = [cellA.col, cellB.col, cellC.col]
  const uniqueRows = [...new Set(rows)]
  const uniqueCols = [...new Set(cols)]

  if (uniqueRows.length !== 2 || uniqueCols.length !== 2) {
    return null
  }

  // 找出現次數為 1 的 row 與 col → 即「第 4 角」(其他三角已佔了該 row 兩次/col 兩次)
  // 第 4 角的 row：在三角中該 row 只出現「一次」的那個 row
  const row4 = uniqueRows.find((r) => rows.filter((x) => x === r).length === 1)
  const col4 = uniqueCols.find((c) => cols.filter((x) => x === c).length === 1)

  if (row4 === undefined || col4 === undefined) {
    return null
  }

  return rowColToIndex(row4, col4)
}

/**
 * Unique Rectangle Type 1 Solver
 * 找 2 列 × 2 欄共 4 格構成的矩形，其中 3 格候選恰為相同 bivalue {a,b}，
 * 第 4 格候選包含 {a,b} 加上至少 1 個額外數字；且 4 格分布於最多 2 個 box。
 * 依「題目唯一解」前提，第 4 格不可填 a 或 b（否則出現 deadly pattern 兩解）。
 *
 * 流程：
 * 1. 收集所有 candidates.size === 2 的空格
 * 2. 依「{a,b}」分組
 * 3. 對每組 ≥3 角，列舉三角組合
 * 4. 推算第 4 角，檢查候選與 box 分布
 * 5. 生成消去 step
 */
export const uniqueRectangleSolver: TechniqueSolver = {
  meta: {
    id: 'unique-rectangle',
    name: 'Unique Rectangle Type 1（唯一矩形 T1）',
    shortDesc: '矩形四格中三格已為同一 bivalue，第 4 格不可填這兩數（否則破壞解唯一性）',
  },

  apply(board: Board): TechniqueStep | null {
    // 1. 收集 bivalue 空格
    const bivalueCells: Cell[] = []
    for (const cell of board.cells) {
      if (cell.value === 0 && cell.candidates.size === 2) {
        bivalueCells.push(cell)
      }
    }

    if (bivalueCells.length < 3) {
      return null
    }

    // 2. 依 bivalue 分組
    const groups = new Map<string, Cell[]>()
    for (const cell of bivalueCells) {
      const key = bivalueKey(cell)
      const list = groups.get(key)
      if (list) {
        list.push(cell)
      } else {
        groups.set(key, [cell])
      }
    }

    // 3. 對每組嘗試找出 URec T1
    for (const [key, cells] of groups) {
      if (cells.length < 3) {
        continue
      }

      const [valA, valB] = parseKey(key)

      // 列舉三角組合
      for (let i = 0; i < cells.length - 2; i++) {
        for (let j = i + 1; j < cells.length - 1; j++) {
          for (let k = j + 1; k < cells.length; k++) {
            const cellA = cells[i]
            const cellB = cells[j]
            const cellC = cells[k]

            // 4. 推算第 4 角
            const fourthIndex = findFourthCornerIndex(cellA, cellB, cellC)
            if (fourthIndex === null) {
              continue
            }

            const fourthCell = getCell(board, fourthIndex)

            // 第 4 角必須是空格、candidates 必須含 {a, b}、且 candidates.size > 2（有 extra）
            if (fourthCell.value !== 0) {
              continue
            }
            if (!fourthCell.candidates.has(valA) || !fourthCell.candidates.has(valB)) {
              continue
            }
            if (fourthCell.candidates.size <= 2) {
              continue
            }

            // 檢查 4 格分布於最多 2 個 box
            const boxes = new Set<number>([
              cellA.box,
              cellB.box,
              cellC.box,
              indexToBox(fourthIndex),
            ])
            if (boxes.size > 2) {
              continue
            }

            // 5. 構造 eliminations（過濾出實際存在於第 4 角候選中的 a/b）
            const elimValues: number[] = []
            if (fourthCell.candidates.has(valA)) {
              elimValues.push(valA)
            }
            if (fourthCell.candidates.has(valB)) {
              elimValues.push(valB)
            }

            if (elimValues.length === 0) {
              continue
            }

            // 排序三個 bivalue 角以便 explanation 穩定（依 index 由小到大）
            const triCorners = [cellA, cellB, cellC].sort((x, y) => x.index - y.index)
            const fourthRC = indexToRowCol(fourthIndex)
            const fourthLabel = `R${fourthRC.row + 1}C${fourthRC.col + 1}`

            const explanation =
              `${cellLabel(triCorners[0])}, ${cellLabel(triCorners[1])}, ${cellLabel(triCorners[2])} ` +
              `三格候選皆為 {${valA}, ${valB}}，與 ${fourthLabel} 構成矩形。` +
              `若 ${fourthLabel} 填 ${valA} 或 ${valB}，題目將有兩個合法解。` +
              `題目唯一解前提下，${fourthLabel} 不可為 ${valA} 或 ${valB}`

            return {
              technique: 'unique-rectangle',
              targets: [fourthIndex],
              related: [cellA.index, cellB.index, cellC.index, fourthIndex],
              action: 'eliminate',
              eliminations: [{ index: fourthIndex, values: elimValues }],
              explanation,
            }
          }
        }
      }
    }

    return null
  },
}
