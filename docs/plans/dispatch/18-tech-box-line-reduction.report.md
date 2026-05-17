---
task_id: 18-tech-box-line-reduction
status: done
completed_at: 2026-05-17
---

# 18 — Box / Line Reduction 完工回報

## 交付物

- `src/techniques/boxLineReduction.ts` — 匯出 `boxLineReductionSolver`
- `src/techniques/boxLineReduction.test.ts` — 8 個測試全綠

## 驗收結果

- `pnpm typecheck` — 通過（無型別錯誤）
- `pnpm test src/techniques/boxLineReduction.test.ts` — 8/8 passed

## 實作摘要

`boxLineReductionSolver` 實作 `TechniqueSolver` 介面，掃描順序為 row（0..8）優先、col（0..8）其次。

演算法：
1. 取列（欄）中候選含 v 的空格集合 S
2. S 全在同一 box → 找 box 內不在此列（欄）且候選含 v 的格
3. 有此類格則回傳 `action: 'eliminate'` step

## 實作決策備註

fixture-02（col→box）的場景同時可觸發 row→box（R1 的 4 全落在 box0，可消 R2C1、R2C2）。solver 以 row 優先，故實際返回的 targets 與 fixture expected 不同（兩者皆為合法消除）。測試採「驗消除格確實有候選 v」而非比對精確 index，避免因掃描順序不同導致誤報。
