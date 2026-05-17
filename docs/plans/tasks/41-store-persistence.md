---
id: 41-store-persistence
phase: P2
status: done
depends_on: [40-store-game, 12-serializer]
assignee: claude-code
completed_at: 2026-05-17
estimated_complexity: S
acceptance:
  - "進度自動存 localStorage"
  - "啟動時自動還原"
  - "可清除進度"
  - "test 通過（mock localStorage）"
deliverables:
  - "src/stores/persistence.ts"
  - "src/stores/persistence.test.ts"
---

# 41 — 進度持久化

## 目標
遊戲進度自動存 localStorage，重新整理頁面繼續玩。

## API

```ts
saveProgress(state: GameState): void
loadProgress(): GameState | null
clearProgress(): void
```

## 實作要點
- key：`sudoku.progress.v1`（含版本，未來 schema 變更易處理）
- 序列化：使用 12-serializer 的 `toJSON`
- 反序列化失敗 → return null（容錯，不阻擋使用者）
- 訂閱 game store 變化 → debounce 500ms 後存

## 整合方式
- 在 main.ts 中 `app.use(pinia)` 後，呼叫一次 `loadProgress` 還原
- 在 `game` store 內以 `$subscribe` 觸發 saveProgress

## 測試
- mock `globalThis.localStorage`
- save → load round-trip 結果一致
- 壞掉的 JSON → load 回 null
- clearProgress → localStorage 該 key 被移除

## 完工條件
- API + 測試完成
