/**
 * voicingEngine.ts — Phase 4 Arrangement / Voicing Engine
 *
 * Transforms symbolic ChordEvents into PlaybackNoteEvents.
 * Supports multiple arrangement patterns and voicing density levels.
 * This module is pure (no side-effects) and fully deterministic when
 * humanizeAmount === 0, making it straightforward to unit-test.
 */

import type {
  ArrangementResult,
  Bar,
  ChordEvent,
  PlaybackNoteEvent,
  VoicingDensity,
  VoicingOptions,
} from '../models/types';

// ─── Root note semitone offsets (from C = 0) ─────────────────────────────────

const ROOT_SEMITONES: Record<string, number> = {
  C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3,
  E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8,
  Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11,
};

// ─── Arrangement timing constants ─────────────────────────────────────────────

/** Beat offset between successive notes in a guitar-like strum. */
const STRUM_OFFSET_BEATS = 0.05;

/** Beat offsets for the rhythmic pattern, relative to the chord start beat. */
const RHYTHMIC_PATTERN_OFFSETS = [0, 1, 1.5, 2.5, 3];

// ─── Chord quality → interval sets ───────────────────────────────────────────

function qualityToIntervals(quality: string): number[] {
  const q = quality.trim();
  if (!q || q === 'maj' || q === 'M') return [0, 4, 7];
  // Minor-family — check longer forms first
  if (q === 'm7b5' || q === 'ø7' || q === 'ø') return [0, 3, 6, 10];
  if (q.startsWith('m7') || q.startsWith('min7') || q === '-7') return [0, 3, 7, 10];
  if (q.startsWith('m9') || q.startsWith('min9')) return [0, 3, 7, 10, 14];
  if (q.startsWith('m6') || q.startsWith('min6')) return [0, 3, 7, 9];
  if (q === 'm' || q === 'min' || q === '-') return [0, 3, 7];
  // Diminished / augmented
  if (q === 'dim7' || q === '°7') return [0, 3, 6, 9];
  if (q === 'dim' || q === '°') return [0, 3, 6];
  if (q === 'aug' || q === '+') return [0, 4, 8];
  // Suspended
  if (q === 'sus2') return [0, 2, 7];
  if (q === 'sus4') return [0, 5, 7];
  // Major extensions
  if (q === 'maj7' || q === 'M7' || q === 'Δ7' || q === 'Δ') return [0, 4, 7, 11];
  if (q === 'maj9' || q === 'M9') return [0, 4, 7, 11, 14];
  if (q === 'add9') return [0, 4, 7, 14];
  // Dominant
  if (q === '9') return [0, 4, 7, 10, 14];
  if (q === '7') return [0, 4, 7, 10];
  // Sixth
  if (q === '6') return [0, 4, 7, 9];
  // Default: major triad
  return [0, 4, 7];
}

// ─── Chord symbol parser ──────────────────────────────────────────────────────

export interface ParsedChord {
  root: number;       // semitone 0–11
  intervals: number[]; // semitone offsets from root
}

/**
 * Parse a chord symbol such as "Cmaj7", "F#m7", "Bb9", "G/B" into
 * a root semitone and an interval set.
 */
