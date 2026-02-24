import type {
  Bar,
  CadenceType,
  ChordAnalysis,
  ChordEvent,
  HarmonicFunction,
  KeyContext,
  Mode,
  SectionAnalysis,
} from '../models/types';

// ─── Note / interval tables ──────────────────────────────────────────────────

const NOTE_SEMITONES: Record<string, number> = {
  C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3,
  E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8,
  Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11,
};

const MODE_INTERVALS: Record<Mode, number[]> = {
  major:      [0, 2, 4, 5, 7, 9, 11],
  minor:      [0, 2, 3, 5, 7, 8, 10],
  dorian:     [0, 2, 3, 5, 7, 9, 10],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
  phrygian:   [0, 1, 3, 5, 7, 8, 10],
  lydian:     [0, 2, 4, 6, 7, 9, 11],
  locrian:    [0, 1, 3, 5, 6, 8, 10],
};

const ROMAN_NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];

/** Expected triad quality per scale degree for major key */
const MAJOR_QUALITIES = ['maj', 'min', 'min', 'maj', 'maj', 'min', 'dim'] as const;
/** Expected triad quality per scale degree for harmonic-minor (V raised) */
const MINOR_QUALITIES = ['min', 'dim', 'maj', 'min', 'maj', 'maj', 'dim'] as const;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Parse a chord symbol into its root note, root semitone, and quality tag. */
function parseChordSymbol(symbol: string): { root: string; semitone: number; quality: string } {
  // Try 2-char root first (e.g. C#, Db, F#)
  let root = symbol.slice(0, 2);
  if (!(root in NOTE_SEMITONES)) root = symbol.slice(0, 1);

  const semitone = NOTE_SEMITONES[root] ?? 0;
  const rest = symbol.slice(root.length); // quality + extension

  let quality = 'maj';

  if (rest.startsWith('m') && !rest.startsWith('maj')) {
    quality = rest.includes('7') ? 'min7' : 'min';
  } else if (rest.includes('dim') || rest.includes('°')) {
    quality = rest.includes('7') ? 'dim7' : 'dim';
  } else if (rest.includes('aug') || rest.includes('+')) {
    quality = 'aug';
  } else if (rest.includes('maj7') || rest.includes('M7') || rest.includes('Δ')) {
    quality = 'maj7';
  } else if (rest.includes('7')) {
    quality = 'dom7';
  } else if (rest.includes('9')) {
    quality = 'dom9';
  } else if (rest.includes('sus')) {
    quality = 'sus';
  }

  return { root, semitone, quality };
}

/** Reduce a detailed quality tag to a base triad quality for comparison. */
function baseQuality(quality: string): 'maj' | 'min' | 'dim' | 'aug' | 'sus' {
  if (quality.startsWith('min')) return 'min';
  if (quality.startsWith('dim')) return 'dim';
  if (quality === 'aug')         return 'aug';
  if (quality === 'sus')         return 'sus';
  return 'maj';
}

