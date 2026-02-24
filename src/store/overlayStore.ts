import { create } from 'zustand';
import type { OverlaySettings } from '../models/types';

interface OverlayState {
  settings: OverlaySettings;
  toggleOverlay: (key: keyof OverlaySettings) => void;
  setOverlay: (key: keyof OverlaySettings, value: boolean) => void;
}

const DEFAULT_SETTINGS: OverlaySettings = {
  showChordSymbols:    true,
  showRomanNumerals:   false,
  showFunctionTags:    false,
  showSectionLabels:   true,
  showKeyContext:      true,
  showNashvilleNumbers: false,
  showCadenceMarkers:  false,
};

export const useOverlayStore = create<OverlayState>((set, get) => ({
  settings: { ...DEFAULT_SETTINGS },

  toggleOverlay: (key) => {
    const { settings } = get();
    set({ settings: { ...settings, [key]: !settings[key] } });
  },

  setOverlay: (key, value) => {
    set({ settings: { ...get().settings, [key]: value } });
  },
}));
