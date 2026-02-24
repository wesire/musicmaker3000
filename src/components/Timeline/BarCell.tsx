import { useState } from 'react';
import type { Bar, ChordEvent, KeyContext } from '../../models/types';
import { useSelectionStore } from '../../store/selectionStore';
import { useProjectStore } from '../../store/projectStore';
import { useOverlayStore } from '../../store/overlayStore';
import { analyzeChord } from '../../services/analysisEngine';
import ChordEditor from './ChordEditor';

interface Props {
  bar: Bar;
  sectionIndex: number;
  barIndex: number;
  keyContext: KeyContext;
  cadenceLabel?: string;
}

// Convert a Roman numeral to a Nashville number (scale degree)
function romanToNashville(rn: string): string {
  const base = rn.split('/')[0].replace(/[°+]/g, '').toUpperCase();
  const map: Record<string, string> = {
    'I': '1', 'II': '2', 'III': '3', 'IV': '4', 'V': '5', 'VI': '6', 'VII': '7',
  };
  const num = map[base];
  if (!num) return rn;
  // Lowercase Roman numeral first character indicates minor quality
  const isMinor = /^[a-z]/.test(rn[0]);
  if (rn.includes('/')) {
    const target = rn.split('/')[1].replace(/[°+]/g, '').toUpperCase();
    const targetNum = map[target] ?? target;
    return `5/${targetNum}`;
  }
  return isMinor ? `${num}m` : num;
}

export default function BarCell({ bar, sectionIndex, barIndex, keyContext, cadenceLabel }: Props) {
  const { selection, selectBar, setSelection } = useSelectionStore();
  const { updateChord } = useProjectStore();
  const { settings } = useOverlayStore();
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
  }

  function handleCancel() {
    setEditing(false);
  }

  const chordDisplay = bar.chords.map((c) => c.symbol).join(', ');

  // Compute annotations for each chord (only when an overlay needs them)
  const needsAnalysis = settings.showRomanNumerals || settings.showFunctionTags || settings.showNashvilleNumbers;
  const analyses = needsAnalysis ? bar.chords.map((c) => analyzeChord(c, keyContext)) : [];

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
        <>
          {settings.showChordSymbols && (
            <div className="chord-symbols">
              {chordDisplay || <span className="chord-empty">—</span>}
            </div>
          )}
          {needsAnalysis && analyses.length > 0 && (
            <div className="bar-overlays">
              {analyses.map((a, i) => (
                <span key={i} className="bar-overlay-chip">
                  {settings.showRomanNumerals && (
                    <span className={`overlay-rn${a.uncertain ? ' uncertain' : ''}`}>{a.romanNumeral}</span>
                  )}
                  {settings.showNashvilleNumbers && (
                    <span className="overlay-nashville">{romanToNashville(a.romanNumeral)}</span>
                  )}
                  {settings.showFunctionTags && (
                    <span className={`overlay-fn fn-${a.harmonicFunction}`}>{a.harmonicFunction[0].toUpperCase()}</span>
                  )}
                </span>
              ))}
            </div>
          )}
          {cadenceLabel && settings.showCadenceMarkers && (
            <div className="bar-cadence-label">{cadenceLabel}</div>
          )}
        </>
      )}
    </div>
  );
}
