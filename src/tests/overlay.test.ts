import { describe, it, expect, beforeEach } from 'vitest';
import { act } from '@testing-library/react';
import { useOverlayStore } from '../store/overlayStore';

// ─── Overlay store tests ──────────────────────────────────────────────────────

describe('overlayStore — toggleOverlay', () => {
  beforeEach(() => {
    // Reset to defaults before each test
    act(() => {
      const store = useOverlayStore.getState();
      store.setOverlay('showChordSymbols',    true);
      store.setOverlay('showRomanNumerals',   false);
      store.setOverlay('showFunctionTags',    false);
      store.setOverlay('showSectionLabels',   true);
      store.setOverlay('showKeyContext',      true);
      store.setOverlay('showNashvilleNumbers', false);
      store.setOverlay('showCadenceMarkers',  false);
    });
  });

  it('showChordSymbols defaults to true', () => {
    const { settings } = useOverlayStore.getState();
    expect(settings.showChordSymbols).toBe(true);
  });

  it('showRomanNumerals defaults to false', () => {
    const { settings } = useOverlayStore.getState();
    expect(settings.showRomanNumerals).toBe(false);
  });

  it('showFunctionTags defaults to false', () => {
    const { settings } = useOverlayStore.getState();
    expect(settings.showFunctionTags).toBe(false);
  });

  it('showNashvilleNumbers defaults to false', () => {
    const { settings } = useOverlayStore.getState();
    expect(settings.showNashvilleNumbers).toBe(false);
  });

  it('showCadenceMarkers defaults to false', () => {
    const { settings } = useOverlayStore.getState();
    expect(settings.showCadenceMarkers).toBe(false);
  });

  it('showSectionLabels defaults to true', () => {
    const { settings } = useOverlayStore.getState();
    expect(settings.showSectionLabels).toBe(true);
  });

  it('showKeyContext defaults to true', () => {
    const { settings } = useOverlayStore.getState();
    expect(settings.showKeyContext).toBe(true);
  });

  it('toggleOverlay flips a false setting to true', () => {
    act(() => useOverlayStore.getState().toggleOverlay('showRomanNumerals'));
    expect(useOverlayStore.getState().settings.showRomanNumerals).toBe(true);
  });

  it('toggleOverlay flips a true setting to false', () => {
    act(() => useOverlayStore.getState().toggleOverlay('showChordSymbols'));
    expect(useOverlayStore.getState().settings.showChordSymbols).toBe(false);
  });

  it('toggleOverlay twice returns to original state', () => {
    act(() => useOverlayStore.getState().toggleOverlay('showRomanNumerals'));
    act(() => useOverlayStore.getState().toggleOverlay('showRomanNumerals'));
    expect(useOverlayStore.getState().settings.showRomanNumerals).toBe(false);
  });

  it('setOverlay sets a specific value directly', () => {
    act(() => useOverlayStore.getState().setOverlay('showFunctionTags', true));
    expect(useOverlayStore.getState().settings.showFunctionTags).toBe(true);
  });

  it('setting one overlay does not affect others', () => {
    act(() => useOverlayStore.getState().toggleOverlay('showRomanNumerals'));
    const { settings } = useOverlayStore.getState();
    // Other fields should be unchanged
    expect(settings.showChordSymbols).toBe(true);
    expect(settings.showFunctionTags).toBe(false);
    expect(settings.showCadenceMarkers).toBe(false);
  });

  it('all overlay keys are present in settings', () => {
    const { settings } = useOverlayStore.getState();
    const expectedKeys = [
      'showChordSymbols', 'showRomanNumerals', 'showFunctionTags',
      'showSectionLabels', 'showKeyContext', 'showNashvilleNumbers', 'showCadenceMarkers',
    ];
    for (const key of expectedKeys) {
      expect(settings).toHaveProperty(key);
    }
  });

  it('can toggle multiple overlays independently', () => {
    act(() => {
      useOverlayStore.getState().toggleOverlay('showRomanNumerals');
      useOverlayStore.getState().toggleOverlay('showFunctionTags');
      useOverlayStore.getState().toggleOverlay('showNashvilleNumbers');
    });
    const { settings } = useOverlayStore.getState();
    expect(settings.showRomanNumerals).toBe(true);
    expect(settings.showFunctionTags).toBe(true);
    expect(settings.showNashvilleNumbers).toBe(true);
    expect(settings.showCadenceMarkers).toBe(false); // unchanged
  });
});
