import { create } from 'zustand';
import type { BarPosition, SelectionRange } from '../models/types';

type SelectionMode = 'bar' | 'section' | 'chord';

interface SelectionState {
  selection: SelectionRange | null;
  selectionMode: SelectionMode;
  setSelection: (range: SelectionRange | null) => void;
  selectBar: (sectionIndex: number, barIndex: number) => void;
  selectSection: (sectionIndex: number, barCount: number) => void;
  clearSelection: () => void;
}

export const useSelectionStore = create<SelectionState>((set) => ({
  selection: null,
  selectionMode: 'bar',

  setSelection: (range) => set({ selection: range }),

  selectBar: (sectionIndex, barIndex) => {
    const pos: BarPosition = { sectionIndex, barIndex };
    set({ selection: { start: pos, end: pos }, selectionMode: 'bar' });
  },

  selectSection: (sectionIndex, barCount) => {
    set({
      selection: {
        start: { sectionIndex, barIndex: 0 },
        end: { sectionIndex, barIndex: Math.max(0, barCount - 1) },
      },
      selectionMode: 'section',
    });
  },

  clearSelection: () => set({ selection: null }),
}));
