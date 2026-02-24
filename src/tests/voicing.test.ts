import { describe, it, expect } from 'vitest';
import {
  parseChordSymbol,
  chordSymbolToMidiNotes,
  humanizeEvents,
  generateChordVoicing,
  generateArrangement,
  DEFAULT_VOICING_OPTIONS,
} from '../services/voicingEngine';
import type { ChordEvent, Bar, PlaybackNoteEvent, VoicingOptions } from '../models/types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeChord(symbol: string, beat = 1, duration = 4): ChordEvent {
  return { id: `chord-${symbol}`, beat, durationBeats: duration, symbol };
}

function makeBar(chords: ChordEvent[]): Bar {
  return { id: 'bar-001', index: 0, timeSignature: [4, 4], chords };
}

const DEFAULT_OPTS: VoicingOptions = {
  density: 'medium',
  octaveBase: 4,
  humanizeAmount: 0,
  inversionPreference: 'root',
  pattern: 'block',
};

// ─── parseChordSymbol ─────────────────────────────────────────────────────────

describe('parseChordSymbol', () => {
  it('parses C major triad', () => {
    const { root, intervals } = parseChordSymbol('C');
    expect(root).toBe(0);
    expect(intervals).toEqual([0, 4, 7]);
  });

  it('parses A minor', () => {
    const { root, intervals } = parseChordSymbol('Am');
    expect(root).toBe(9);
    expect(intervals).toEqual([0, 3, 7]);
  });

  it('parses F# minor 7', () => {
    const { root, intervals } = parseChordSymbol('F#m7');
    expect(root).toBe(6);
    expect(intervals).toEqual([0, 3, 7, 10]);
  });

  it('parses G dominant 7', () => {
    const { root, intervals } = parseChordSymbol('G7');
    expect(root).toBe(7);
    expect(intervals).toEqual([0, 4, 7, 10]);
  });

  it('parses Bb major 7', () => {
    const { root, intervals } = parseChordSymbol('Bbmaj7');
    expect(root).toBe(10);
    expect(intervals).toEqual([0, 4, 7, 11]);
  });

  it('parses Eb minor 9', () => {
    const { root, intervals } = parseChordSymbol('Ebm9');
    expect(root).toBe(3);
    expect(intervals).toEqual([0, 3, 7, 10, 14]);
  });

  it('ignores slash bass note', () => {
    const { root, intervals } = parseChordSymbol('C/E');
    expect(root).toBe(0);
    expect(intervals).toEqual([0, 4, 7]);
  });

  it('falls back to major for unknown quality', () => {
    const { intervals } = parseChordSymbol('Xunknown');
    expect(intervals).toEqual([0, 4, 7]);
  });

  it('handles empty string gracefully', () => {
    const { root, intervals } = parseChordSymbol('');
    expect(root).toBe(0);
    expect(intervals).toEqual([0, 4, 7]);
  });

  it('parses dim7', () => {
    const { intervals } = parseChordSymbol('Bdim7');
    expect(intervals).toEqual([0, 3, 6, 9]);
  });

  it('parses aug', () => {
    const { intervals } = parseChordSymbol('Caug');
    expect(intervals).toEqual([0, 4, 8]);
  });

  it('parses sus4', () => {
    const { intervals } = parseChordSymbol('Dsus4');
    expect(intervals).toEqual([0, 5, 7]);
  });
});

// ─── chordSymbolToMidiNotes ───────────────────────────────────────────────────

