# 35b — PuzzleInputPanel.vue 完工報告

## 產出檔案
- `src/ui/PuzzleInputPanel.vue`
- `src/ui/PuzzleInputPanel.test.ts`

## 驗收結果
- `pnpm typecheck`：綠燈（無型別錯誤）
- `pnpm test src/ui/PuzzleInputPanel.test.ts`：10/10 全綠

## 實作摘要

### PuzzleInputPanel.vue
純 prop-emit 元件，不持有 store 狀態。

**上半文字輸入區（`.input-section`）**
- textarea（data-testid="text-input"）接受 81 字串
- 載入按鈕：呼 `parseBoardString`，成功 emit `update:board`，失敗顯示中文錯誤訊息（`SerializeError.reason` 對應長度/非法字元）
- 清空按鈕：清 textarea + 錯誤訊息，emit `clear`
- 載入範例按鈕：emit `loadSample`
- 分析按鈕：`board !== null` 才 enabled，點擊 emit `analyze(board)`

**下半棋盤（`SudokuBoard`）**
- board 為 null 時自動顯示 `createEmptyBoard()`
- 點格 → 轉發 `selectCell`
- 鍵盤輸入 1-9 → map cells 設定 `value=N, isGiven=true`（手動更新 isGiven，setCellValue 不改此欄）
- Backspace/Delete → map cells 設定 `value=0, isGiven=false`
- emit `update:board` 傳新 board

### PuzzleInputPanel.test.ts
10 個測試案例涵蓋所有指定項目：
1. 合法 81 字串載入 → emit + cells[0].value 驗證
2. 長度錯誤 → 顯示含「長度」錯誤訊息
3. 非法字元 → 顯示含「非法字元」錯誤訊息
4. 清空按鈕 → emit clear
5. 載入範例 → emit loadSample
6. 分析按鈕（有 board）→ emit analyze
7. 分析按鈕（board=null）→ disabled 不 emit
8. 棋盤點格 → emit selectCell
9. 鍵盤 1-9 → emit update:board，value=N, isGiven=true
10. 鍵盤 Backspace → emit update:board，value=0, isGiven=false

## 實作決策備註
- SudokuBoard 在測試環境以 stub 替換（避免 jsdom 缺少 focus 環境的問題）
- 測試中棋盤鍵盤輸入直接呼叫 `vm.handleKeyInput`（stub 無法觸發原生 keyInput 事件）
