[31-ui-numberpad] 完工回報（claude-code）

變更檔案：
  + src/ui/NumberPad.vue
  + src/ui/NumberPad.test.ts

API:
  Props: remainingCounts: number[] (length 9) / pencilMode: boolean
  Emits: number(value: 1-9) / clear / togglePencil

設計重點：
  - 純 prop-driven，無內部狀態
  - remainingCounts[n-1]=0 時按鈕 disabled + .is-exhausted 灰化，雙重防護（HTML disabled + handleNumber guard）
  - pencilMode=true 時 .pencil-btn 加 .is-active（綠底）
  - 每個數字按鈕內含 <span class="count"> 顯示剩餘數量
  - 清除鍵 .clear-btn、鉛筆鍵 .pencil-btn 於獨立 action-row

測試: 7 passed（點數字 emit、disabled 不 emit、togglePencil、clear、is-active 有無、count 顯示）
一句話總結：數字輸入面板元件完成，純 prop-driven，7 測試全過。
