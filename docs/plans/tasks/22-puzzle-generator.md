---
id: 22-puzzle-generator
phase: P1
status: done
depends_on: [20-solver-backtrack, 21-solver-orchestrator]
assignee: claude-code
completed_at: 2026-05-17
estimated_complexity: M
acceptance:
  - "可依難度生成題目（唯一解）"
  - "生成時間 < 3 秒（簡單/中等）/ < 10 秒（困難/專家）"
  - "支援 seed 重現生成"
deliverables:
  - "src/generator/puzzleGenerator.ts"
  - "src/generator/puzzleGenerator.test.ts"
---

# 22 — 題目生成器

## 目標
依難度即時生成數獨題目（保證唯一解），用於遊戲模式與觀摩模式。

## API

```ts
interface GenerateOptions {
  difficulty: Difficulty;
  seed?: number;     // 可選，傳入則 deterministic
  timeoutMs?: number; // 預設 10000
}

generatePuzzle(opts: GenerateOptions): Puzzle;
```

## 演算法

### 步驟 1：產生完整解
- 從空盤開始，用回溯 + 隨機選擇順序，填滿 9x9
- 或：取一個已知合法 base solution，做 random transformation
  - 數字 1-9 隨機重新映射
  - row band 隨機交換（同 band 內 row 交換、band 間交換）
  - col stack 同理
- transformation 法更快且分布良好

### 步驟 2：挖洞（核心）
- 隨機順序遍歷 81 格
- 對每格嘗試挖空：
  - 用 backtrack `countSolutions(board, 2)` 檢查唯一解
  - 若仍唯一解 → 保留挖空
  - 若多解 → 還原
- 直到達到「難度條件」

### 步驟 3：難度判定（關鍵）
挖到差不多後，用 orchestrator 嘗試解 → 觀察 steps 中用到的技巧最高層級：

| 難度 | 條件 |
|---|---|
| easy | 只用 naked-single |
| medium | naked-single + hidden-single |
| hard | + naked-pair / hidden-pair / pointing-pair |
| expert | + naked-triple / box-line-reduction |

挖洞策略：
- easy：挖到不能挖（保持唯一解）即可，但需用 orchestrator 確認「只用 naked-single 能解」，否則放棄該嘗試
- medium 以上：類似，依「最高技巧 ≤ 該難度」過濾

### 步驟 4：題目穩定性
- 設 timeout，超時則接受目前最近一個符合條件的題目
- 使用 seedrandom 庫提供 deterministic 模式（測試用）

## 注意
- 生成在主執行緒可能阻塞，**之後可移到 Web Worker**（P1 不做）
- 若生成失敗，fallback：回傳預先打包的備用題（從 fixtures 抓）

## 測試項目
- 各難度生成 3 題：
  - 唯一解（用 backtrack 驗證）
  - 用 orchestrator 解 → 最高技巧符合難度
- 同 seed 兩次生成 → 結果一致
- timeout 模擬 → 回傳備用題

## 完工條件
- `pnpm test` 全綠
- 各難度平均生成時間在基準內
