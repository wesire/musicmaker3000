/**
 * Rule-based harmonic chord-progression generator.
 *
 * Generates musically valid diatonic progressions for each section type,
 * supports all modes defined in the type system, and returns a primary
 * result plus A/B/C alternatives with metadata tags.
 */
import type {
  AlternativeOption,
  Bar,
  GenerateSongResult,
  KeyContext,
  Mode,
  NoteKey,
  PromptConstraints,
  SectionAnalysis,
  SectionType,
  Song,
  SongAlternative,
} from '../models/types';
import { createBar, createChordEvent, createId, createSection, createSong } from '../models/factories';
import { analyzeSection } from './analysisEngine';

// ─── Lookup tables ───────────────────────────────────────────────────────────

const NOTE_SEMITONES: Record<string, number> = {
  C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3,
  E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8,
  Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11,
};

const SHARP_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLAT_NOTES  = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

/** Keys (by root semitone) that conventionally use sharps. */
const SHARP_KEY_ROOTS = new Set([7, 2, 9, 4, 11, 6, 1]); // G D A E B F# C#

const MODE_INTERVALS: Record<Mode, number[]> = {
  major:      [0, 2, 4, 5, 7, 9, 11],
  minor:      [0, 2, 3, 5, 7, 8, 10],
  dorian:     [0, 2, 3, 5, 7, 9, 10],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
  phrygian:   [0, 1, 3, 5, 7, 8, 10],
  lydian:     [0, 2, 4, 6, 7, 9, 11],
  locrian:    [0, 1, 3, 5, 6, 8, 10],
};

/** Expected triad quality per scale degree for major-family modes. */
const MAJOR_TRIAD_QUALITIES = ['maj', 'min', 'min', 'maj', 'maj', 'min', 'dim'] as const;
/** Expected triad quality per scale degree for minor-family modes (harmonic V). */
const MINOR_TRIAD_QUALITIES = ['min', 'dim', 'maj', 'min', 'maj', 'maj', 'dim'] as const;

type TriadQuality = 'maj' | 'min' | 'dim';

// ─── Section chord patterns (degree indices 0–6) ─────────────────────────────
//
// Each entry is [primaryPattern, altBPattern, altCPattern].
// Patterns are repeated/truncated to fill the actual bar count.
// Degree 4 in minor modes is raised to major (harmonic minor V).

type Pattern = number[];

const MAJOR_PATTERNS: Record<SectionType, [Pattern, Pattern, Pattern]> = {
  intro:     [[0, 0, 3, 4], [0, 4, 3, 0], [0, 5, 3, 4]],
  verse:     [[0, 4, 5, 3], [0, 5, 3, 4], [1, 4, 0, 5]],
  prechorus: [[1, 4, 1, 4], [3, 4, 3, 4], [5, 1, 4, 4]],
  chorus:    [[3, 0, 4, 5], [0, 4, 5, 3], [3, 4, 0, 0]],
  bridge:    [[5, 3, 0, 4], [1, 4, 0, 3], [3, 1, 4, 5]],
  outro:     [[0, 3, 0, 4], [0, 0, 3, 0], [5, 3, 4, 0]],
  solo:      [[0, 4, 5, 3], [0, 5, 3, 4], [1, 4, 0, 5]],
  custom:    [[0, 4, 5, 3], [0, 5, 3, 4], [1, 4, 0, 5]],
};

const MINOR_PATTERNS: Record<SectionType, [Pattern, Pattern, Pattern]> = {
  intro:     [[0, 0, 6, 4], [0, 6, 2, 4], [0, 3, 5, 4]],
  verse:     [[0, 6, 2, 6], [0, 3, 5, 6], [0, 5, 2, 4]],
  prechorus: [[3, 4, 3, 4], [5, 6, 3, 4], [1, 4, 1, 4]],
  chorus:    [[5, 2, 0, 4], [0, 3, 5, 4], [5, 6, 2, 4]],
  bridge:    [[3, 5, 0, 4], [0, 5, 6, 4], [2, 5, 4, 0]],
  outro:     [[0, 3, 0, 4], [0, 0, 5, 0], [5, 3, 4, 0]],
  solo:      [[0, 6, 2, 6], [0, 3, 5, 6], [0, 5, 2, 4]],
  custom:    [[0, 6, 2, 6], [0, 3, 5, 6], [0, 5, 2, 4]],
};

