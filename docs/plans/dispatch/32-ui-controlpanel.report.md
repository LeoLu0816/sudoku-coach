---
task_id: 32-ui-controlpanel
status: done
completed_at: 2026-05-17
---

# 32 — 控制面板 完工回報

## 產出檔案

- `src/ui/ControlPanel.vue`
- `src/ui/ControlPanel.test.ts`

## 驗收結果

| 項目 | 結果 |
|---|---|
| `pnpm typecheck` | 綠燈 |
| `pnpm test src/ui/ControlPanel.test.ts` | 14/14 通過 |
| 新局 / undo / redo / 提示 / 自動候選 toggle / 檢查錯誤 按鈕 | ✓ |
| data-testid 屬性 | ✓ |
| canUndo=false → .is-disabled + disabled + 不 emit | ✓ |
| canRedo=false → .is-disabled + disabled + 不 emit | ✓ |
| autoCandidates=true → .is-active | ✓ |
| 提示鈕 .is-emphasis（橘黃） | ✓ |
| 純 prop-driven，無內部狀態 | ✓ |

## 實作決策備註

- undo / redo 採雙重防護：HTML `disabled` 屬性阻擋原生點擊，元件內 guard 函式（`handleUndo` / `handleRedo`）再次判斷，確保測試以 `trigger('click')` 觸發時同樣不 emit。
- 未改動任何 `src/types/` 檔案。
