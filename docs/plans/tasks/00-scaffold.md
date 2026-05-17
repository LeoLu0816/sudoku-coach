---
id: 00-scaffold
phase: P0
status: done
depends_on: []
assignee: cursor-gpt
completed_at: 2026-05-17
estimated_complexity: S
acceptance:
  - "pnpm dev 可啟動 Vite dev server"
  - "pnpm test 可跑 Vitest（含一個 sample test 通過）"
  - "pnpm typecheck 無錯誤"
  - "pnpm lint 無錯誤"
  - "目錄結構符合下方規範"
deliverables:
  - "package.json"
  - "vite.config.ts"
  - "tsconfig.json"
  - "vitest.config.ts"
  - ".eslintrc.cjs"
  - ".prettierrc"
  - "src/main.ts"
  - "src/App.vue"
  - "src/__tests__/sanity.test.ts"
---

# 00 — 專案骨架

## 目標
建立 Vue 3 + Vite + TypeScript + Vitest 專案骨架，後續所有子任務都在此基礎上開發。

## 技術選型
- Vite ^5
- Vue ^3.4
- TypeScript ^5
- Vitest ^1（jsdom 環境）
- Vue Test Utils ^2
- Pinia ^2
- ESLint + Prettier
- pnpm

## 目錄結構規範

```
src/
├── main.ts
├── App.vue
├── types/                # 共享型別（01-shared-types 寫入）
├── core/                 # 棋盤資料結構、驗證、序列化
│   ├── board.ts
│   ├── validator.ts
│   └── serializer.ts
├── techniques/           # 解題技巧（每技巧一檔）
│   ├── nakedSingle.ts
│   ├── hiddenSingle.ts
│   └── ...
├── solver/               # 暴力解 + orchestrator
│   ├── backtrack.ts
│   └── orchestrator.ts
├── generator/            # 題目生成
│   └── puzzleGenerator.ts
├── stores/               # Pinia stores
│   ├── game.ts
│   └── persistence.ts
├── ui/                   # Vue 元件
│   ├── SudokuBoard.vue
│   ├── NumberPad.vue
│   ├── ControlPanel.vue
│   ├── HintOverlay.vue
│   ├── PlaybackPanel.vue
│   └── PuzzleInputPanel.vue
├── views/                # 頁面 / 模式
│   ├── PlayView.vue
│   ├── ObserveView.vue
│   └── AnalyzeView.vue
├── router/
│   └── index.ts
└── fixtures/             # 02-test-fixtures 寫入
    └── puzzles.ts

tests/                    # 跨模組整合測試
└── integration/
```

## 實作要點
1. `pnpm create vite@latest . --template vue-ts`
2. 加 `pinia`、`vitest`、`@vue/test-utils`、`jsdom`、`@types/node`
3. 加 `vue-router@4`（為 42-routing-mode 鋪路）
4. 設定 ESLint：`@vue/eslint-config-typescript`、`eslint-plugin-vue`
5. Prettier：2 空格、單引號、無分號（依個人偏好，可調整）
6. `package.json` scripts：
   - `dev`：vite
   - `build`：vue-tsc -b && vite build
   - `test`：vitest run
   - `test:watch`：vitest
   - `typecheck`：vue-tsc --noEmit
   - `lint`：eslint . --ext .ts,.vue
   - `format`：prettier --write .

## 測試項目
- `src/__tests__/sanity.test.ts`：簡單 `expect(1+1).toBe(2)`，驗證 Vitest 可運行

## 完工條件
- 上述 4 個 pnpm script 全綠
- 進入 dev server 可看到 Vite 預設首頁