const ALTERNATIVE_TAGS: Record<0 | 1 | 2, string[]> = {
  0: ['standard', 'reliable', 'diatonic'],
  1: ['smoother', 'classic-variant', 'voice-leading'],
  2: ['colorful', 'less-predictable', 'tension'],
};
const ALTERNATIVE_LABELS: Record<0 | 1 | 2, 'A' | 'B' | 'C'> = { 0: 'A', 1: 'B', 2: 'C' };

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isMajorFamily(mode: Mode): boolean {
  return mode === 'major' || mode === 'lydian' || mode === 'mixolydian';
}

function getNoteName(semitone: number, keyRoot: NoteKey): string {
  const s = ((semitone % 12) + 12) % 12;
  const useSharps = SHARP_KEY_ROOTS.has(NOTE_SEMITONES[keyRoot] ?? 0);
  return (useSharps ? SHARP_NOTES : FLAT_NOTES)[s];
}

function triadQualityForDegree(degree: number, mode: Mode): TriadQuality {
  const q = isMajorFamily(mode) ? MAJOR_TRIAD_QUALITIES[degree] : MINOR_TRIAD_QUALITIES[degree];
  return q ?? 'maj';
}

function buildChordSymbol(
  degree: number,
  keyContext: KeyContext,
  complexity: PromptConstraints['complexity'],
): string {
  const keySemitone = NOTE_SEMITONES[keyContext.root] ?? 0;
  const intervals   = MODE_INTERVALS[keyContext.mode] ?? MODE_INTERVALS.major;
  const noteSemitone = (keySemitone + (intervals[degree] ?? 0)) % 12;
  const noteName    = getNoteName(noteSemitone, keyContext.root);

  let quality: TriadQuality = triadQualityForDegree(degree, keyContext.mode);

  // Harmonic-minor convention: degree 4 (v) is raised to major in minor-family keys
  if (!isMajorFamily(keyContext.mode) && degree === 4) quality = 'maj';

  switch (complexity) {
    case 'simple':
      if (quality === 'maj') return noteName;
      if (quality === 'min') return `${noteName}m`;
      return `${noteName}dim`;

    case 'moderate':
      if (quality === 'maj') return noteName;
      if (quality === 'min') return `${noteName}m`;
      // Dominant (degree 4 in major) gets a 7
      if (degree === 4 && isMajorFamily(keyContext.mode)) return `${noteName}7`;
      return `${noteName}dim`;

    case 'complex':
      if (quality === 'maj') return `${noteName}maj7`;
      if (quality === 'min') return `${noteName}m7`;
      if (quality === 'dim') return `${noteName}m7b5`;
      return noteName;

    case 'jazzy':
      if (quality === 'maj') {
        return degree === 4 && isMajorFamily(keyContext.mode)
          ? `${noteName}9`
          : `${noteName}maj9`;
      }
      if (quality === 'min') return `${noteName}m9`;
      if (quality === 'dim') return `${noteName}m7b5`;
      return noteName;

    default:
      if (quality === 'maj') return noteName;
      if (quality === 'min') return `${noteName}m`;
      return `${noteName}dim`;
  }
}

/**
 * Build a set of bars by cycling through a degree pattern.
 * One chord per bar, starting on beat 1 for the full bar duration.
 */
function buildBars(
  pattern: Pattern,
  barCount: number,
  keyContext: KeyContext,
  complexity: PromptConstraints['complexity'],
  timeSignature: [number, number] = [4, 4],
): Bar[] {
  return Array.from({ length: barCount }, (_, i) => {
    const degree = pattern[i % pattern.length];
    const symbol = buildChordSymbol(degree, keyContext, complexity);
    const bar = createBar(i, timeSignature);
    bar.chords = [createChordEvent(1, symbol, timeSignature[0])];
    return bar;
  });
}

