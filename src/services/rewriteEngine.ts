/**
 * Selection-aware local bar rewrite engine.
 *
 * Given a song, a selection range, and edit constraints (including editIntent),
 * regenerates only the bars within the selection while leaving all other bars
 * untouched.  Returns three A/B/C alternatives plus a diff of what changed.
 */
import type {
  AlternativeOption,
  Bar,
  BarDiff,
  EditIntent,
  EditLocalResult,
  KeyContext,
  Mode,
  NoteKey,
  PromptConstraints,
  Section,
  SelectionRange,
  SectionType,
  Song,
} from '../models/types';
import { createBar, createChordEvent, createId } from '../models/factories';
import { analyzeSection } from './analysisEngine';
import { generateSectionBars } from './harmonyGenerator';

// ─── Intent-adjusted pattern overrides ───────────────────────────────────────
//
// For each EditIntent we define degree-index patterns that satisfy the intent.
// These apply to ANY section type (we pick a suitable 4-chord pattern).

const NOTE_SEMITONES: Record<string, number> = {
  C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3,
  E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8,
  Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11,
};
const SHARP_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLAT_NOTES  = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
const SHARP_KEY_ROOTS = new Set([7, 2, 9, 4, 11, 6, 1]);

const MODE_INTERVALS: Record<Mode, number[]> = {
  major:      [0, 2, 4, 5, 7, 9, 11],
  minor:      [0, 2, 3, 5, 7, 8, 10],
  dorian:     [0, 2, 3, 5, 7, 9, 10],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
  phrygian:   [0, 1, 3, 5, 7, 8, 10],
  lydian:     [0, 2, 4, 6, 7, 9, 11],
  locrian:    [0, 1, 3, 5, 6, 8, 10],
};

const MAJOR_TRIAD_Q = ['maj', 'min', 'min', 'maj', 'maj', 'min', 'dim'] as const;
const MINOR_TRIAD_Q = ['min', 'dim', 'maj', 'min', 'maj', 'maj', 'dim'] as const;

type TriadQ = 'maj' | 'min' | 'dim';

function isMajorFamily(mode: Mode): boolean {
  return mode === 'major' || mode === 'lydian' || mode === 'mixolydian';
}

function getNoteName(semitone: number, keyRoot: NoteKey): string {
  const s = ((semitone % 12) + 12) % 12;
  const useSharps = SHARP_KEY_ROOTS.has(NOTE_SEMITONES[keyRoot] ?? 0);
  return (useSharps ? SHARP_NOTES : FLAT_NOTES)[s];
}

function triadQ(degree: number, mode: Mode): TriadQ {
  const q = isMajorFamily(mode) ? MAJOR_TRIAD_Q[degree] : MINOR_TRIAD_Q[degree];
  return q ?? 'maj';
}

function buildSymbol(
  degree: number,
  keyContext: KeyContext,
  complexity: PromptConstraints['complexity'],
): string {
  const keySemitone  = NOTE_SEMITONES[keyContext.root] ?? 0;
  const intervals    = MODE_INTERVALS[keyContext.mode] ?? MODE_INTERVALS.major;
  const noteSemitone = (keySemitone + (intervals[degree] ?? 0)) % 12;
  const noteName     = getNoteName(noteSemitone, keyContext.root);
  let quality: TriadQ = triadQ(degree, keyContext.mode);

  // Harmonic-minor: raise v → V
  if (!isMajorFamily(keyContext.mode) && degree === 4) quality = 'maj';

  switch (complexity) {
    case 'simple':
      return quality === 'maj' ? noteName : quality === 'min' ? `${noteName}m` : `${noteName}dim`;
    case 'moderate':
      if (quality === 'maj') return degree === 4 && isMajorFamily(keyContext.mode) ? `${noteName}7` : noteName;
      return quality === 'min' ? `${noteName}m` : `${noteName}dim`;
    case 'complex':
      if (quality === 'maj') return `${noteName}maj7`;
      if (quality === 'min') return `${noteName}m7`;
      return `${noteName}m7b5`;
    case 'jazzy':
      if (quality === 'maj') return degree === 4 && isMajorFamily(keyContext.mode) ? `${noteName}9` : `${noteName}maj9`;
      if (quality === 'min') return `${noteName}m9`;
      return `${noteName}m7b5`;
    default:
      return quality === 'maj' ? noteName : quality === 'min' ? `${noteName}m` : `${noteName}dim`;
  }
}

// ─── Intent pattern tables ───────────────────────────────────────────────────
//
// Each intent maps to three alternatives (A, B, C) each expressed as a
// 4-element degree-index pattern.  Patterns are cycled to fill barCount.

type IntentPatterns = [number[], number[], number[]];

