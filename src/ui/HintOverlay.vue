<script setup lang="ts">
import type { TechniqueStep, TechniqueId } from '@/types/technique'

// Props 定義
interface Props {
  step: TechniqueStep | null
}

const props = defineProps<Props>()

// Emits 定義
const emit = defineEmits<{
  apply: []
  next: []
  close: []
}>()

// 技巧 ID → 中文名對應表
const techniqueNameMap: Record<TechniqueId, string> = {
  'naked-single': '裸單',
  'hidden-single': '隱單',
  'naked-pair': '裸對',
  'hidden-pair': '隱對',
  'naked-triple': '裸三',
  'pointing-pair': '指向對',
  'box-line-reduction': '區塊行列消除',
  'hidden-triple': '隱三',
  'naked-quad': '裸四',
  'x-wing': 'X-Wing（雙線矩形）',
  swordfish: 'Swordfish（劍魚）',
  'xy-wing': 'XY-Wing（XY 樞紐）',
  skyscraper: 'Skyscraper（摩天樓）',
  'simple-coloring': 'Simple Coloring（單數字著色）',
  'unique-rectangle': 'Unique Rectangle（唯一矩形）',
  'xyz-wing': 'XYZ-Wing',
  backtrack: '暴力回溯',
}

// 依 step.technique 取得中文名；找不到時回傳原始 ID
function getTechniqueName(id: TechniqueId): string {
  return techniqueNameMap[id] ?? id
}
</script>

<template>
  <!-- 提示面板：卡片樣式，prop-driven，不持有任何棋盤狀態 -->
  <div class="hint-overlay">
    <!-- 有提示步驟時的完整內容 -->
    <template v-if="props.step !== null">
      <!-- 標頭：技巧中文名 + 副標 -->
      <div class="hint-header">
        <span class="technique-name">{{ getTechniqueName(props.step.technique) }}</span>
        <span class="technique-sub">解題提示</span>
      </div>

      <!-- 說明文字 -->
      <p class="explanation">{{ props.step.explanation }}</p>

      <!-- 操作按鈕區 -->
      <div class="hint-actions">
        <button data-testid="btn-apply" class="btn btn-apply" @click="emit('apply')">
          套用
        </button>
        <button data-testid="btn-next" class="btn btn-next" @click="emit('next')">
          下一個
        </button>
        <button data-testid="btn-close" class="btn btn-close" @click="emit('close')">
          關閉
        </button>
      </div>
    </template>

    <!-- step=null 時的空狀態 -->
    <template v-else>
      <p class="empty">目前無可推薦步驟</p>

      <!-- 空狀態仍保留下一個 / 關閉按鈕；apply 隱藏 -->
      <div class="hint-actions">
        <button data-testid="btn-next" class="btn btn-next" @click="emit('next')">
          下一個
        </button>
        <button data-testid="btn-close" class="btn btn-close" @click="emit('close')">
          關閉
        </button>
      </div>
    </template>
  </div>
</template>

<style scoped>
/* 提示面板容器：輕量卡片 */
.hint-overlay {
  background: #ffffff;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 16px 20px;
  max-width: 360px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

/* 標頭區：中文名 + 副標並列 */
.hint-header {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 10px;
}

.technique-name {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1f2937;
}

.technique-sub {
  font-size: 0.8rem;
  color: #6b7280;
}

/* 說明文字 */
.explanation {
  font-size: 0.9rem;
  color: #374151;
  line-height: 1.6;
  margin: 0 0 14px;
}

/* 空狀態文字 */
.empty {
  font-size: 0.9rem;
  color: #9ca3af;
  margin: 0 0 14px;
}

/* 按鈕群組 */
.hint-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.btn {
  padding: 6px 14px;
  border-radius: 6px;
  border: 1px solid transparent;
  font-size: 0.85rem;
  cursor: pointer;
  transition: opacity 0.15s;
}

.btn:hover {
  opacity: 0.85;
}

.btn-apply {
  background: #2563eb;
  color: #ffffff;
}

.btn-next {
  background: #f3f4f6;
  color: #374151;
  border-color: #d1d5db;
}

.btn-close {
  background: #f3f4f6;
  color: #374151;
  border-color: #d1d5db;
}
</style>
