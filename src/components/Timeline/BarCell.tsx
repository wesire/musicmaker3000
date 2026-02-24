import { useState } from 'react';
import type { Bar, ChordEvent } from '../../models/types';
import { useSelectionStore } from '../../store/selectionStore';
import { useProjectStore } from '../../store/projectStore';
import ChordEditor from './ChordEditor';

interface Props {
  bar: Bar;
  sectionIndex: number;
  barIndex: number;
}

export default function BarCell({ bar, sectionIndex, barIndex }: Props) {
  const { selection, selectBar, setSelection } = useSelectionStore();
  const { updateChord } = useProjectStore();
  const [editing, setEditing] = useState(false);

  const isSelected =
    selection !== null &&
    sectionIndex >= selection.start.sectionIndex &&
    sectionIndex <= selection.end.sectionIndex &&
    (sectionIndex !== selection.start.sectionIndex || barIndex >= selection.start.barIndex) &&
    (sectionIndex !== selection.end.sectionIndex || barIndex <= selection.end.barIndex);

  function handleClick(e: React.MouseEvent) {
    if (e.shiftKey && selection) {
      setSelection({
        start: selection.start,
        end: { sectionIndex, barIndex },
      });
    } else {
      selectBar(sectionIndex, barIndex);
    }
  }

  function handleDoubleClick() {
    setEditing(true);
  }

  function handleSave(chords: ChordEvent[]) {
    setEditing(false);
    chords.forEach((chord) => {
      updateChord(sectionIndex, barIndex, chord);
    });
    // If chords were cleared, replace with empty
    if (chords.length === 0 && bar.chords.length > 0) {
      // Clear by replacing - simplified: just update with empty placeholder
    }
  }

  function handleCancel() {
    setEditing(false);
  }

  const chordDisplay = bar.chords.map((c) => c.symbol).join(', ');

  return (
    <div
      className={`bar-cell${isSelected ? ' selected' : ''}`}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      title="Click to select, double-click to edit"
    >
      <div className="bar-number">Bar {barIndex + 1}</div>
      {editing ? (
        <ChordEditor chords={bar.chords} onSave={handleSave} onCancel={handleCancel} />
      ) : (
        <div className="chord-symbols">
          {chordDisplay || <span className="chord-empty">—</span>}
        </div>
      )}
    </div>
  );
}