function getIntentPatterns(intent: EditIntent | undefined, mode: Mode): IntentPatterns {
  const maj = isMajorFamily(mode);

  switch (intent) {
    case 'add_tension':
      // Dominant emphasis, secondary dominants (use V degree heavily)
      return maj
        ? [[1, 4, 1, 4], [4, 4, 0, 4], [1, 1, 4, 4]]
        : [[3, 4, 3, 4], [4, 4, 0, 4], [1, 4, 3, 4]];

    case 'simplify':
      // I IV V only
      return maj
        ? [[0, 3, 4, 0], [0, 4, 3, 0], [0, 0, 3, 4]]
        : [[0, 3, 4, 0], [0, 4, 3, 0], [0, 0, 3, 4]];

    case 'brighten':
      // Emphasise tonic and IV, avoid minor-function chords
      return maj
        ? [[0, 3, 0, 4], [0, 0, 3, 4], [3, 0, 4, 0]]
        : [[2, 5, 2, 4], [5, 2, 6, 4], [2, 6, 5, 4]]; // borrow major chords

    case 'darken':
      // Submediant / minor-function heavy
      return maj
        ? [[5, 3, 1, 4], [5, 5, 3, 4], [1, 5, 3, 4]]
        : [[0, 3, 5, 4], [0, 0, 3, 4], [3, 5, 0, 4]];

    case 'more_colorful':
      // ii chords, extended cadences
      return maj
        ? [[1, 4, 0, 5], [3, 1, 4, 5], [5, 1, 4, 0]]
        : [[1, 4, 0, 5], [3, 1, 4, 5], [5, 1, 4, 0]];

    case 'smoother_voice_leading':
      // Stepwise-root-motion patterns
      return maj
        ? [[0, 1, 2, 3], [3, 4, 5, 0], [5, 4, 3, 0]]
        : [[0, 1, 2, 3], [3, 4, 5, 0], [5, 4, 3, 0]];

    case 'stronger_lift':
      // End strong on dominant to create lift into next section
      return maj
        ? [[0, 3, 1, 4], [3, 0, 1, 4], [5, 1, 1, 4]]
        : [[0, 3, 1, 4], [3, 5, 1, 4], [5, 3, 1, 4]];

    case 'less_predictable':
      // Deceptive / unexpected moves
      return maj
        ? [[0, 4, 5, 3], [5, 3, 4, 0], [1, 5, 4, 2]]
        : [[0, 6, 5, 4], [5, 2, 0, 4], [2, 5, 6, 4]];

    default:
      // Fallback: use the section-level generation (handled outside)
      return maj
        ? [[0, 4, 5, 3], [0, 5, 3, 4], [1, 4, 0, 5]]
        : [[0, 6, 2, 6], [0, 3, 5, 6], [0, 5, 2, 4]];
  }
}

const INTENT_METADATA: Record<EditIntent, [string[], string[], string[]]> = {
  add_tension:            [['more tension', 'dominant-heavy'],  ['V-chord build',    'urgent'],         ['pre-dominant push', 'extended tension']],
  simplify:               [['simplified', 'I-IV-V only'],       ['stripped back',    'clean'],          ['minimal', 'easy to follow']],
  brighten:               [['brighter', 'major emphasis'],      ['lifted',           'open'],           ['tonic-rich', 'sunny']],
  darken:                 [['darker', 'minor emphasis'],        ['submediant-heavy', 'brooding'],       ['modal darker', 'moody']],
  more_colorful:          [['colorful', 'ii chords added'],     ['chromatic color',  'interesting'],    ['extended harmony', 'lush']],
  smoother_voice_leading: [['smooth', 'stepwise roots'],        ['common-tone move', 'connected'],      ['linear bass', 'flowing']],
  stronger_lift:          [['strong lift', 'V arrival'],        ['dominant build',   'momentum'],       ['pre-chorus push', 'energised']],
  less_predictable:       [['unexpected', 'deceptive cadence'], ['surprising move',  'non-cliché'],     ['twist', 'off-piste harmony']],
};

const DEFAULT_METADATA: [string[], string[], string[]] = [
  ['standard', 'reliable'],
  ['smooth variant'],
  ['colorful variant'],
];

// ─── Core rewrite logic ───────────────────────────────────────────────────────

function barsForRange(song: Song, selection: SelectionRange): Bar[] {
  const result: Bar[] = [];
  for (
    let si = selection.start.sectionIndex;
    si <= selection.end.sectionIndex;
    si++
  ) {
    const section = song.sections[si];
    if (!section) continue;
    const startBar = si === selection.start.sectionIndex ? selection.start.barIndex : 0;
    const endBar   = si === selection.end.sectionIndex   ? selection.end.barIndex   : section.bars.length - 1;
    for (let bi = startBar; bi <= endBar; bi++) {
      if (section.bars[bi]) result.push(section.bars[bi]);
    }
  }
  return result;
}

