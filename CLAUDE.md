# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 專案概述

純前端數獨學習工具（Vue 3 + Vite + TS + Pinia，pnpm 管理）。提供遊戲模式（玩家解題 + 提示）、觀摩模式（電腦逐步解題）、分析模式（盤面難度與解題路徑分析）。

## 常用指令

```bash
pnpm dev                    # 啟動 Vite 開發伺服器
pnpm build                  # vue-tsc 型別檢查 + Vite production build
pnpm typecheck              # 僅跑 vue-tsc --noEmit
pnpm test                   # vitest run（一次性，CI / 驗收用）
pnpm test:watch             # vitest watch 模式
pnpm test <path>            # 跑單一檔案，例：pnpm test src/solver/orchestrator.test.ts
pnpm lint                   # ESLint .ts .vue
pnpm format                 # Prettier 全寫
```

測試環境為 jsdom（見 `vitest.config.ts`），路徑別名 `@` → `src/`（見 `vite.config.ts`）。

## 架構分層（重要）

由下而上嚴格分層，上層可引用下層，**不可反向**：

```
types/        共享型別契約（合約檔，唯讀，不可隨意改 — 見下文）
  └─ core/        board / validator / serializer — 純函式、不可變資料
       └─ techniques/   解題技巧 solver（nakedSingle, hiddenSingle, ...）
            └─ solver/       backtrack + orchestrator（編排技巧 + fallback）
                 └─ generator/    依難度生成題目
                      └─ stores/       Pinia game store + localStorage persistence
                           └─ views/ + ui/   Vue 元件層
```

關鍵介面（`src/types/`）：
- `Board` / `Cell` / `CellIndex` / `CellValue`（`board.ts`）
- `TechniqueSolver { meta, apply(board) → TechniqueStep | null }`（`technique.ts`）— 所有技巧的統一契約，純函式無副作用
- `TechniqueStep`（含 `action: 'place' | 'eliminate'`、`placements` / `eliminations`、`explanation` 中文說明）
- `Puzzle` / `Difficulty` / `SolveResult`（`puzzle.ts`）

**新增技巧的標準流程**：實作 `TechniqueSolver` → 加入 `src/solver/orchestrator.ts` 的 `registeredTechniques`（依優先順序），不需改型別。

**orchestrator 解題迴圈**（`solveWithSteps`）：recompute candidates → 依序試技巧 → 找到步驟即套用 → 重算 candidates → 重來；全部失效時 fallback 到 backtrack。

## 開發工作流（Plan 驅動）

本專案採 **主 plan + 子任務 + 派工** 流程，主 plan 為 `docs/plans/sudoku-master.md`（必讀以了解 Phase / 任務狀態 / 依賴圖）。

```
docs/plans/
  sudoku-master.md             ← 主 plan（狀態總表）
  tasks/<id>-<slug>.md         ← 子任務規格（不可改）
  dispatch/<id>.prompt.md      ← 派工 prompt（給 subagent）
  dispatch/<id>.report.md      ← 完工回報（subagent 寫，主 agent 驗收）
```

主 agent 動工前先讀對應 `tasks/<id>.md`（含 YAML frontmatter：`depends_on`、`acceptance`、`deliverables`），驗收時逐項對照 acceptance、跑 typecheck + test。

子任務任務 ID 規則：Phase 0=00-02、P1 核心=10-22、P2 UI/Store=30-42、P3 中階技巧+觀摩=15-19/34、P4 分析=35。

## 此專案特有規則

- **`src/types/` 是合約檔**：subagent 不可改。若認為需改型別契約，停手回報，由主 agent 評估影響並修改，受影響的已完工任務需重驗收。
- **commit 訊息結尾標 `[<task-id>]`**（例：`feat(stores): localStorage 進度持久化 [41-store-persistence]`），commit 順序即任務完成順序。
- **驗收標準**：`pnpm typecheck` + `pnpm test` 全綠 + acceptance 條目逐項通過。「應該會過」不算交付。
- **無後端**：所有進度走 localStorage（見 `src/stores/persistence.ts`）。
- **解題技巧優先順序由 `registeredTechniques` 陣列順序決定**（由低階到高階），影響 orchestrator 推薦的「下一步提示」。
