---
id: 12-serializer
phase: P1
status: todo
depends_on: [01-shared-types, 10-board-core]
assignee: null
estimated_complexity: S
acceptance:
  - "可在 81 字串 ↔ Board 互轉"
  - "可在 Board ↔ JSON 互轉（含候選數）"
  - "對非法輸入有明確錯誤"
deliverables:
  - "src/core/serializer.ts"
  - "src/core/serializer.test.ts"
---

# 12 — 序列化

## 目標
盤面在不同格式間互轉，供使用者輸入、進度儲存、URL 分享用。

## API 規格

```ts
/** 81 字串 → Board；空格用 '.' 或 '0' */
parseBoardString(input: string): Board;

/** Board → 81 字串（空格用 '.'） */
toBoardString(board: Board): string;

/** Board → JSON（含候選數，Set 轉 array） */
toJSON(board: Board): string;

/** JSON → Board */
fromJSON(json: string): Board;
```

## 實作要點
- `parseBoardString`：
  - 忽略空白與換行（允許多行輸入）
  - 接受 `.`、`0`、空格作為空格
  - 長度檢查（必須恰好 81 個有效字元）
  - 非 1-9 / 空格的字元 → 拋錯
- JSON：candidates 用 `Array.from(set)`，反序列化時 `new Set(arr)`

## 錯誤格式

```ts
class SerializeError extends Error {
  constructor(public reason: 'length' | 'invalid-char' | 'json-parse', message: string);
}
```

## 測試項目
- 已知 81 字串 round-trip：parse → toString → 結果相同
- `.` 與 `0` 皆視為空格
- 長度 != 81 → throw `length`
- 含 `a` → throw `invalid-char`
- 含候選數的 Board → JSON round-trip 候選數正確還原

## 完工條件
- API 完成、`pnpm test` 全綠
