<template>
  <div class="number-pad">
    <!-- 數字按鈕區塊 1-9 -->
    <div class="number-row">
      <button
        v-for="n in 9"
        :key="n"
        class="number-btn"
        :class="{ 'is-exhausted': remainingCounts[n - 1] === 0 }"
        :disabled="remainingCounts[n - 1] === 0"
        @click="handleNumber(n)"
      >
        {{ n }}
        <span class="count">{{ remainingCounts[n - 1] }}</span>
      </button>
    </div>

    <!-- 功能按鈕區塊：清除 + 鉛筆模式 -->
    <div class="action-row">
      <button class="clear-btn" @click="handleClear">
        ✕ 清除
      </button>
      <button
        class="pencil-btn"
        :class="{ 'is-active': pencilMode }"
        @click="handleTogglePencil"
      >
        ✏ 鉛筆
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
/** 數字輸入面板元件：顯示 1-9 數字按鈕、清除鍵與鉛筆模式切換 */

interface Props {
  /** 各數字剩餘可填數量（index 0 = 數字 1，依此類推），length 必須為 9 */
  remainingCounts: number[]
  /** 是否為鉛筆（草稿候選）模式 */
  pencilMode: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  /** 玩家點選數字 1-9 時觸發 */
  number: [value: number]
  /** 玩家點清除鍵時觸發 */
  clear: []
  /** 玩家切換鉛筆模式時觸發 */
  togglePencil: []
}>()

/**
 * 處理數字按鈕點擊
 * 剩餘數量為 0 的按鈕已設 disabled，此處為保險防護
 */
function handleNumber(n: number): void {
  if (props.remainingCounts[n - 1] === 0) {
    return
  }
  emit('number', n)
}

/** 處理清除按鈕點擊 */
function handleClear(): void {
  emit('clear')
}

/** 處理鉛筆模式切換按鈕點擊 */
function handleTogglePencil(): void {
  emit('togglePencil')
}
</script>

<style scoped>
/* 整體容器 */
.number-pad {
  display: flex;
  flex-direction: column;
  gap: 8px;
  user-select: none;
}

/* 數字按鈕橫排：固定一列 9 顆，自動分配寬度與間距 */
.number-row {
  display: flex;
  flex-wrap: nowrap;
  gap: clamp(2px, 0.8vw, 8px);
  justify-content: stretch;
  width: 100%;
}

/* 單一數字按鈕：flex: 1 平分寬度，高度與字體跟著放大 */
.number-btn {
  position: relative;
  display: flex;
  flex: 1 1 0;
  min-width: 0;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: clamp(56px, 9vw, 72px);
  font-size: clamp(1.4rem, 3.2vw, 1.9rem);
  font-weight: 700;
  color: #1e3a8a;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  background: linear-gradient(180deg, #ffffff 0%, #e2e8f0 100%);
  cursor: pointer;
  box-shadow:
    0 2px 0 0 #94a3b8,
    0 4px 8px -2px rgba(15, 23, 42, 0.15);
  transition:
    transform 0.08s ease-out,
    box-shadow 0.12s ease-out,
    background 0.15s ease-out;
}

.number-btn:hover:not(:disabled) {
  background: linear-gradient(180deg, #f8fafc 0%, #cbd5e1 100%);
}

.number-btn:active:not(:disabled) {
  transform: translateY(2px);
  box-shadow:
    0 0 0 0 #94a3b8,
    inset 0 2px 4px rgba(15, 23, 42, 0.2);
  background: linear-gradient(180deg, #cbd5e1 0%, #94a3b8 100%);
}

/* 剩餘數量小字（底部） */
.count {
  font-size: clamp(0.65rem, 1.2vw, 0.8rem);
  font-weight: 400;
  color: #666;
  line-height: 1;
  margin-top: 3px;
}

/* 已填滿（剩 0）的按鈕灰化 */
.number-btn.is-exhausted,
.number-btn:disabled {
  color: #cbd5e1;
  border-color: #e2e8f0;
  background: #f1f5f9;
  cursor: not-allowed;
  box-shadow: none;
  transform: translateY(2px);
}

.number-btn.is-exhausted .count {
  color: #ccc;
}

/* 功能按鈕列 */
.action-row {
  display: flex;
  gap: 8px;
  justify-content: center;
}

/* 清除與鉛筆按鈕共用立體樣式 */
.clear-btn,
.pencil-btn {
  padding: 10px 20px;
  font-size: 0.95rem;
  font-weight: 600;
  color: #475569;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  background: linear-gradient(180deg, #ffffff 0%, #e2e8f0 100%);
  cursor: pointer;
  box-shadow:
    0 2px 0 0 #94a3b8,
    0 4px 8px -2px rgba(15, 23, 42, 0.15);
  transition:
    transform 0.08s ease-out,
    box-shadow 0.12s ease-out,
    background 0.15s ease-out;
}

.clear-btn:hover,
.pencil-btn:hover {
  background: linear-gradient(180deg, #f8fafc 0%, #cbd5e1 100%);
}

.clear-btn:active,
.pencil-btn:not(.is-active):active {
  transform: translateY(2px);
  box-shadow:
    0 0 0 0 #94a3b8,
    inset 0 2px 4px rgba(15, 23, 42, 0.2);
}

/* 鉛筆模式啟用狀態：綠色立體 + 凹陷感（持續按下） */
.pencil-btn.is-active {
  color: #fff;
  border-color: #15803d;
  background: linear-gradient(180deg, #22c55e 0%, #16a34a 100%);
  box-shadow:
    0 2px 0 0 #15803d,
    0 4px 8px -2px rgba(21, 128, 61, 0.4);
}

.pencil-btn.is-active:hover {
  background: linear-gradient(180deg, #4ade80 0%, #22c55e 100%);
}

.pencil-btn.is-active:active {
  transform: translateY(2px);
  box-shadow:
    0 0 0 0 #15803d,
    inset 0 2px 4px rgba(0, 0, 0, 0.25);
}
</style>