function getFunctionForDegree(degree: number, mode: Mode): HarmonicFunction {
  // Major-family: tonic=0,2,5 ; predominant=1,3 ; dominant=4,6
  if (mode === 'major' || mode === 'lydian' || mode === 'mixolydian') {
    if (degree === 0 || degree === 2 || degree === 5) return 'tonic';
    if (degree === 1 || degree === 3)                 return 'predominant';
    if (degree === 4 || degree === 6)                 return 'dominant';
  } else {
    // Minor-family: tonic=0,2,5 ; predominant=3,1 ; dominant=4,6
    if (degree === 0 || degree === 2 || degree === 5) return 'tonic';
    if (degree === 3 || degree === 1)                 return 'predominant';
    if (degree === 4 || degree === 6)                 return 'dominant';
  }
  return 'ambiguous';
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Analyse a single chord event relative to a key context.
 * Returns a ChordAnalysis with Roman numeral, function, borrowed/secondary tags,
 * and a confidence score.
 */
export function analyzeChord(chord: ChordEvent, keyContext: KeyContext): ChordAnalysis {
  const { semitone: chordSemitone, quality } = parseChordSymbol(chord.symbol);
  const keySemitone = NOTE_SEMITONES[keyContext.root] ?? 0;
  const intervals = MODE_INTERVALS[keyContext.mode] ?? MODE_INTERVALS.major;

  const relSemitone = ((chordSemitone - keySemitone) + 12) % 12;
  const degreeIndex = intervals.indexOf(relSemitone);

  let romanNumeral: string;
  let harmonicFunction: HarmonicFunction;
  let isBorrowed = false;
  let borrowedFrom: string | undefined;
  let isSecondaryDominant = false;
  let secondaryTarget: string | undefined;
  let confidence = 1.0;
  let uncertain = false;

  const bq = baseQuality(quality);

  if (degreeIndex >= 0) {
    // ── Diatonic chord ──────────────────────────────────────────────────────
    const numeral = ROMAN_NUMERALS[degreeIndex];
    const expectedQ =
      (keyContext.mode === 'major' || keyContext.mode === 'lydian' || keyContext.mode === 'mixolydian')
        ? MAJOR_QUALITIES[degreeIndex]
        : MINOR_QUALITIES[degreeIndex];

    romanNumeral = (bq === 'min' || bq === 'dim') ? numeral.toLowerCase() : numeral;
    if (bq === 'dim') romanNumeral += '°';
    if (bq === 'aug') romanNumeral += '+';

    // Quality mismatch — check secondary dominant BEFORE borrowing
    if (bq !== expectedQ && bq !== 'sus') {
      const fifthBelow = ((chordSemitone - 7) + 12) % 12;
      const targetDeg  = intervals.indexOf(fifthBelow);
      if ((bq === 'maj' || quality === 'dom7' || quality === 'dom9') && targetDeg >= 0 && targetDeg !== 6) {
        // Secondary dominant (e.g. D major in C major = V/V)
        isSecondaryDominant = true;
        const tNumeral = ROMAN_NUMERALS[targetDeg];
        const tQ =
          (keyContext.mode === 'major' || keyContext.mode === 'lydian' || keyContext.mode === 'mixolydian')
            ? MAJOR_QUALITIES[targetDeg]
            : MINOR_QUALITIES[targetDeg];
        const tRoman = tQ === 'min' || tQ === 'dim' ? tNumeral.toLowerCase() : tNumeral;
        secondaryTarget  = tRoman;
        romanNumeral     = `V/${tRoman}`;
        harmonicFunction = 'dominant';
        confidence = 0.85;
      } else {
        // Borrowed quality
        isBorrowed = true;
        borrowedFrom =
          keyContext.mode === 'minor' || keyContext.mode === 'dorian' || keyContext.mode === 'phrygian'
            ? 'parallel major'
            : 'parallel minor';
        romanNumeral = bq === 'min' || bq === 'dim' ? numeral.toLowerCase() : numeral;
        if (bq === 'dim') romanNumeral += '°';
        confidence = 0.8;
        harmonicFunction = getFunctionForDegree(degreeIndex, keyContext.mode);
      }
    } else {
      harmonicFunction = getFunctionForDegree(degreeIndex, keyContext.mode);
    }
  } else {
    // ── Non-diatonic chord ──────────────────────────────────────────────────

    // Check for secondary dominant: major/dom7 whose root is ↑P5 above a scale degree
    const fifthBelow = ((chordSemitone - 7) + 12) % 12;
    const targetDeg  = intervals.indexOf(fifthBelow);

    if ((bq === 'maj' || quality === 'dom7' || quality === 'dom9') && targetDeg >= 0 && targetDeg !== 6) {
      isSecondaryDominant = true;
      const tNumeral = ROMAN_NUMERALS[targetDeg];
      const tQ =
        (keyContext.mode === 'major' || keyContext.mode === 'lydian' || keyContext.mode === 'mixolydian')
          ? MAJOR_QUALITIES[targetDeg]
          : MINOR_QUALITIES[targetDeg];
      const tRoman = tQ === 'min' || tQ === 'dim' ? tNumeral.toLowerCase() : tNumeral;
      secondaryTarget  = tRoman;
      romanNumeral     = `V/${tRoman}`;
      harmonicFunction = 'dominant';
      confidence = 0.85;
    } else {
      // Check parallel-mode borrowing
      const parallelIntervals =
        (keyContext.mode === 'major' || keyContext.mode === 'lydian' || keyContext.mode === 'mixolydian')
          ? MODE_INTERVALS.minor
          : MODE_INTERVALS.major;
      const parallelDeg = parallelIntervals.indexOf(relSemitone);

      if (parallelDeg >= 0) {
        isBorrowed   = true;
        borrowedFrom =
          (keyContext.mode === 'major' || keyContext.mode === 'lydian' || keyContext.mode === 'mixolydian')
            ? 'parallel minor'
            : 'parallel major';
        const numeral = ROMAN_NUMERALS[parallelDeg];
        romanNumeral  = (bq === 'min' || bq === 'dim') ? numeral.toLowerCase() : numeral;
        if (bq === 'dim') romanNumeral += '°';
        harmonicFunction = getFunctionForDegree(parallelDeg, keyContext.mode === 'major' ? 'minor' : 'major');
        confidence = 0.75;
      } else {
        // Truly chromatic / uncertain
        const { root } = parseChordSymbol(chord.symbol);
        romanNumeral     = `?${root}`;
        harmonicFunction = 'chromatic';
        confidence       = 0.4;
        uncertain        = true;
      }
    }
  }

  return {
    chordId: chord.id,
    romanNumeral,
    quality,
    harmonicFunction,
    isBorrowed,
    borrowedFrom,
    isSecondaryDominant,
    secondaryTarget,
    confidence,
    uncertain: uncertain || confidence < 0.6,
  };
}

/** Detect the cadence type for the last chord pair in a sequence of ChordAnalyses. */
function detectCadence(analyses: ChordAnalysis[]): CadenceType {
  if (analyses.length < 2) return 'none';
  const last       = analyses[analyses.length - 1];
  const secondLast = analyses[analyses.length - 2];

  // Authentic: dominant → tonic (V→I or V→i)
  if (
    secondLast.harmonicFunction === 'dominant' &&
    (last.romanNumeral === 'I' || last.romanNumeral === 'i')
  ) return 'authentic';

  // Half: ends on dominant
  if (last.harmonicFunction === 'dominant') return 'half';

  // Plagal: IV→I or iv→i
  if (
    (secondLast.romanNumeral === 'IV' || secondLast.romanNumeral === 'iv') &&
    (last.romanNumeral === 'I'  || last.romanNumeral === 'i')
  ) return 'plagal';

  // Deceptive: dominant → submediant
  if (
    secondLast.harmonicFunction === 'dominant' &&
    (last.romanNumeral === 'vi' || last.romanNumeral === 'VI')
  ) return 'deceptive';

  return 'none';
}

/**
 * Analyse all chords in a collection of bars and return a SectionAnalysis
 * with per-chord annotations, cadence markers, and rationale tags.
 */
export function analyzeSection(bars: Bar[], keyContext: KeyContext, sectionId: string): SectionAnalysis {
  const chordAnalyses: ChordAnalysis[] = [];
  const cadences: Array<{ barIndex: number; type: CadenceType }> = [];

  for (let i = 0; i < bars.length; i++) {
    const bar = bars[i];
    for (const chord of bar.chords) {
      chordAnalyses.push(analyzeChord(chord, keyContext));
    }

    // Cadence check at end of every 4-bar phrase or final bar
    if (((i + 1) % 4 === 0 || i === bars.length - 1) && chordAnalyses.length >= 2) {
      const cadence = detectCadence(chordAnalyses);
      if (cadence !== 'none') {
        cadences.push({ barIndex: i, type: cadence });
      }
    }
  }

  // Rationale tags
  const rationaleTags: string[] = [];
  const rnSet = new Set(chordAnalyses.map((a) => a.romanNumeral));

  if (rnSet.has('I') && rnSet.has('IV') && rnSet.has('V'))  rationaleTags.push('I-IV-V present');
  if (rnSet.has('I') && rnSet.has('V') && rnSet.has('vi'))  rationaleTags.push('I-V-vi pattern');
  if (chordAnalyses.some((a) => a.isBorrowed))               rationaleTags.push('modal mixture');
  if (chordAnalyses.some((a) => a.isSecondaryDominant))      rationaleTags.push('secondary dominants');
  if (cadences.some((c) => c.type === 'authentic'))          rationaleTags.push('strong authentic cadence');
  if (cadences.some((c) => c.type === 'half'))               rationaleTags.push('open half cadence');
  if (cadences.some((c) => c.type === 'deceptive'))          rationaleTags.push('deceptive cadence');
  if (chordAnalyses.some((a) => a.uncertain))                rationaleTags.push('chromatic/ambiguous chords');

  return { sectionId, keyContext, chordAnalyses, cadences, rationaleTags };
}