function getPatterns(mode: Mode, sectionType: SectionType): [Pattern, Pattern, Pattern] {
  return isMajorFamily(mode)
    ? MAJOR_PATTERNS[sectionType] ?? MAJOR_PATTERNS.custom
    : MINOR_PATTERNS[sectionType] ?? MINOR_PATTERNS.custom;
}

// ─── Default song form ────────────────────────────────────────────────────────

interface SectionDef { type: SectionType; label: string; barCount: number }

function chooseSongForm(constraints: PromptConstraints): SectionDef[] {
  const hasEnergetic = constraints.moods.includes('energetic');
  const hasDreamy    = constraints.moods.includes('calm') || constraints.styles.includes('dreamy');
  const hasJazz      = constraints.styles.includes('jazz');
  const hasRock      = constraints.styles.includes('rock');

  if (hasJazz) {
    return [
      { type: 'intro',  label: 'Intro',     barCount: 4 },
      { type: 'verse',  label: 'Verse A',   barCount: 8 },
      { type: 'chorus', label: 'Head Out',  barCount: 4 },
      { type: 'bridge', label: 'Bridge',    barCount: 4 },
      { type: 'outro',  label: 'Outro',     barCount: 4 },
    ];
  }
  if (hasRock) {
    return [
      { type: 'intro',     label: 'Intro',      barCount: 4 },
      { type: 'verse',     label: 'Verse',      barCount: 8 },
      { type: 'prechorus', label: 'Pre-Chorus', barCount: 4 },
      { type: 'chorus',    label: 'Chorus',     barCount: 8 },
      { type: 'bridge',    label: 'Bridge',     barCount: 4 },
      { type: 'outro',     label: 'Outro',      barCount: 4 },
    ];
  }
  if (hasDreamy) {
    return [
      { type: 'intro',  label: 'Intro',   barCount: 8 },
      { type: 'verse',  label: 'Verse',   barCount: 8 },
      { type: 'chorus', label: 'Chorus',  barCount: 8 },
      { type: 'outro',  label: 'Outro',   barCount: 8 },
    ];
  }
  if (hasEnergetic) {
    return [
      { type: 'intro',     label: 'Intro',      barCount: 4 },
      { type: 'verse',     label: 'Verse',      barCount: 8 },
      { type: 'prechorus', label: 'Pre-Chorus', barCount: 4 },
      { type: 'chorus',    label: 'Chorus',     barCount: 8 },
      { type: 'bridge',    label: 'Bridge',     barCount: 4 },
      { type: 'chorus',    label: 'Chorus 2',   barCount: 8 },
      { type: 'outro',     label: 'Outro',      barCount: 4 },
    ];
  }
  // Default pop form
  return [
    { type: 'intro',     label: 'Intro',      barCount: 4 },
    { type: 'verse',     label: 'Verse',      barCount: 8 },
    { type: 'prechorus', label: 'Pre-Chorus', barCount: 4 },
    { type: 'chorus',    label: 'Chorus',     barCount: 8 },
    { type: 'verse',     label: 'Verse 2',    barCount: 8 },
    { type: 'chorus',    label: 'Chorus 2',   barCount: 8 },
    { type: 'bridge',    label: 'Bridge',     barCount: 4 },
    { type: 'chorus',    label: 'Final Chorus', barCount: 8 },
    { type: 'outro',     label: 'Outro',      barCount: 4 },
  ];
}