describe('chordSymbolToMidiNotes', () => {
  it('returns C major triad at octave 4 — [60, 64, 67]', () => {
    expect(chordSymbolToMidiNotes('C', 4, 'medium')).toEqual([60, 64, 67]);
  });

  it('returns A minor triad at octave 4 — [69, 72, 76]', () => {
    expect(chordSymbolToMidiNotes('Am', 4, 'medium')).toEqual([69, 72, 76]);
  });

  it('returns Cmaj7 four-note voicing — [60, 64, 67, 71]', () => {
    expect(chordSymbolToMidiNotes('Cmaj7', 4, 'medium')).toEqual([60, 64, 67, 71]);
  });

  it('simple density returns at most 3 notes', () => {
    const notes = chordSymbolToMidiNotes('Cmaj7', 4, 'simple');
    expect(notes.length).toBeLessThanOrEqual(3);
  });

  it('medium density returns at most 4 notes', () => {
    const notes = chordSymbolToMidiNotes('C9', 4, 'medium');
    expect(notes.length).toBeLessThanOrEqual(4);
  });

  it('rich density returns all chord tones for C9', () => {
    const notes = chordSymbolToMidiNotes('C9', 4, 'rich');
    expect(notes.length).toBe(5);
  });

  it('all notes are valid MIDI range (0–127)', () => {
    const chords = ['C', 'Am', 'F', 'G7', 'Dm7', 'Cmaj9', 'Bb', 'Ebm7'];
    chords.forEach((sym) => {
      chordSymbolToMidiNotes(sym, 4, 'rich').forEach((n) => {
        expect(n).toBeGreaterThanOrEqual(0);
        expect(n).toBeLessThanOrEqual(127);
      });
    });
  });

  it('first inversion shifts root up an octave', () => {
    const root    = chordSymbolToMidiNotes('C', 4, 'medium', 'root');
    const first   = chordSymbolToMidiNotes('C', 4, 'medium', 'first');
    expect(first[first.length - 1]).toBe(root[0] + 12);
    expect(first[0]).toBe(root[1]);
  });

  it('second inversion shifts root and third up an octave', () => {
    const root   = chordSymbolToMidiNotes('C', 4, 'medium', 'root');
    const second = chordSymbolToMidiNotes('C', 4, 'medium', 'second');
    expect(second[0]).toBe(root[2]);
  });

  it('notes are ascending in root position', () => {
    const notes = chordSymbolToMidiNotes('C', 4, 'rich', 'root');
    for (let i = 1; i < notes.length; i++) {
      expect(notes[i]).toBeGreaterThanOrEqual(notes[i - 1]);
    }
  });
});

// ─── humanizeEvents ───────────────────────────────────────────────────────────

describe('humanizeEvents', () => {
  const base: PlaybackNoteEvent[] = [
    { midiNote: 60, startBeat: 1, durationBeats: 4, velocity: 80 },
    { midiNote: 64, startBeat: 1, durationBeats: 4, velocity: 80 },
  ];

  it('returns events unchanged when amount is 0', () => {
    expect(humanizeEvents(base, 0)).toEqual(base);
  });

  it('returns events unchanged when amount is negative', () => {
    expect(humanizeEvents(base, -1)).toEqual(base);
  });

  it('modifies timing and velocity when amount > 0', () => {
    const result = humanizeEvents(base, 1, 42);
    const anyChanged = result.some((ev, i) =>
      ev.startBeat !== base[i].startBeat || ev.velocity !== base[i].velocity,
    );
    expect(anyChanged).toBe(true);
  });

  it('is deterministic for same seed', () => {
    const r1 = humanizeEvents(base, 0.5, 99);
    const r2 = humanizeEvents(base, 0.5, 99);
    expect(r1).toEqual(r2);
  });

  it('produces different output for different seeds', () => {
    const r1 = humanizeEvents(base, 0.5, 1);
    const r2 = humanizeEvents(base, 0.5, 2);
    expect(r1).not.toEqual(r2);
  });

  it('keeps velocity in valid MIDI range after humanization', () => {
    const result = humanizeEvents(base, 1, 7);
    result.forEach((ev) => {
      expect(ev.velocity).toBeGreaterThanOrEqual(1);
      expect(ev.velocity).toBeLessThanOrEqual(127);
    });
  });
});

// ─── generateChordVoicing ─────────────────────────────────────────────────────

describe('generateChordVoicing — block pattern', () => {
  it('block: all notes start at chord beat', () => {
    const chord = makeChord('C', 1, 4);
    const events = generateChordVoicing(chord, { ...DEFAULT_OPTS, pattern: 'block' });
    events.forEach((ev) => expect(ev.startBeat).toBe(1));
  });

  it('block: note count matches medium density (≤4)', () => {
    const events = generateChordVoicing(makeChord('Cmaj7'), { ...DEFAULT_OPTS, pattern: 'block' });
    expect(events.length).toBe(4);
  });

  it('block: returns correct MIDI notes for C major', () => {
    const events = generateChordVoicing(makeChord('C'), { ...DEFAULT_OPTS, pattern: 'block' });
    const midiNotes = events.map((e) => e.midiNote).sort((a, b) => a - b);
    expect(midiNotes).toEqual([60, 64, 67]);
  });
});

describe('generateChordVoicing — arpeggio pattern', () => {
  it('arpeggio: notes have different start beats', () => {
    const chord = makeChord('C', 1, 4);
    const events = generateChordVoicing(chord, { ...DEFAULT_OPTS, pattern: 'arpeggio' });
    const beats = events.map((e) => e.startBeat);
    const unique = new Set(beats);
    expect(unique.size).toBe(events.length);
  });

  it('arpeggio: first note starts at chord beat', () => {
    const chord = makeChord('Am', 2, 4);
    const events = generateChordVoicing(chord, { ...DEFAULT_OPTS, pattern: 'arpeggio' });
    expect(events[0].startBeat).toBe(2);
  });
});

