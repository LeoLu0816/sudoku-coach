<script setup lang="ts">
/**
 * PlaybackPanel — 觀摩模式播放控制面板
 * 功能：步驟列表 + 上/下/播放-暫停/速度切換 + 技巧類別過濾與著色
 * 純 prop-driven，不持有過濾 state 以外的狀態，所有互動透過 emit 向父元件回報
 */
import { computed, ref } from 'vue'
import type { TechniqueStep, TechniqueId } from '@/types/technique'

/** 技巧類別（用於著色與過濾） */
type TechniqueCategory = 'basic' | 'mid' | 'tier1' | 'tier2' | 'fallback'

/** 技巧 → 類別對應 */
const TECHNIQUE_CATEGORY: Record<TechniqueId, TechniqueCategory> = {
  'naked-single': 'basic',
  'hidden-single': 'basic',
  'naked-pair': 'mid',
  'hidden-pair': 'mid',
  'naked-triple': 'mid',
  'pointing-pair': 'mid',
  'box-line-reduction': 'mid',
  'hidden-triple': 'tier1',
  'naked-quad': 'tier1',
  'x-wing': 'tier1',
  swordfish: 'tier1',
  'xy-wing': 'tier1',
  skyscraper: 'tier2',
  'simple-coloring': 'tier2',
  'unique-rectangle': 'tier2',
  'xyz-wing': 'tier2',
  backtrack: 'fallback',
}

/** 類別中文標籤 */
const CATEGORY_LABEL: Record<TechniqueCategory, string> = {
  basic: '基礎',
  mid: '中階',
  tier1: '高階',
  tier2: '進階',
  fallback: '回溯',
}

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
  'hidden-triple': '隱三',
  'naked-quad': '裸四',
  'x-wing': 'X-Wing',
  swordfish: 'Swordfish',
  'xy-wing': 'XY-Wing',
  skyscraper: 'Skyscraper',
  'simple-coloring': 'Simple Coloring',
  'unique-rectangle': 'Unique Rectangle',
  'xyz-wing': 'XYZ-Wing',
  backtrack: '暴力回溯',
}

/**
 * 取得技巧 ID 的中文名；找不到時回傳原始 ID
 */
function getTechniqueName(id: TechniqueId): string {
  return techniqueNameMap[id] ?? id
}

/** 各類別是否顯示（過濾狀態，預設全顯示） */
const visibleCategories = ref<Record<TechniqueCategory, boolean>>({
  basic: true,
  mid: true,
  tier1: true,
  tier2: true,
  fallback: true,
})

/**
 * 切換某類別顯示/隱藏
 * 影響 step-item 的 CSS 顯示，不影響 currentStepIndex 邏輯
 */
function toggleCategory(cat: TechniqueCategory): void {
  visibleCategories.value[cat] = !visibleCategories.value[cat]
}

/** 取得 step 的技巧類別 */
function getStepCategory(step: TechniqueStep): TechniqueCategory {
  return TECHNIQUE_CATEGORY[step.technique] ?? 'basic'
}

/** 此盤面實際出現過的類別（過濾選項只顯示這些，避免空項） */
const activeCategories = computed<TechniqueCategory[]>(() => {
  const seen = new Set<TechniqueCategory>()
  for (const step of props.steps) {
    seen.add(getStepCategory(step))
  }
  return (['basic', 'mid', 'tier1', 'tier2', 'fallback'] as TechniqueCategory[])
    .filter((c) => seen.has(c))
})

/** 類別中文標籤公開給 template */
function categoryLabel(cat: TechniqueCategory): string {
  return CATEGORY_LABEL[cat]
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
  <!-- 觀摩面板容器：類別過濾 + 步驟列表 + 控制列 -->
  <div class="playback-panel">
    <!-- 類別過濾 checkbox 列 -->
    <div v-if="activeCategories.length > 1" class="category-filters" data-testid="category-filters">
      <label
        v-for="cat in activeCategories"
        :key="cat"
        class="cat-filter"
        :class="[`cat-${cat}`, { 'is-off': !visibleCategories[cat] }]"
      >
        <input
          type="checkbox"
          :checked="visibleCategories[cat]"
          :data-testid="`cat-toggle-${cat}`"
          @change="toggleCategory(cat)"
        />
        <span>{{ categoryLabel(cat) }}</span>
      </label>
    </div>

    <!-- 步驟列表（依過濾隱藏部分項，但保留原 index） -->
    <ul class="step-list">
      <li
        v-for="(step, index) in props.steps"
        v-show="visibleCategories[getStepCategory(step)]"
        :key="index"
        class="step-item"
        :class="[
          `cat-${getStepCategory(step)}`,
          { 'is-current': props.currentStepIndex === index },
        ]"
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

/* 技巧類別著色（左側 4px 邊條） */
.step-item.cat-basic {
  border-left: 4px solid #9ca3af;
}
.step-item.cat-mid {
  border-left: 4px solid #60a5fa;
}
.step-item.cat-tier1 {
  border-left: 4px solid #a78bfa;
}
.step-item.cat-tier2 {
  border-left: 4px solid #f59e0b;
}
.step-item.cat-fallback {
  border-left: 4px solid #ef4444;
}

/* 當前步驟高亮（覆蓋類別邊條的 background） */
.step-item.is-current {
  background: #dbeafe;
  color: #1d4ed8;
  font-weight: 600;
}

/* 類別過濾列 */
.category-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 4px 0;
  border-bottom: 1px solid #f3f4f6;
}

.cat-filter {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.8rem;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 4px;
  user-select: none;
}

.cat-filter input {
  cursor: pointer;
}

.cat-filter.is-off {
  opacity: 0.5;
  text-decoration: line-through;
}

.cat-filter.cat-basic {
  color: #4b5563;
}
.cat-filter.cat-mid {
  color: #2563eb;
}
.cat-filter.cat-tier1 {
  color: #7c3aed;
}
.cat-filter.cat-tier2 {
  color: #b45309;
}
.cat-filter.cat-fallback {
  color: #b91c1c;
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
