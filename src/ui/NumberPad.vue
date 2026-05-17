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

/* 數字按鈕橫排，小螢幕可換行 */
.number-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: center;
}

/* 單一數字按鈕 */
.number-btn {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 56px;
  font-size: 1.25rem;
  font-weight: 600;
  border: 1px solid #ccc;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
  transition: background 0.15s;
}

.number-btn:hover:not(:disabled) {
  background: #e8f0fe;
}

.number-btn:active:not(:disabled) {
  background: #c5d8fb;
}

/* 剩餘數量小字（底部） */
.count {
  font-size: 0.65rem;
  font-weight: 400;
  color: #666;
  line-height: 1;
  margin-top: 2px;
}

/* 已填滿（剩 0）的按鈕灰化 */
.number-btn.is-exhausted,
.number-btn:disabled {
  color: #bbb;
  border-color: #e0e0e0;
  background: #f5f5f5;
  cursor: not-allowed;
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

/* 清除與鉛筆按鈕共用底色 */
.clear-btn,
.pencil-btn {
  padding: 8px 16px;
  font-size: 0.9rem;
  border: 1px solid #ccc;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
  transition: background 0.15s;
}

.clear-btn:hover,
.pencil-btn:hover {
  background: #f0f0f0;
}

/* 鉛筆模式啟用狀態 */
.pencil-btn.is-active {
  background: #4caf50;
  color: #fff;
  border-color: #388e3c;
}

.pencil-btn.is-active:hover {
  background: #43a047;
}
</style>