describe('generateChordVoicing — pad pattern', () => {
  it('pad: root has highest velocity', () => {
    const events = generateChordVoicing(makeChord('C'), { ...DEFAULT_OPTS, pattern: 'pad' });
    const maxVel = Math.max(...events.map((e) => e.velocity));
    expect(events[0].velocity).toBe(maxVel);
  });
});

describe('generateChordVoicing — strum pattern', () => {
  it('strum: notes have progressively later start beats', () => {
    const chord = makeChord('G', 1, 4);
    const events = generateChordVoicing(chord, { ...DEFAULT_OPTS, pattern: 'strum' });
    for (let i = 1; i < events.length; i++) {
      expect(events[i].startBeat).toBeGreaterThan(events[i - 1].startBeat);
    }
  });
});

describe('generateChordVoicing — rhythmic pattern', () => {
  it('rhythmic: generates multiple events per chord', () => {
    const chord = makeChord('F', 1, 4);
    const events = generateChordVoicing(chord, { ...DEFAULT_OPTS, pattern: 'rhythmic' });
    // 3 notes × multiple offsets → more than chord count
    expect(events.length).toBeGreaterThan(3);
  });

  it('rhythmic: no event starts before chord beat', () => {
    const chord = makeChord('Am', 2, 4);
    const events = generateChordVoicing(chord, { ...DEFAULT_OPTS, pattern: 'rhythmic' });
    events.forEach((ev) => expect(ev.startBeat).toBeGreaterThanOrEqual(2));
  });
});

// ─── generateArrangement ─────────────────────────────────────────────────────

describe('generateArrangement', () => {
  it('returns ArrangementResult with correct barId', () => {
    const bar = makeBar([makeChord('C')]);
    const result = generateArrangement(bar, DEFAULT_OPTS);
    expect(result.barId).toBe('bar-001');
  });

  it('produces notes for each chord in the bar', () => {
    const bar = makeBar([makeChord('C'), makeChord('Am', 3)]);
    const result = generateArrangement(bar, DEFAULT_OPTS);
    expect(result.notes.length).toBeGreaterThan(0);
  });

  it('returns empty notes for an empty bar', () => {
    const bar = makeBar([]);
    const result = generateArrangement(bar, DEFAULT_OPTS);
    expect(result.notes).toEqual([]);
  });

  it('is deterministic — same bar produces same notes', () => {
    const bar = makeBar([makeChord('G7'), makeChord('C', 3)]);
    const r1 = generateArrangement(bar, DEFAULT_OPTS);
    const r2 = generateArrangement(bar, DEFAULT_OPTS);
    expect(r1).toEqual(r2);
  });

  it('records pattern and density in result', () => {
    const bar = makeBar([makeChord('C')]);
    const opts: VoicingOptions = { ...DEFAULT_OPTS, pattern: 'arpeggio', density: 'rich' };
    const result = generateArrangement(bar, opts);
    expect(result.pattern).toBe('arpeggio');
    expect(result.density).toBe('rich');
  });
});

// ─── DEFAULT_VOICING_OPTIONS ──────────────────────────────────────────────────

describe('DEFAULT_VOICING_OPTIONS', () => {
  it('sketch mode uses simple density and block pattern', () => {
    expect(DEFAULT_VOICING_OPTIONS['sketch'].density).toBe('simple');
    expect(DEFAULT_VOICING_OPTIONS['sketch'].pattern).toBe('block');
    expect(DEFAULT_VOICING_OPTIONS['sketch'].humanizeAmount).toBe(0);
  });

  it('enhanced mode uses medium density and arpeggio pattern', () => {
    expect(DEFAULT_VOICING_OPTIONS['enhanced'].density).toBe('medium');
    expect(DEFAULT_VOICING_OPTIONS['enhanced'].pattern).toBe('arpeggio');
    expect(DEFAULT_VOICING_OPTIONS['enhanced'].humanizeAmount).toBeGreaterThan(0);
  });

  it('pro mode uses rich density and has more humanization than enhanced', () => {
    expect(DEFAULT_VOICING_OPTIONS['pro'].density).toBe('rich');
    expect(DEFAULT_VOICING_OPTIONS['pro'].humanizeAmount).toBeGreaterThan(
      DEFAULT_VOICING_OPTIONS['enhanced'].humanizeAmount,
    );
  });
});
