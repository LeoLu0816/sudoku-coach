[42-routing-mode] 完工回報

變更檔案：
  - src/router/index.ts（新增）
  - src/views/HomeView.vue（新增）
  - src/views/PlayView.vue（新增）
  - src/views/ObserveView.vue（新增）
  - src/views/AnalyzeView.vue（新增）
  - src/App.vue（改寫為 <router-view />）
  - src/main.ts（裝 router、loadProgress、installPersistence）
  - tests/integration/play-flow.test.ts（新增）

測試結果：
  $ pnpm typecheck → PASS
  $ pnpm test → 18 files / 281 passed
  $ pnpm build → PASS（vue-tsc + vite build 全綠）

完工條件勾選：
  [x] 三條路由 /play、/observe、/analyze（含 /）
  [x] /play 為 MVP 完整遊戲頁面（整合 SudokuBoard / NumberPad / ControlPanel / HintOverlay + gameStore）
  [x] /observe、/analyze 放佔位（P3/P4 填）
  [x] 首頁可切換模式（HomeView 三個 mode-card）
  [x] 整合測試：完整玩一局簡單題到完成（7/7 passed，含 solved-banner 驗證）

一句話總結：
完成 P2 路由與整合，PlayView 串起所有 UI 元件與 gameStore，支援難度選擇、提示流程、鍵盤輸入、解題完成提示，整合測試含 fixture 題完整 hint→apply 解到底；persistence 已在 main.ts 啟動時 loadProgress、之後 installPersistence 自動 debounce 存檔。

實作決策備註：
- PlayView 鍵盤事件繫到 window（而非僅棋盤 focus），讓玩家不用每次先點棋盤就能輸入
- HintOverlay 永遠 mount（不用 v-if），讓「無可推薦步驟」訊息有處顯示
- 難度選擇用簡單 modal（grid 2x2 四難度按鈕），無 board 時自動彈出
- 整合測試直接用 fixture easy-01 + store.loadPuzzle（跳過 generator）以求穩定；另獨立一個 case 走 newGame('easy') 驗證生成器整合
