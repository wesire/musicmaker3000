import { useRef, useEffect, useState } from 'react';
import type { ChordEvent } from '../../models/types';
import { createChordEvent } from '../../models/factories';

interface Props {
  chords: ChordEvent[];
  onSave: (chords: ChordEvent[]) => void;
  onCancel: () => void;
}

export default function ChordEditor({ chords, onSave, onCancel }: Props) {
  const [value, setValue] = useState(chords.map((c) => c.symbol).join(', '));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      commit();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  }

  function commit() {
    const symbols = value
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const newChords = symbols.map((sym, i) => createChordEvent(i + 1, sym));
    onSave(newChords);
  }

  return (
    <input
      ref={inputRef}
      className="chord-editor-input"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={commit}
    />
  );
}
