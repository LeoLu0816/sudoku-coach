[02-test-fixtures] 完工回報

變更檔案：
  + src/fixtures/puzzles.ts
  + src/fixtures/techniqueScenarios.ts
  + src/fixtures/index.ts
  + src/__tests__/fixtures.test.ts
  - src/fixtures/.gitkeep  (移除)

資料統計：
  完整題目：
    easy: 5 題
    medium: 5 題
    hard: 5 題
    expert: 5 題
    總計: 20 題
  技巧場景：
    naked-single: 3 個
    hidden-single: 3 個 (row: 1, col: 1, box: 1)
    naked-pair: 3 個
    hidden-pair: 3 個
    naked-triple: 3 個
    pointing-pair: 3 個 (row 方向: 2, col 方向: 1)
    box-line-reduction: 3 個 (row→box: 2, col→box: 1)
    總計: 21 個

資料來源（簡述）：
  完整題目: 以 4 組本地唯一解種子題為基礎，經合法數字重映射 / 轉置 / 旋轉生成同構變體
  技巧場景: 基於標準完整解盤面手工挖空，並以明確 candidates 建立各技巧最小例證

測試結果：
  $ pnpm typecheck    → PASS
  $ pnpm test         → 135 passed / 0 failed
  $ pnpm lint         → PASS

完工條件勾選：
  [x] 每難度 ≥ 5 題
  [x] 每技巧 ≥ 3 場景
  [x] hidden-single 含 row/col/box 各一
  [x] pointing-pair 含 row/col 各一
  [x] box-line-reduction 含 row→box / col→box 各一
  [x] helper 函式完整
  [x] fixtures.test.ts 全綠
  [x] pnpm typecheck / test / lint 全綠

一句話總結：建立 20 題完整題目 + 21 個技巧場景，並以 fixtures 自我驗證測試確認資料結構、解答合法性與唯一解全綠。

（若有任何偏離 / 卡關 / 對某些技巧場景不確定 / 需要主 agent 決策的點，列在這裡）
- 完整題目的「唯一解」是以本地回溯驗證過的種子題為基礎，再套用保唯一解的同構變換產生；目前已在 fixtures.test.ts 常駐驗證唯一解。
