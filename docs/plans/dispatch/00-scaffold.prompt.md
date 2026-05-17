# [Cursor 子任務 — 00-scaffold]

> 此檔由主 agent（Claude Code）產出，供 Cursor 直接讀取執行。
> 完工後請依末尾「完工回報格式」回報，主 agent 會做驗收。

## 你的角色
你是專注的工程師，只負責建立專案骨架這個獨立子任務。**不要超出範圍**：不要先寫業務邏輯、不要建後續任務的目錄、不要動 plan 文件。

## 必讀脈絡
請依序讀完以下檔案再開始：
1. `docs/plans/tasks/00-scaffold.md` ← 本任務完整規格
2. `docs/plans/sudoku-master.md` ← 主 plan（只看「§二 技術棧」「§六 子任務 YAML 契約規範」即可，不需要看全部）

> 注意：此任務尚無 `src/types/`、`src/fixtures/`（後續任務才會建）。

## 任務目標
建立 Vue 3 + Vite + TypeScript + Vitest + Pinia + ESLint + Prettier 的專案骨架，提供後續所有子任務的開發基礎。

## 必須產出的檔案
- `package.json`
- `vite.config.ts`
- `tsconfig.json`
- `vitest.config.ts`
- `.eslintrc.cjs`
- `.prettierrc`
- `src/main.ts`
- `src/App.vue`
- `src/__tests__/sanity.test.ts`
- `.gitignore`（需含 `node_modules`、`dist`、`.DS_Store`、`coverage`、`*.local`）

> 同時須在 src/ 底下建立空目錄（用 `.gitkeep` 占位）對應後續任務：`types/`、`core/`、`techniques/`、`solver/`、`generator/`、`stores/`、`ui/`、`views/`、`router/`、`fixtures/`。

## 技術選型（必須遵守版本）
- Node 工具：pnpm
- Vite ^5
- Vue ^3.4
- TypeScript ^5
- Vitest ^1（jsdom 環境）
- @vue/test-utils ^2
- jsdom
- Pinia ^2
- Vue Router ^4
- ESLint + `@vue/eslint-config-typescript` + `eslint-plugin-vue`
- Prettier

## 設定規範

### package.json scripts
```json
{
  "dev": "vite",
  "build": "vue-tsc -b && vite build",
  "test": "vitest run",
  "test:watch": "vitest",
  "typecheck": "vue-tsc --noEmit",
  "lint": "eslint . --ext .ts,.vue",
  "format": "prettier --write ."
}
```

### Prettier 設定
- 2 空格、單引號、無分號
- 行寬 100

### tsconfig
- `strict: true`
- `target: ES2022`
- `moduleResolution: bundler`
- 路徑別名：`@/*` → `src/*`

### Vitest 設定
- `environment: 'jsdom'`
- 啟用 globals（`describe / it / expect` 不用 import）
- coverage provider 用 v8

## 實作要點
1. 用 `pnpm create vite@latest . --template vue-ts` 起初始專案（若目錄非空，手動建檔案）
2. 加 dev deps：`vitest @vue/test-utils jsdom pinia vue-router @types/node @vue/eslint-config-typescript eslint-plugin-vue eslint prettier`
3. 設定 ESLint（typescript + vue 規則）
4. 設定路徑別名（vite.config.ts 與 tsconfig.json 同步）
5. 主入口 `src/main.ts` 安裝 Pinia 與 Vue Router（router 先用空 routes，內容 P2 才補）

## 測試項目
`src/__tests__/sanity.test.ts`：
```ts
import { describe, it, expect } from 'vitest'

describe('sanity', () => {
  it('vitest works', () => {
    expect(1 + 1).toBe(2)
  })
})
```

## 完工條件（驗收用）
- [ ] `pnpm dev` 可啟動 Vite dev server（localhost 顯示預設首頁）
- [ ] `pnpm test` 通過（含 sanity test）
- [ ] `pnpm typecheck` 無錯誤
- [ ] `pnpm lint` 無錯誤
- [ ] 目錄結構符合上方規範（src/ 子資料夾用 .gitkeep 預留）
- [ ] 所有 deliverables 檔案皆建立

## 規則（重要）
1. **不修改任何 docs/plans/ 檔案**（plan 維護由主 agent 負責）
2. **不寫任何業務邏輯**（不建 board.ts / validator.ts 等，那是後續任務）
3. **不安裝額外依賴**（除非為了讓上述設定能跑）
4. **lockfile 必須提交**（`pnpm-lock.yaml`）
5. **不啟用 ESLint 過嚴規則**（如 no-console），會干擾後續開發
6. 變數命名遵循專案規範：camelCase、正向命名
7. 不需要寫繁中註解（此任務沒有業務邏輯）

## 完工回報格式
做完後請把以下內容**寫入** `docs/plans/dispatch/00-scaffold.report.md`（主 agent 會去讀該檔做驗收）：

```
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
  - src/main.ts
  - src/App.vue
  - src/__tests__/sanity.test.ts
  - src/{types,core,techniques,solver,generator,stores,ui,views,router,fixtures}/.gitkeep

依賴版本（從 package.json 抓）：
  vue: <版本>
  vite: <版本>
  vitest: <版本>
  pinia: <版本>
  vue-router: <版本>
  @vue/test-utils: <版本>
  typescript: <版本>
  eslint: <版本>
  prettier: <版本>

測試結果：
  $ pnpm typecheck    → PASS / FAIL (錯誤摘要)
  $ pnpm lint         → PASS / FAIL (錯誤摘要)
  $ pnpm test         → X passed / Y failed
  $ pnpm dev          → 可啟動 / 啟動失敗（原因）

完工條件勾選：
  [x] pnpm dev 可啟動
  [x] pnpm test 通過
  [x] pnpm typecheck 無錯誤
  [x] pnpm lint 無錯誤
  [x] 目錄結構符合規範
  [x] deliverables 全部建立

一句話總結：建立 Vue3 + Vite + TS + Vitest + Pinia 專案骨架，所有指令綠燈。

（若有任何偏離 / 卡關 / 需要主 agent 決策，列在這裡）
```

## 操作提醒
- 請在 Cursor 開**新 chat**（避免脈絡污染）
- 用 Composer / Agent Mode（需要寫多個檔案）
- 完工 → 寫 `docs/plans/dispatch/00-scaffold.report.md` 即可，不需通知使用者複製貼上
