[00-scaffold] 完工回報

變更檔案：
  - package.json
  - pnpm-lock.yaml
  - vite.config.ts
  - tsconfig.json
  - vitest.config.ts
  - .eslintrc.cjs
  - .prettierrc
  - .gitignore
  - index.html
  - src/main.ts
  - src/App.vue
  - src/vite-env.d.ts
  - src/__tests__/sanity.test.ts
  - src/{types,core,techniques,solver,generator,stores,ui,views,router,fixtures}/.gitkeep

依賴版本（從 package.json 抓）：
  vue: ^3.4.0
  vite: ^5.0.0
  vitest: ^1.0.0
  pinia: ^2.1.7
  vue-router: ^4.3.0
  @vue/test-utils: ^2.4.0
  @vitest/coverage-v8: ^1.6.1
  typescript: ^5.3.0
  eslint: ^8.57.0
  prettier: ^3.2.0

測試結果：
  $ pnpm typecheck    → PASS
  $ pnpm lint         → PASS
  $ pnpm test         → 1 passed / 0 failed
  $ pnpm dev          → 可啟動（Vite v5.4.21 ready，http://127.0.0.1:5173/ 回應 200）
  $ pnpm build        → PASS
  $ pnpm exec vitest run --coverage → 1 passed / 0 failed（v8 coverage provider 可用）

完工條件勾選：
  [x] pnpm dev 可啟動
  [x] pnpm test 通過
  [x] pnpm typecheck 無錯誤
  [x] pnpm lint 無錯誤
  [x] 目錄結構符合規範
  [x] deliverables 全部建立

一句話總結：建立 Vue3 + Vite + TS + Vitest + Pinia 專案骨架，所有指令綠燈。

偏離 / 補充：
  - 額外新增 index.html 與 src/vite-env.d.ts，作為 Vite/Vue TypeScript scaffold 正常啟動與型別檢查所需檔案。
  - 額外新增 @vitest/coverage-v8，因 Vitest v8 coverage provider 需要此套件才能實際執行 coverage。
