[34c-observe-view] 完工回報（任務 34 第三部分：整合）

變更檔案：
  - src/views/ObserveView.vue（改寫：從佔位頁變為完整觀摩 view）
  - tests/integration/observe-flow.test.ts（新增）

測試結果：
  $ pnpm typecheck → PASS
  $ pnpm test → 26 files / 372 passed（含 observe-flow 6/6）
  $ pnpm build → PASS

完工條件勾選（對應 34 task acceptance）：
  [x] 觀摩模式 /observe 可運作
  [x] 支援手動逐步 + 自動播放（slow/normal/fast）
  [x] 步驟列表可點擊跳轉
  [x] 每步顯示技巧名 + 高亮 + 中文說明（重用 HintOverlay）
  [x] 整合測試完整跑完一題簡單題、最後盤面 = solution、自動播放到末步自動暫停

實作決策備註：
- ObserveView mount 時：gameStore 已有 puzzle → 自動接手；無 puzzle → 彈難度選擇
- 棋盤點擊在觀摩模式不接受編輯（onSelectCell 為 no-op）
- 重用 HintOverlay 顯示當前步驟說明（避免另寫一份），其 apply/next 都路由到 next 步驟
- 離開 view 時若 autoPlaying 自動 pause，避免 timer 殘留
- 整合測試用 fixture easy-01 + vi.useFakeTimers 推進自動播放
