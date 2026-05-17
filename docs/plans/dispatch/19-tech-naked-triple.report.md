---
task_id: 19-tech-naked-triple
status: done
completed_at: 2026-05-17
---

# 19 — Naked Triple 完工回報

## 產出檔案

- `src/techniques/nakedTriple.ts` — 匯出 `nakedTripleSolver`
- `src/techniques/nakedTriple.test.ts` — 7 個測試，全綠

## 驗收結果

- `pnpm typecheck` — 通過
- `pnpm test src/techniques/nakedTriple.test.ts` — 7/7 通過

## 實作摘要

遍歷 row / col / box 三種 unit，每個 unit 中：
1. 收集候選 size 2 或 3 的空格 → S
2. 對 S 取三格組合 (a, b, c)
3. 三格候選聯集 size === 3 → 裸三成立
4. 收集 unit 其他空格中屬於聯集的候選 → eliminations
5. 有 eliminations 即回 TechniqueStep

## 測試覆蓋

| 測試 | 說明 |
|---|---|
| meta 正確 | id='naked-triple', name='裸三' |
| naked-triple-01 fixture | 列裸三，混合 size 2/3 |
| naked-triple-02 fixture | 欄裸三，混合 size 2/3 |
| naked-triple-03 fixture | 宮裸三，混合 size 2/3 |
| 三格 size 混合確認 | related.length === 3 |
| 混合 size 情境確認 | action === 'eliminate' |
| 空盤 → null | 無候選不成裸三 |

## 注意事項

orchestrator 未動，需主 agent 手動將 `nakedTripleSolver` 加入 `registeredTechniques`。
