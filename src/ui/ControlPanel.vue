<template>
  <!-- 控制面板：橫列按鈕組，純 prop-driven，不持有狀態 -->
  <div class="control-panel">
    <!-- 新局按鈕 -->
    <button
      class="ctrl-btn"
      data-testid="btn-new-game"
      @click="emit('newGame')"
    >
      新局
    </button>

    <!-- 復原按鈕：可用時藍色，不可用時 disabled -->
    <button
      class="ctrl-btn"
      :class="{ 'is-disabled': !canUndo }"
      data-testid="btn-undo"
      :disabled="!canUndo"
      @click="handleUndo"
    >
      復原
    </button>

    <!-- 重做按鈕：可用時藍色，不可用時 disabled -->
    <button
      class="ctrl-btn"
      :class="{ 'is-disabled': !canRedo }"
      data-testid="btn-redo"
      :disabled="!canRedo"
      @click="handleRedo"
    >
      重做
    </button>

    <!-- 提示按鈕：強調色（橘黃） -->
    <button
      class="ctrl-btn is-emphasis"
      data-testid="btn-hint"
      @click="emit('hint')"
    >
      提示
    </button>

    <!-- 自動填入候選：一次計算所有空格的合法候選並寫入（覆蓋現有候選） -->
    <button
      class="ctrl-btn"
      data-testid="btn-fill-candidates"
      @click="emit('fillCandidates')"
    >
      自動候選
    </button>

    <!-- 移除所有鉛筆：清空所有格的候選 -->
    <button
      class="ctrl-btn"
      data-testid="btn-clear-candidates"
      @click="emit('clearCandidates')"
    >
      移除鉛筆
    </button>

    <!-- 檢查錯誤按鈕 -->
    <button
      class="ctrl-btn"
      data-testid="btn-check-errors"
      @click="emit('checkErrors')"
    >
      檢查錯誤
    </button>
  </div>
</template>

<script setup lang="ts">
/**
 * ControlPanel — 控制面板元件
 * 提供：新局 / 復原 / 重做 / 提示 / 自動候選 / 移除鉛筆 / 檢查錯誤
 * 純 prop-driven，所有動作透過 emit 向父元件回報
 */

interface Props {
  /** 是否可執行復原 */
  canUndo: boolean;
  /** 是否可執行重做 */
  canRedo: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  /** 開始新局（父元件負責彈出難度選單） */
  newGame: [];
  /** 復原上一步 */
  undo: [];
  /** 重做下一步 */
  redo: [];
  /** 請求提示 */
  hint: [];
  /** 自動填入所有候選 */
  fillCandidates: [];
  /** 移除所有鉛筆（清空所有候選） */
  clearCandidates: [];
  /** 一次檢查所有錯誤 */
  checkErrors: [];
}>();

/**
 * 處理復原點擊：canUndo=false 時不 emit（disabled 已阻擋，雙重保護）
 */
function handleUndo() {
  if (!props.canUndo) {
    return;
  }
  emit('undo');
}

/**
 * 處理重做點擊：canRedo=false 時不 emit
 */
function handleRedo() {
  if (!props.canRedo) {
    return;
  }
  emit('redo');
}
</script>

<style scoped>
/* 控制面板容器：按鈕橫列排列 */
.control-panel {
  display: flex;
  flex-direction: row;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

/* 基礎按鈕樣式：立體陰影 + 漸層 */
.ctrl-btn {
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 600;
  color: #475569;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  background: linear-gradient(180deg, #ffffff 0%, #e2e8f0 100%);
  cursor: pointer;
  box-shadow:
    0 2px 0 0 #94a3b8,
    0 4px 8px -2px rgba(15, 23, 42, 0.12);
  transition:
    transform 0.08s ease-out,
    box-shadow 0.12s ease-out,
    background 0.15s ease-out;
}

.ctrl-btn:hover:not(:disabled) {
  background: linear-gradient(180deg, #f8fafc 0%, #cbd5e1 100%);
}

.ctrl-btn:not(:disabled):not(.is-disabled):active {
  transform: translateY(2px);
  box-shadow:
    0 0 0 0 #94a3b8,
    inset 0 2px 4px rgba(15, 23, 42, 0.2);
}

/* undo / redo 可用時藍字 */
button[data-testid='btn-undo']:not(.is-disabled),
button[data-testid='btn-redo']:not(.is-disabled) {
  color: #2563eb;
}

/* disabled 狀態 */
.ctrl-btn.is-disabled,
.ctrl-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  color: #94a3b8;
  background: #f1f5f9;
  box-shadow: none;
  transform: translateY(2px);
}

/* 強調色：橘黃（提示按鈕） */
.ctrl-btn.is-emphasis {
  color: #fff;
  border-color: #b45309;
  background: linear-gradient(180deg, #fbbf24 0%, #f59e0b 100%);
  box-shadow:
    0 2px 0 0 #b45309,
    0 4px 8px -2px rgba(180, 83, 9, 0.4);
}

.ctrl-btn.is-emphasis:hover:not(:disabled) {
  background: linear-gradient(180deg, #fcd34d 0%, #fbbf24 100%);
}

.ctrl-btn.is-emphasis:not(:disabled):active {
  box-shadow:
    0 0 0 0 #b45309,
    inset 0 2px 4px rgba(0, 0, 0, 0.25);
}
</style>