function computeDiff(
  song: Song,
  selection: SelectionRange,
  replacementBars: Bar[],
): BarDiff[] {
  const diffs: BarDiff[] = [];
  let replacementIdx = 0;

  for (
    let si = selection.start.sectionIndex;
    si <= selection.end.sectionIndex;
    si++
  ) {
    const section = song.sections[si];
    if (!section) continue;
    const startBar = si === selection.start.sectionIndex ? selection.start.barIndex : 0;
    const endBar   = si === selection.end.sectionIndex   ? selection.end.barIndex   : section.bars.length - 1;

    for (let bi = startBar; bi <= endBar; bi++) {
      const before = section.bars[bi]?.chords ?? [];
      const after  = replacementBars[replacementIdx]?.chords ?? [];
      replacementIdx++;

      const changed =
        before.length !== after.length ||
        before.some((c, i) => c.symbol !== after[i]?.symbol);

      if (changed) {
        diffs.push({ sectionIndex: si, barIndex: bi, before, after });
      }
    }
  }
  return diffs;
}

/** Determine the predominant section type in the selection. */
function selectionSectionType(song: Song, selection: SelectionRange): SectionType {
  const section = song.sections[selection.start.sectionIndex];
  return section?.type ?? 'custom';
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Rewrite the bars within `selection` according to `constraints` (especially
 * `editIntent`) and return three A/B/C alternatives plus a diff.
 *
 * Bars outside the selection are untouched.
 */
export function rewriteSelection(
  song: Song,
  selection: SelectionRange,
  constraints: PromptConstraints,
): EditLocalResult {
  const keyContext   = song.sections[selection.start.sectionIndex]?.keyContext ?? song.keyContext;
  const sectionType  = selectionSectionType(song, selection);
  const originalBars = barsForRange(song, selection);
  const barCount     = originalBars.length;
  const timeSignature = song.sections[selection.start.sectionIndex]?.bars[0]?.timeSignature ?? [4, 4];

  let alternatives: AlternativeOption[];

  if (constraints.editIntent) {
    // Intent-driven patterns
    const [pA, pB, pC] = getIntentPatterns(constraints.editIntent, keyContext.mode);
    const metaTags     = INTENT_METADATA[constraints.editIntent] ?? DEFAULT_METADATA;

    alternatives = ([pA, pB, pC] as [number[], number[], number[]]).map((pattern, v) => {
      const bars = Array.from({ length: barCount }, (_, i) => {
        const degree = pattern[i % pattern.length];
        const symbol = buildSymbol(degree, keyContext, constraints.complexity);
        const bar    = createBar(i, timeSignature);
        bar.chords   = [createChordEvent(1, symbol, timeSignature[0])];
        return bar;
      });
      const analysis = analyzeSection(bars, keyContext, createId());
      const label    = (['A', 'B', 'C'] as const)[v];
      return {
        id:           createId(),
        label,
        bars,
        metadataTags: metaTags[v] ?? [],
        analysis,
      };
    });
  } else {
    // No specific intent — use section-level generation A/B/C
    alternatives = ([0, 1, 2] as const).map((v) => {
      const bars     = generateSectionBars(sectionType, barCount, keyContext, constraints, v);
      const analysis = analyzeSection(bars, keyContext, createId());
      const label    = (['A', 'B', 'C'] as const)[v];
      return {
        id:           createId(),
        label,
        bars,
        metadataTags: DEFAULT_METADATA[v] ?? [],
        analysis,
      };
    });
  }

  // Diff is computed against the primary (A) alternative
  const diff = computeDiff(song, selection, alternatives[0]?.bars ?? []);

  return {
    alternatives,
    changedRange: selection,
    diff,
    constraints,
  };
}

/**
 * Apply one of the alternatives returned by `rewriteSelection` to a song,
 * returning a new Song with the selected bars replaced.
 * Bars outside the selection are preserved exactly.
 */
export function applyAlternativeToBars(
  song: Song,
  selection: SelectionRange,
  replacementBars: Bar[],
): Song {
  let replacementIdx = 0;

  const newSections: Section[] = song.sections.map((section, si) => {
    const withinSelection =
      si >= selection.start.sectionIndex && si <= selection.end.sectionIndex;
    if (!withinSelection) return section;

    const startBar = si === selection.start.sectionIndex ? selection.start.barIndex : 0;
    const endBar   = si === selection.end.sectionIndex   ? selection.end.barIndex   : section.bars.length - 1;

    const newBars: Bar[] = section.bars.map((bar, bi) => {
      if (bi >= startBar && bi <= endBar) {
        const replacement = replacementBars[replacementIdx];
        replacementIdx++;
        if (replacement) {
          // Preserve original bar id/index; only replace chords
          return { ...bar, chords: replacement.chords };
        }
      }
      return bar;
    });

    return { ...section, bars: newBars };
  });

  return { ...song, sections: newSections };
}
