import { fromJSON, toJSON } from '@/core/serializer'
import { useGameStore } from '@/stores/game'

const STORAGE_KEY = 'sudoku.progress.v1'

/** 序列化形狀 */
interface SerializedProgress {
  version: 1
  puzzle: ReturnType<typeof useGameStore>['puzzle']
  boardJSON: string | null
  selectedIndex: number | null
  pencilMode: boolean
  /** 累計錯誤次數 */
  errorCount: number
}

/** 取得目前 store snapshot 寫入 localStorage */
export function saveProgress(): void {
  const store = useGameStore()
  const data: SerializedProgress = {
    version: 1,
    puzzle: store.puzzle,
    boardJSON: store.board ? toJSON(store.board) : null,
    selectedIndex: store.selectedIndex,
    pencilMode: store.pencilMode,
    errorCount: store.errorCount,
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    // localStorage 不可用（隱私模式等）；靜默失敗，不阻擋使用者
  }
}

/** 從 localStorage 還原 store 狀態；無資料或解析失敗回 false */
export function loadProgress(): boolean {
  let raw: string | null
  try {
    raw = localStorage.getItem(STORAGE_KEY)
  } catch {
    return false
  }
  if (!raw) return false

  try {
    const data = JSON.parse(raw) as SerializedProgress
    if (data.version !== 1) return false
    if (!data.puzzle || !data.boardJSON) return false

    const board = fromJSON(data.boardJSON)
    const store = useGameStore()
    store.loadPuzzle(data.puzzle, board)
    store.selectedIndex = data.selectedIndex
    store.pencilMode = data.pencilMode
    // loadPuzzle 會把 errorCount 歸零，這裡覆寫回原本記錄值（舊資料無此欄位則維持 0）
    store.errorCount = typeof data.errorCount === 'number' ? data.errorCount : 0
    return true
  } catch {
    return false
  }
}

/** 清除進度 */
export function clearProgress(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}

/**
 * 註冊持久化 plugin：訂閱 game store 改動，debounce 後寫入 localStorage
 * 用法：main.ts 中 `app.use(pinia)` 後呼叫 `installPersistence(pinia)`
 */
export function installPersistence(): void {
  const store = useGameStore()
  let timer: ReturnType<typeof setTimeout> | null = null
  store.$subscribe(() => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      saveProgress()
      timer = null
    }, 500)
  })
}

/** 給測試用：暴露 STORAGE_KEY */
export const __STORAGE_KEY__ = STORAGE_KEY
