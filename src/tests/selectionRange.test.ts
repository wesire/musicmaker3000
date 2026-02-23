import { describe, it, expect, beforeEach } from 'vitest';
import { useSelectionStore } from '../store/selectionStore';

describe('Selection range store', () => {
  beforeEach(() => {
    useSelectionStore.getState().clearSelection();
  });

  it('starts with no selection', () => {
    const { selection } = useSelectionStore.getState();
    expect(selection).toBeNull();
  });

  it('selectBar sets selection for a single bar', () => {
    useSelectionStore.getState().selectBar(1, 3);
    const { selection } = useSelectionStore.getState();
    expect(selection).not.toBeNull();
    expect(selection!.start.sectionIndex).toBe(1);
    expect(selection!.start.barIndex).toBe(3);
    expect(selection!.end.sectionIndex).toBe(1);
    expect(selection!.end.barIndex).toBe(3);
  });

  it('selectSection sets selection for entire section', () => {
    useSelectionStore.getState().selectSection(2, 8);
    const { selection } = useSelectionStore.getState();
    expect(selection!.start.barIndex).toBe(0);
    expect(selection!.end.barIndex).toBe(7);
    expect(selection!.start.sectionIndex).toBe(2);
  });

  it('clearSelection removes selection', () => {
    useSelectionStore.getState().selectBar(0, 0);
    useSelectionStore.getState().clearSelection();
    expect(useSelectionStore.getState().selection).toBeNull();
  });

  it('setSelection can set a range across bars', () => {
    useSelectionStore.getState().setSelection({
      start: { sectionIndex: 0, barIndex: 2 },
      end: { sectionIndex: 0, barIndex: 5 },
    });
    const { selection } = useSelectionStore.getState();
    expect(selection!.start.barIndex).toBe(2);
    expect(selection!.end.barIndex).toBe(5);
  });
});
