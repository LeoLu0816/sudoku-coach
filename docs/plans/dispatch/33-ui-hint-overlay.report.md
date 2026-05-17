# 33-ui-hint-overlay 完工回報

## 交付物
- `src/ui/HintOverlay.vue`
- `src/ui/HintOverlay.test.ts`

## 驗收結果
- `pnpm typecheck` → 通過（無錯誤）
- `pnpm test src/ui/HintOverlay.test.ts` → 15 tests passed

## 實作說明

### HintOverlay.vue
- Props：`step: TechniqueStep | null`
- Emits：`apply` / `next` / `close`
- 技巧 ID → 中文名以靜態 `Record<TechniqueId, string>` 對應，涵蓋所有 8 種 TechniqueId
- `step !== null` 時渲染標頭（中文名 + 「解題提示」副標）、`.explanation` 段落、三個按鈕
- `step === null` 時渲染 `.empty` 空狀態文字，隱藏 btn-apply，保留 btn-next / btn-close
- 卡片樣式：白底、圓角、淺陰影，scoped CSS 不影響外部

### HintOverlay.test.ts
15 項測試涵蓋：
1. 各技巧 ID 中文名對應（7 個 it.each + naked-single 獨立）
2. explanation 文字渲染
3. 三個按鈕 emit 正確事件
4. step=null 顯示空狀態、隱藏 btn-apply、保留 btn-next / btn-close

## 實作決策備註
- 技巧名取自 `TechniqueStep.technique`（TechniqueId），不依賴 TechniqueMeta.name，避免跨層依賴
- step=null 時 apply 選擇隱藏（v-if），而非 disabled，符合任務規格「apply 可隱藏或 disable」的選項
