/**
 * ControlPanel 元件測試
 * 測試項目：
 * 1. 各按鈕點擊 → 對應 emit
 * 2. canUndo=false → undo 鈕 disabled、點擊不 emit
 * 3. canRedo=false → redo 鈕 disabled、點擊不 emit
 * 4. autoCandidates=true → auto-candidates 鈕有 .is-active
 */

import { mount } from '@vue/test-utils';
import { describe, it, expect } from 'vitest';
import ControlPanel from './ControlPanel.vue';

/** 建立預設 props 的元件掛載 */
function mountPanel(props: { canUndo?: boolean; canRedo?: boolean; autoCandidates?: boolean } = {}) {
  return mount(ControlPanel, {
    props: {
      canUndo: props.canUndo ?? true,
      canRedo: props.canRedo ?? true,
      autoCandidates: props.autoCandidates ?? false,
    },
  });
}

describe('ControlPanel', () => {
  // ── 各按鈕 emit 驗證 ────────────────────────────────────

  it('點擊「新局」→ emit newGame', async () => {
    const wrapper = mountPanel();
    await wrapper.get('[data-testid="btn-new-game"]').trigger('click');
    expect(wrapper.emitted('newGame')).toHaveLength(1);
  });

  it('點擊「復原」（canUndo=true）→ emit undo', async () => {
    const wrapper = mountPanel({ canUndo: true });
    await wrapper.get('[data-testid="btn-undo"]').trigger('click');
    expect(wrapper.emitted('undo')).toHaveLength(1);
  });

  it('點擊「重做」（canRedo=true）→ emit redo', async () => {
    const wrapper = mountPanel({ canRedo: true });
    await wrapper.get('[data-testid="btn-redo"]').trigger('click');
    expect(wrapper.emitted('redo')).toHaveLength(1);
  });

  it('點擊「提示」→ emit hint', async () => {
    const wrapper = mountPanel();
    await wrapper.get('[data-testid="btn-hint"]').trigger('click');
    expect(wrapper.emitted('hint')).toHaveLength(1);
  });

  it('點擊「自動候選」→ emit toggleAutoCandidates', async () => {
    const wrapper = mountPanel();
    await wrapper.get('[data-testid="btn-auto-candidates"]').trigger('click');
    expect(wrapper.emitted('toggleAutoCandidates')).toHaveLength(1);
  });

  it('點擊「檢查錯誤」→ emit checkErrors', async () => {
    const wrapper = mountPanel();
    await wrapper.get('[data-testid="btn-check-errors"]').trigger('click');
    expect(wrapper.emitted('checkErrors')).toHaveLength(1);
  });

  // ── canUndo=false ────────────────────────────────────────

  it('canUndo=false → undo 鈕有 .is-disabled class', () => {
    const wrapper = mountPanel({ canUndo: false });
    const btn = wrapper.get('[data-testid="btn-undo"]');
    expect(btn.classes()).toContain('is-disabled');
  });

  it('canUndo=false → undo 鈕有 disabled 屬性', () => {
    const wrapper = mountPanel({ canUndo: false });
    const btn = wrapper.get('[data-testid="btn-undo"]');
    expect((btn.element as HTMLButtonElement).disabled).toBe(true);
  });

  it('canUndo=false → 點擊 undo 鈕不 emit', async () => {
    const wrapper = mountPanel({ canUndo: false });
    // disabled 按鈕：直接呼叫 trigger 仍可觸發，但元件內部 guard 攔截
    await wrapper.get('[data-testid="btn-undo"]').trigger('click');
    expect(wrapper.emitted('undo')).toBeUndefined();
  });

  // ── canRedo=false ────────────────────────────────────────

  it('canRedo=false → redo 鈕有 .is-disabled class', () => {
    const wrapper = mountPanel({ canRedo: false });
    const btn = wrapper.get('[data-testid="btn-redo"]');
    expect(btn.classes()).toContain('is-disabled');
  });

  it('canRedo=false → redo 鈕有 disabled 屬性', () => {
    const wrapper = mountPanel({ canRedo: false });
    const btn = wrapper.get('[data-testid="btn-redo"]');
    expect((btn.element as HTMLButtonElement).disabled).toBe(true);
  });

  it('canRedo=false → 點擊 redo 鈕不 emit', async () => {
    const wrapper = mountPanel({ canRedo: false });
    await wrapper.get('[data-testid="btn-redo"]').trigger('click');
    expect(wrapper.emitted('redo')).toBeUndefined();
  });

  // ── autoCandidates ───────────────────────────────────────

  it('autoCandidates=true → auto-candidates 鈕有 .is-active', () => {
    const wrapper = mountPanel({ autoCandidates: true });
    const btn = wrapper.get('[data-testid="btn-auto-candidates"]');
    expect(btn.classes()).toContain('is-active');
  });

  it('autoCandidates=false → auto-candidates 鈕無 .is-active', () => {
    const wrapper = mountPanel({ autoCandidates: false });
    const btn = wrapper.get('[data-testid="btn-auto-candidates"]');
    expect(btn.classes()).not.toContain('is-active');
  });
});
