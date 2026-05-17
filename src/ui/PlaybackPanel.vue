<script setup lang="ts">
/**
 * PlaybackPanel — 觀摩模式播放控制面板
 * 功能：步驟列表 + 上/下/播放-暫停/速度切換
 * 純 prop-driven，不持有任何狀態，所有互動透過 emit 向父元件回報
 */
import type { TechniqueStep, TechniqueId } from '@/types/technique'

// Props 定義
interface Props {
  /** 所有解題步驟 */
  steps: TechniqueStep[]
  /** 當前步驟索引，-1 表示尚未開始 */
  currentStepIndex: number
  /** 是否正在自動播放 */
  autoPlaying: boolean
  /** 播放速度 */
  speed: 'slow' | 'normal' | 'fast'
}

const props = defineProps<Props>()

// Emits 定義
const emit = defineEmits<{
  /** 上一步 */
  prev: []
  /** 下一步 */
  next: []
  /** 開始自動播放 */
  play: []
  /** 暫停自動播放 */
  pause: []
  /** 跳到指定步驟索引 */
  jumpTo: [index: number]
  /** 切換播放速度 */
  setSpeed: [s: 'slow' | 'normal' | 'fast']
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
  backtrack: '暴力回溯',
}

/**
 * 取得技巧 ID 的中文名；找不到時回傳原始 ID
 */
function getTechniqueName(id: TechniqueId): string {
  return techniqueNameMap[id] ?? id
}

/**
 * 處理播放/暫停按鈕點擊
 * autoPlaying=true → emit pause；false → emit play
 */
function handlePlayPause() {
  if (props.autoPlaying) {
    emit('pause')
  } else {
    emit('play')
  }
}

/**
 * 處理速度選單切換
 */
function handleSpeedChange(event: Event) {
  const value = (event.target as HTMLSelectElement).value as 'slow' | 'normal' | 'fast'
  emit('setSpeed', value)
}
</script>

<template>
  <!-- 觀摩面板容器：步驟列表 + 控制列 -->
  <div class="playback-panel">
    <!-- 步驟列表 -->
    <ul class="step-list">
      <li
        v-for="(step, index) in props.steps"
        :key="index"
        class="step-item"
        :class="{ 'is-current': props.currentStepIndex === index }"
        :data-testid="`step-${index}`"
        @click="emit('jumpTo', index)"
      >
        <!-- 顯示「第 N+1 步 — 技巧中文名」 -->
        第 {{ index + 1 }} 步 — {{ getTechniqueName(step.technique) }}
      </li>
    </ul>

    <!-- 無步驟時的空狀態 -->
    <p v-if="props.steps.length === 0" class="empty">尚無步驟</p>

    <!-- 播放控制列 -->
    <div class="playback-controls">
      <!-- 上一步按鈕：尚未開始（-1）時 disabled -->
      <button
        class="ctrl-btn"
        :class="{ 'is-disabled': props.currentStepIndex <= -1 }"
        data-testid="btn-prev"
        :disabled="props.currentStepIndex <= -1"
        @click="emit('prev')"
      >
        上一步
      </button>

      <!-- 下一步按鈕：已到末步時 disabled -->
      <button
        class="ctrl-btn"
        :class="{ 'is-disabled': props.currentStepIndex >= props.steps.length - 1 }"
        data-testid="btn-next"
        :disabled="props.currentStepIndex >= props.steps.length - 1"
        @click="emit('next')"
      >
        下一步
      </button>

      <!-- 播放/暫停按鈕 -->
      <button
        class="ctrl-btn is-emphasis"
        data-testid="btn-play-pause"
        @click="handlePlayPause"
      >
        {{ props.autoPlaying ? '暫停' : '播放' }}
      </button>

      <!-- 速度選擇下拉選單 -->
      <select
        class="speed-select"
        data-testid="speed-select"
        :value="props.speed"
        @change="handleSpeedChange"
      >
        <option value="slow">慢速</option>
        <option value="normal">正常</option>
        <option value="fast">快速</option>
      </select>
    </div>
  </div>
</template>

<style scoped>
/* 面板容器 */
.playback-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: #ffffff;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  min-width: 200px;
}

/* 步驟列表 */
.step-list {
  list-style: none;
  margin: 0;
  padding: 0;
  max-height: 320px;
  overflow-y: auto;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
}

/* 單一步驟列 */
.step-item {
  padding: 8px 12px;
  font-size: 0.875rem;
  color: #374151;
  cursor: pointer;
  transition: background 0.1s;
  border-bottom: 1px solid #f3f4f6;
}

.step-item:last-child {
  border-bottom: none;
}

.step-item:hover {
  background: #f9fafb;
}

/* 當前步驟高亮 */
.step-item.is-current {
  background: #dbeafe;
  color: #1d4ed8;
  font-weight: 600;
}

/* 空狀態文字 */
.empty {
  font-size: 0.875rem;
  color: #9ca3af;
  text-align: center;
  margin: 0;
}

/* 控制列：橫向排列 */
.playback-controls {
  display: flex;
  flex-direction: row;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

/* 基礎按鈕樣式（對齊 ControlPanel 風格） */
.ctrl-btn {
  padding: 6px 14px;
  border: 1px solid #ccc;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
  font-size: 14px;
  color: #333;
  transition: background 0.15s, opacity 0.15s;
}

.ctrl-btn:hover:not(:disabled) {
  background: #f0f0f0;
}

/* disabled 狀態 */
.ctrl-btn.is-disabled,
.ctrl-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  color: #999;
  border-color: #ddd;
}

/* 強調色：播放/暫停按鈕（藍色） */
.ctrl-btn.is-emphasis {
  background: #2563eb;
  border-color: #1d4ed8;
  color: #fff;
}

.ctrl-btn.is-emphasis:hover {
  background: #1d4ed8;
}

/* 速度選擇下拉 */
.speed-select {
  padding: 5px 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
  color: #333;
  background: #fff;
  cursor: pointer;
}

.speed-select:focus {
  outline: 2px solid #2563eb;
  outline-offset: 1px;
}
</style>
