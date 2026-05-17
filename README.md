# 數獨學習工具 (Sudoku Coach)

純前端數獨練習與學習工具，提供「遊戲、觀摩、分析」三種模式，著重在**解題技巧的視覺化與步驟說明**，而非單純讓玩家解題。

🎮 **線上遊玩**：[https://leolu0816.github.io/sudoku-coach/](https://leolu0816.github.io/sudoku-coach/)

---

## 功能模式

| 模式 | 路由 | 說明 |
|---|---|---|
| 🎯 遊戲 | `/#/play` | 玩家解題，可請求提示（命中下一步技巧） |
| 👀 觀摩 | `/#/observe` | 電腦逐步解題回放，搭配中文技巧說明 |
| 🔍 分析 | `/#/analyze` | 自訂盤面，分析難度、唯一性與解題路徑 |

支援的解題技巧（依優先順序套用）：
- Naked Single（裸單）
- Hidden Single（隱單）
- Pointing Pair（指向對）
- Hidden Pair（隱藏對）
- Backtrack（回溯，作為 fallback）

> 全程序本機運算、無後端、無追蹤；遊戲進度透過 `localStorage` 保存。

---

## 技術棧

- **Vue 3** + **Vite** + **TypeScript**
- **Pinia**（狀態管理）
- **Vue Router 4**（hash 模式，相容 GitHub Pages）
- **Vitest** + **jsdom**（單元測試）
- **pnpm**（套件管理）

## 架構分層

由下而上嚴格分層，上層引用下層，**不可反向**：

```
types/        共享型別契約（合約檔）
  └─ core/        board / validator / serializer（純函式）
       └─ techniques/   各解題技巧 solver
            └─ solver/       backtrack + orchestrator
                 └─ generator/    依難度生成題目
                      └─ stores/       Pinia store + 持久化
                           └─ views/ + ui/   Vue 元件層
```

**新增解題技巧**只需：實作 `TechniqueSolver` 介面 → 加入 `src/solver/orchestrator.ts` 的 `registeredTechniques` 陣列，無需改型別契約。

---

## 開發

需求：Node.js 20+、pnpm 9+

```bash
pnpm install

pnpm dev          # 啟動開發伺服器
pnpm build        # 型別檢查 + production build
pnpm typecheck    # 僅型別檢查
pnpm test         # 跑全部測試
pnpm test:watch   # watch 模式
pnpm lint         # ESLint
pnpm format       # Prettier
```

執行單一測試檔：

```bash
pnpm test src/solver/orchestrator.test.ts
```

---

## 部署

推送到 `main` 後，GitHub Actions 自動 build 並部署到 GitHub Pages（見 `.github/workflows/deploy.yml`）。

部署目標：[https://leolu0816.github.io/sudoku-coach/](https://leolu0816.github.io/sudoku-coach/)

---

## 專案目錄

```
src/
├─ types/           # 共享型別（Board, TechniqueSolver, Puzzle, ...）
├─ core/            # board / validator / serializer
├─ techniques/      # 各解題技巧實作 + 對應測試
├─ solver/          # backtrack + orchestrator
├─ generator/       # 題目生成
├─ stores/          # Pinia stores（game / playback / analyze）
├─ ui/              # 共用元件（SudokuBoard, HintOverlay, ...）
├─ views/           # 頁面（Home / Play / Observe / Analyze）
└─ router/          # 路由設定
docs/
└─ plans/           # 開發 plan 與任務文件
```

---

## License

僅供學習用途。