function chooseKey(constraints: PromptConstraints): KeyContext {
  const isMinor = constraints.brightness < -0.1 || constraints.moods.includes('dark') || constraints.moods.includes('sad');

  let root: NoteKey = 'C';
  if (constraints.styles.includes('jazz'))    root = 'F';
  else if (constraints.styles.includes('folk'))   root = 'G';
  else if (constraints.styles.includes('rock'))   root = 'E';
  else if (constraints.styles.includes('blues'))  root = 'A';
  else if (constraints.styles.includes('country')) root = 'G';

  let mode: Mode = isMinor ? 'minor' : 'major';
  if (constraints.styles.includes('jazz') && !isMinor) mode = 'major';
  if (constraints.styles.includes('dreamy') && !isMinor) mode = 'lydian';
  if (constraints.styles.includes('funk') && !isMinor) mode = 'mixolydian';

  return { root, mode };
}

function chooseTempo(constraints: PromptConstraints): number {
  if (constraints.moods.includes('calm') || constraints.styles.includes('dreamy')) return 72;
  if (constraints.moods.includes('energetic') || constraints.styles.includes('rock')) return 140;
  if (constraints.styles.includes('jazz')) return 120;
  if (constraints.styles.includes('folk')) return 100;
  return 120;
}

function generateTitle(constraints: PromptConstraints): string {
  const style = constraints.styles[0] ?? 'song';
  const mood  = constraints.moods[0]  ?? 'melody';
  return `Generated ${style} (${mood})`;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Generate bars for a single section using the pattern at the given variant index
 * (0 = primary/A, 1 = B, 2 = C).
 */
export function generateSectionBars(
  sectionType: SectionType,
  barCount: number,
  keyContext: KeyContext,
  constraints: PromptConstraints,
  variantIndex: 0 | 1 | 2 = 0,
): Bar[] {
  const [pA, pB, pC] = getPatterns(keyContext.mode, sectionType);
  const pattern = [pA, pB, pC][variantIndex] ?? pA;
  return buildBars(pattern, barCount, keyContext, constraints.complexity);
}

/**
 * Generate A/B/C alternative bar sets for a section.
 * Used by the rewrite engine for EDIT_LOCAL responses.
 */
export function generateSectionAlternatives(
  sectionType: SectionType,
  barCount: number,
  keyContext: KeyContext,
  constraints: PromptConstraints,
  sectionId: string,
): AlternativeOption[] {
  return ([0, 1, 2] as const).map((v) => {
    const bars     = generateSectionBars(sectionType, barCount, keyContext, constraints, v);
    const analysis = analyzeSection(bars, keyContext, sectionId);
    return {
      id:           createId(),
      label:        ALTERNATIVE_LABELS[v],
      bars,
      metadataTags: ALTERNATIVE_TAGS[v],
      analysis,
    };
  });
}

/**
 * Generate a full song from a text prompt (via parsed constraints).
 * Returns:
 * - `song`         – primary generated Song (variant A patterns)
 * - `alternatives` – B and C full-song variants
 * - `sectionAnalyses` – harmonic analysis for the primary song
 * - `constraints`  – the parsed constraints used
 */
export function generateSong(constraints: PromptConstraints, existingTitle?: string): GenerateSongResult {
  const keyContext = chooseKey(constraints);
  const tempo      = chooseTempo(constraints);
  const title      = existingTitle ?? generateTitle(constraints);
  const form       = chooseSongForm(constraints);

  function buildSong(variantIndex: 0 | 1 | 2): Song {
    const sections = form.map((def, i) => {
      const bars = generateSectionBars(def.type, def.barCount, keyContext, constraints, variantIndex);
      const sec  = createSection(i, def.type, def.label, 0);
      sec.bars   = bars;
      return sec;
    });
    return createSong(title, keyContext, tempo, sections);
  }

  const primarySong = buildSong(0);

  const sectionAnalyses: SectionAnalysis[] = primarySong.sections.map((sec) =>
    analyzeSection(sec.bars, keyContext, sec.id),
  );

  const alternatives: SongAlternative[] = ([1, 2] as const).map((v) => ({
    id:           createId(),
    label:        ALTERNATIVE_LABELS[v],
    song:         buildSong(v),
    metadataTags: ALTERNATIVE_TAGS[v],
  }));

  return { song: primarySong, alternatives, sectionAnalyses, constraints };
}
