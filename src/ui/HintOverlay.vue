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
    <!-- 右上角 ✕ 關閉鈕（與「關閉」按鈕走同一個 emit） -->
    <button
      type="button"
      class="hint-close"
      data-testid="hint-close-x"
      aria-label="關閉"
      @click="emit('close')"
    >
      ✕
    </button>

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
/* 提示面板容器：浮起卡片；寬度填滿父容器，desktop 由 PlayView aside 限制最大寬度 */
.hint-overlay {
  position: relative;
  width: 100%;
  box-sizing: border-box;
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 14px 18px;
  box-shadow: 0 8px 24px -8px rgba(15, 23, 42, 0.2), 0 2px 6px rgba(15, 23, 42, 0.06);
}

/* 右上角浮動 ✕ 關閉鈕 */
.hint-close {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: #64748b;
  font-size: 0.95rem;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.hint-close:hover {
  background: #f1f5f9;
  color: #334155;
}

/* 標頭區：中文名 + 副標並列；右側預留空間給 ✕ 關閉鈕 */
.hint-header {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 8px;
  padding-right: 36px;
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

/* 按鈕群組：三顆按鈕等寬填滿一列 */
.hint-actions {
  display: flex;
  gap: 8px;
  flex-wrap: nowrap;
}

.btn {
  flex: 1 1 0;
  min-width: 0;
  padding: 9px 8px;
  border-radius: 10px;
  border: 1px solid transparent;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition:
    transform 0.08s ease-out,
    box-shadow 0.12s ease-out,
    background 0.15s ease-out;
}

/* 套用：藍色（主動作） */
.btn-apply {
  color: #fff;
  border-color: #1e40af;
  background: linear-gradient(180deg, #3b82f6 0%, #2563eb 100%);
  box-shadow: 0 2px 0 0 #1e40af, 0 4px 8px -2px rgba(29, 78, 216, 0.4);
}

.btn-apply:hover {
  background: linear-gradient(180deg, #60a5fa 0%, #3b82f6 100%);
}

.btn-apply:active {
  transform: translateY(2px);
  box-shadow: 0 0 0 0 #1e40af, inset 0 2px 4px rgba(0, 0, 0, 0.25);
}

/* 下一個：綠色（前進） */
.btn-next {
  color: #fff;
  border-color: #047857;
  background: linear-gradient(180deg, #10b981 0%, #059669 100%);
  box-shadow: 0 2px 0 0 #047857, 0 4px 8px -2px rgba(5, 150, 105, 0.4);
}

.btn-next:hover {
  background: linear-gradient(180deg, #34d399 0%, #10b981 100%);
}

.btn-next:active {
  transform: translateY(2px);
  box-shadow: 0 0 0 0 #047857, inset 0 2px 4px rgba(0, 0, 0, 0.25);
}

/* 關閉：橘黃色（離開動作） */
.btn-close {
  color: #fff;
  border-color: #b45309;
  background: linear-gradient(180deg, #fbbf24 0%, #f59e0b 100%);
  box-shadow: 0 2px 0 0 #b45309, 0 4px 8px -2px rgba(180, 83, 9, 0.4);
}

.btn-close:hover {
  background: linear-gradient(180deg, #fcd34d 0%, #fbbf24 100%);
}

.btn-close:active {
  transform: translateY(2px);
  box-shadow: 0 0 0 0 #b45309, inset 0 2px 4px rgba(0, 0, 0, 0.25);
}
</style>