export function parseChordSymbol(symbol: string): ParsedChord {
  if (!symbol) return { root: 0, intervals: [0, 4, 7] };

  // Extract root (e.g. "C#", "Bb", "A")
  const rootMatch = symbol.match(/^([A-G][#b]?)/);
  if (!rootMatch) return { root: 0, intervals: [0, 4, 7] };

  const rootStr = rootMatch[1];
  const root = ROOT_SEMITONES[rootStr] ?? 0;

  // Strip root and bass note (slash chord)
  let quality = symbol.slice(rootStr.length);
  const slashIdx = quality.indexOf('/');
  if (slashIdx !== -1) quality = quality.slice(0, slashIdx);

  return { root, intervals: qualityToIntervals(quality) };
}

// ─── Voicing builder ─────────────────────────────────────────────────────────

/**
 * Convert a chord symbol to MIDI note numbers.
 * C4 = 60; octaveBase=4 means the root is placed in octave 4.
 */
export function chordSymbolToMidiNotes(
  symbol: string,
  octaveBase: number = 4,
  density: VoicingDensity = 'medium',
  inversionPreference: VoicingOptions['inversionPreference'] = 'root',
): number[] {
  const { root, intervals } = parseChordSymbol(symbol);
  // MIDI: C0 = 12, so C(octaveBase) = 12 * (octaveBase + 1) + root
  const baseMidi = 12 * (octaveBase + 1) + root;

  let notes = intervals.map((i) => baseMidi + i);

  // Apply inversion
  if (inversionPreference === 'first' && notes.length >= 2) {
    notes = [...notes.slice(1), notes[0] + 12];
  } else if (inversionPreference === 'second' && notes.length >= 3) {
    notes = [...notes.slice(2), notes[0] + 12, notes[1] + 12];
  }
  // 'auto' uses root for now (can be extended with voice-leading logic)

  // Trim by density
  if (density === 'simple') return notes.slice(0, 3);
  if (density === 'medium') return notes.slice(0, 4);
  return notes; // rich: all tones
}

// ─── Humanization ────────────────────────────────────────────────────────────

/** Lightweight seeded pseudo-random (deterministic given same inputs). */
function pseudoRandom(seed: number): number {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

/**
 * Apply subtle timing and velocity variation to note events.
 * humanizeAmount=0 → no change; humanizeAmount=1 → maximum variation.
 */
export function humanizeEvents(
  events: PlaybackNoteEvent[],
  amount: number,
  seed: number = 0,
): PlaybackNoteEvent[] {
  if (amount <= 0) return events;
  const maxTimingOffset = 0.06 * amount; // beats
  const maxVelocityOffset = 12 * amount; // MIDI velocity units
  return events.map((ev, i) => ({
    ...ev,
    startBeat: ev.startBeat + (pseudoRandom(seed + i * 2) - 0.5) * 2 * maxTimingOffset,
    velocity: Math.round(
      Math.min(127, Math.max(1, ev.velocity + (pseudoRandom(seed + i * 2 + 1) - 0.5) * 2 * maxVelocityOffset)),
    ),
  }));
}

// ─── Arrangement pattern generators ─────────────────────────────────────────

function applyBlockPattern(
  notes: number[],
  chord: ChordEvent,
): PlaybackNoteEvent[] {
  return notes.map((midiNote) => ({
    midiNote,
    startBeat: chord.beat,
    durationBeats: chord.durationBeats,
    velocity: 80,
  }));
}

function applyArpeggioPattern(
  notes: number[],
  chord: ChordEvent,
): PlaybackNoteEvent[] {
  const noteDuration = chord.durationBeats / notes.length;
  return notes.map((midiNote, i) => ({
    midiNote,
    startBeat: chord.beat + i * noteDuration,
    durationBeats: noteDuration,
    velocity: 65 + Math.round((i / Math.max(notes.length - 1, 1)) * 25),
  }));
}

function applyPadPattern(
  notes: number[],
  chord: ChordEvent,
): PlaybackNoteEvent[] {
  return notes.map((midiNote, i) => ({
    midiNote,
    startBeat: chord.beat,
    durationBeats: chord.durationBeats,
    // Root is louder; upper notes fade
    velocity: Math.max(45, 72 - i * 8),
  }));
}

function applyStrumPattern(
  notes: number[],
  chord: ChordEvent,
): PlaybackNoteEvent[] {
  return notes.map((midiNote, i) => ({
    midiNote,
    startBeat: chord.beat + i * STRUM_OFFSET_BEATS,
    durationBeats: chord.durationBeats - i * STRUM_OFFSET_BEATS,
    velocity: 75 + Math.round(pseudoRandom(midiNote) * 10),
  }));
}

/** Simple two-beat rhythmic pattern that repeats within the chord duration. */
function applyRhythmicPattern(
  notes: number[],
  chord: ChordEvent,
): PlaybackNoteEvent[] {
  const offsets = RHYTHMIC_PATTERN_OFFSETS.filter((o) => o < chord.durationBeats);
  const events: PlaybackNoteEvent[] = [];
  for (const offset of offsets) {
    for (const midiNote of notes) {
      events.push({
        midiNote,
        startBeat: chord.beat + offset,
        durationBeats: 0.5,
        velocity: offset === 0 ? 82 : 68,
      });
    }
  }
  return events;
}

// ─── Main API ─────────────────────────────────────────────────────────────────

/**
 * Generate note events for a single ChordEvent using the given VoicingOptions.
 */
export function generateChordVoicing(
  chord: ChordEvent,
  options: VoicingOptions,
  humanizeSeed: number = 0,
): PlaybackNoteEvent[] {
  const midiNotes = chordSymbolToMidiNotes(
    chord.symbol,
    options.octaveBase,
    options.density,
    options.inversionPreference,
  );

  let events: PlaybackNoteEvent[];
  switch (options.pattern) {
    case 'arpeggio':  events = applyArpeggioPattern(midiNotes, chord);  break;
    case 'pad':       events = applyPadPattern(midiNotes, chord);        break;
    case 'strum':     events = applyStrumPattern(midiNotes, chord);      break;
    case 'rhythmic':  events = applyRhythmicPattern(midiNotes, chord);   break;
    default:          events = applyBlockPattern(midiNotes, chord);       break;
  }

  return humanizeEvents(events, options.humanizeAmount, humanizeSeed);
}

/**
 * Generate an ArrangementResult for an entire Bar.
 * The humanize seed is derived from the bar id for reproducibility
 * across renders of the same bar.
 */
export function generateArrangement(
  bar: Bar,
  options: VoicingOptions,
): ArrangementResult {
  // Simple deterministic seed from bar id
  const seed = bar.id.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const notes: PlaybackNoteEvent[] = bar.chords.flatMap((chord, i) =>
    generateChordVoicing(chord, options, seed + i * 100),
  );
  return {
    barId: bar.id,
    notes,
    pattern: options.pattern,
    density: options.density,
  };
}

// ─── Default voicing options per quality mode ─────────────────────────────────

export const DEFAULT_VOICING_OPTIONS: Record<string, VoicingOptions> = {
  sketch: {
    density: 'simple',
    octaveBase: 4,
    humanizeAmount: 0,
    inversionPreference: 'root',
    pattern: 'block',
  },
  enhanced: {
    density: 'medium',
    octaveBase: 4,
    humanizeAmount: 0.3,
    inversionPreference: 'auto',
    pattern: 'arpeggio',
  },
  pro: {
    density: 'rich',
    octaveBase: 4,
    humanizeAmount: 0.5,
    inversionPreference: 'auto',
    pattern: 'pad',
  },
};
