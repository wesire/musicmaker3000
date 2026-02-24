/**
 * Grounded harmonic explanation engine (Phase 3).
 *
 * Consumes computed harmonic analysis annotations to produce plain-language
 * explanations of chord progressions.  Never fabricates certainty when the
 * analysis is marked uncertain or low-confidence.
 */
import type {
  Bar,
  ChordAnalysis,
  ExplanationBreakdownItem,
  ExplanationResult,
  KeyContext,
  Mode,
  PromptConstraints,
  SelectionRange,
  StyleTag,
  SubstitutionOption,
} from '../models/types';
import { createId } from '../models/factories';
import { analyzeSection } from './analysisEngine';

// ─── Plain-language lookup tables ────────────────────────────────────────────

const NUMERAL_DETAIL: Record<string, string> = {
  'I':    'the tonic — the home chord of the key',
  'i':    'the tonic minor — the home chord of the minor key',
  'IV':   'the subdominant — warm and familiar, a step away from home',
  'iv':   'the minor subdominant — adds a melancholic tint to a major context',
  'V':    'the dominant — creates tension that pulls back to the tonic',
  'v':    'the minor dominant — a gentler tension than major V',
  'ii':   'the supertonic minor — a classic pre-dominant chord',
  'II':   'the major supertonic — carries a secondary-dominant quality',
  'vi':   'the submediant minor — relative minor with a reflective colour',
  'VI':   'the major submediant — borrowed brightness in a minor key',
  'iii':  'the mediant minor — adds harmonic colour without strong function',
  'III':  'the major mediant — often borrowed from the parallel minor',
  'vii°': 'the leading-tone diminished — intense pull toward the tonic',
  'V/V':  'a secondary dominant (V of V) — adds momentum pushing toward the dominant',
  'V/vi': 'a secondary dominant (V of vi) — briefly tonicises the submediant',
  'V/IV': 'a secondary dominant (V of IV) — briefly tonicises the subdominant',
  'V/ii': 'a secondary dominant (V of ii) — briefly tonicises the supertonic',
  'V/iii':'a secondary dominant (V of iii) — briefly tonicises the mediant',
};

function romanDetail(rn: string): string {
  return NUMERAL_DETAIL[rn] ?? `Roman numeral ${rn}`;
}

// ─── Tension / release role ───────────────────────────────────────────────────

function tensionRole(
  analysis: ChordAnalysis,
  nextAnalysis: ChordAnalysis | null,
): string | undefined {
  if (analysis.uncertain) return undefined;
  const fn  = analysis.harmonicFunction;
  const nFn = nextAnalysis?.harmonicFunction;
  const nRn = nextAnalysis?.romanNumeral;

  if (fn === 'dominant') {
    if (nFn === 'tonic') return 'creates tension that resolves to the next chord';
    if (nRn === 'vi' || nRn === 'VI') return 'dominant resolving deceptively to the submediant';
    if (nFn === 'dominant') return 'intensifies tension — back-to-back dominant function';
    return 'builds tension (dominant function)';
  }
  if (fn === 'tonic') {
    if (nFn === 'dominant' || nFn === 'predominant') return 'provides stability before the phrase moves to tension';
    return 'provides rest and stability';
  }
  if (fn === 'predominant') return 'prepares the ear for dominant tension';
  if (fn === 'chromatic')   return 'adds colour outside the key — creates a moment of surprise';
  return undefined;
}

// ─── Connection to next chord ─────────────────────────────────────────────────

function connectionToNext(
  analysis: ChordAnalysis,
  nextAnalysis: ChordAnalysis | null,
): string | undefined {
  if (!nextAnalysis || analysis.uncertain || nextAnalysis.uncertain) return undefined;

  const rn  = analysis.romanNumeral;
  const nRn = nextAnalysis.romanNumeral;

  if ((rn === 'V' || rn === 'V7') && (nRn === 'I' || nRn === 'i'))
    return 'authentic cadence — resolves strongly to tonic';
  if (rn === 'IV' && (nRn === 'I' || nRn === 'i'))
    return 'plagal cadence — warm resolution to tonic';
  if ((rn === 'V' || rn === 'V7') && (nRn === 'vi' || nRn === 'VI'))
    return 'deceptive cadence — dominant resolves unexpectedly to submediant';
  if ((rn === 'ii' || rn === 'II') && (nRn === 'V' || nRn === 'V7'))
    return 'ii → V (classic pre-dominant to dominant move)';
  if (analysis.harmonicFunction === 'dominant' && nextAnalysis.harmonicFunction === 'dominant')
    return 'tension intensifies — two consecutive dominant-function chords';
  return undefined;
}

// ─── Summary ─────────────────────────────────────────────────────────────────

function buildSummary(
  chordAnalyses: ChordAnalysis[],
  keyContext: KeyContext,
  rationaleTags: string[],
): string {
  const { root, mode } = keyContext;
  const total = chordAnalyses.length;

  if (total === 0) return 'No chords in the selected range.';

  if (total === 1) {
    const a = chordAnalyses[0];
    const cert = a.uncertain ? ' (analysis uncertain)' : '';
    return `Single chord: ${a.romanNumeral} in ${root} ${mode} — ${romanDetail(a.romanNumeral)}${cert}.`;
  }

  const rns = chordAnalyses.map((a) => a.romanNumeral).join('–');
  const parts: string[] = [`Progression: ${rns} in ${root} ${mode}.`];

  if (rationaleTags.includes('strong authentic cadence'))
    parts.push('Ends with a strong authentic cadence (V→I).');
  else if (rationaleTags.includes('open half cadence'))
    parts.push('Ends with a half cadence — leaves the phrase open and expecting continuation.');
  else if (rationaleTags.includes('deceptive cadence'))
    parts.push('Contains a deceptive cadence — the dominant resolves to the submediant unexpectedly.');

  if (rationaleTags.includes('modal mixture'))
    parts.push('Includes borrowed chords from the parallel mode (modal mixture).');
  if (rationaleTags.includes('secondary dominants'))
    parts.push('Uses secondary dominants to temporarily tonicise other scale degrees.');

  const fnCounts = { tonic: 0, predominant: 0, dominant: 0, chromatic: 0, ambiguous: 0 };
  for (const a of chordAnalyses) fnCounts[a.harmonicFunction]++;

  if (fnCounts.dominant / total > 0.5)
    parts.push('Tension-heavy — dominated by dominant-function chords.');
  else if (fnCounts.tonic / total > 0.6)
    parts.push('Stable and grounded — mostly tonic-function chords.');

  return parts.join(' ');
}

// ─── Style fit ────────────────────────────────────────────────────────────────

function buildStyleFit(
  rationaleTags: string[],
  constraints: PromptConstraints | null,
): string | undefined {
  if (!constraints) return undefined;

  const { styles, moods, complexity } = constraints;
  const hasStyle = (s: StyleTag) => styles.includes(s);
  const parts: string[] = [];

  if (hasStyle('jazz') && rationaleTags.includes('secondary dominants'))
    parts.push('Secondary dominants are idiomatic for jazz — fits your prompt well.');
  if (hasStyle('folk') && rationaleTags.includes('I-IV-V present'))
    parts.push('The I–IV–V pattern is central to folk — a strong match for your style.');
  if (hasStyle('pop') && rationaleTags.includes('I-V-vi pattern'))
    parts.push('The I–V–vi pattern is a pop staple — fits your pop-style prompt.');
  if (hasStyle('rock') && rationaleTags.includes('strong authentic cadence'))
    parts.push('Strong cadences give this a rock-appropriate sense of finality.');
  if ((hasStyle('dreamy') || hasStyle('cinematic')) && rationaleTags.includes('modal mixture'))
    parts.push('Modal mixture chords add the dreamy/cinematic colour your prompt described.');
  if (moods.includes('tense') && constraints.tension > 0.5)
    parts.push('The tension level matches your tense/high-tension prompt intent.');
  if (moods.includes('calm') && constraints.tension < 0.3)
    parts.push('Low harmonic tension suits the calm mood of your prompt.');
  if (
    complexity === 'simple' &&
    !rationaleTags.includes('modal mixture') &&
    !rationaleTags.includes('secondary dominants')
  )
    parts.push('Clean diatonic progressions — aligned with your simple/beginner-friendly prompt.');
  if (
    complexity === 'jazzy' &&
    (rationaleTags.includes('secondary dominants') || rationaleTags.includes('modal mixture'))
  )
    parts.push('Extended and chromatic harmonies align with your jazzy complexity preference.');

  return parts.length > 0 ? parts.join(' ') : undefined;
}

// ─── Cadence explanation ──────────────────────────────────────────────────────

function buildCadenceExplanation(
  cadences: Array<{ barIndex: number; type: string }>,
): string | undefined {
  if (cadences.length === 0) return undefined;

  const explanations = cadences.map(({ barIndex, type }) => {
    switch (type) {
      case 'authentic': return `Bar ${barIndex + 1}: Authentic cadence (V→I) — strong resolution, feels conclusive.`;
      case 'half':      return `Bar ${barIndex + 1}: Half cadence (ends on V) — phrase left open, expects continuation.`;
      case 'plagal':    return `Bar ${barIndex + 1}: Plagal cadence (IV→I) — a warmer "amen" resolution.`;
      case 'deceptive': return `Bar ${barIndex + 1}: Deceptive cadence (V→vi) — dominant sidesteps the tonic, creating surprise.`;
      default: return null;
    }
  }).filter(Boolean);

  return explanations.length > 0 ? explanations.join(' ') : undefined;
}

// ─── Substitution helpers ─────────────────────────────────────────────────────

const NOTE_SEMITONES_EXP: Record<string, number> = {
  C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3,
  E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8,
  Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11,
};
const SHARP_NOTES_EXP  = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLAT_NOTES_EXP   = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
const SHARP_KEY_ROOTS_EXP = new Set([7, 2, 9, 4, 11, 6, 1]);
const MODE_INTERVALS_EXP: Record<Mode, number[]> = {
  major:      [0, 2, 4, 5, 7, 9, 11],
  minor:      [0, 2, 3, 5, 7, 8, 10],
  dorian:     [0, 2, 3, 5, 7, 9, 10],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
  phrygian:   [0, 1, 3, 5, 7, 8, 10],
  lydian:     [0, 2, 4, 6, 7, 9, 11],
  locrian:    [0, 1, 3, 5, 6, 8, 10],
};

function noteNameExp(semitone: number, keyRoot: string): string {
  const s = ((semitone % 12) + 12) % 12;
  const useSharps = SHARP_KEY_ROOTS_EXP.has(NOTE_SEMITONES_EXP[keyRoot] ?? 0);
  return (useSharps ? SHARP_NOTES_EXP : FLAT_NOTES_EXP)[s];
}

function buildSubstitutions(
  chordAnalyses: ChordAnalysis[],
  keyContext: KeyContext,
  bars: Bar[],
): SubstitutionOption[] {
  const subs: SubstitutionOption[] = [];
  const isMajFam = keyContext.mode === 'major' || keyContext.mode === 'lydian' || keyContext.mode === 'mixolydian';
  const keySemitone = NOTE_SEMITONES_EXP[keyContext.root] ?? 0;
  const intervals   = MODE_INTERVALS_EXP[keyContext.mode] ?? MODE_INTERVALS_EXP.major;

  // Focus on the most harmonically interesting chord
  const target =
    chordAnalyses.find((a) => a.isBorrowed || a.isSecondaryDominant || a.uncertain) ??
    chordAnalyses[chordAnalyses.length - 1];

  if (!target) return [];

  // Find the chord symbol from the bars
  let chordSymbol = '';
  outer: for (const bar of bars) {
    for (const chord of bar.chords) {
      if (chord.id === target.chordId) { chordSymbol = chord.symbol; break outer; }
    }
  }
  if (!chordSymbol) return [];

  const chordRoot = chordSymbol.match(/^[A-G][#b]?/)?.[0] ?? '';

  // 1. Lighter/diatonic: for borrowed chords suggest the diatonic version
  if (target.isBorrowed) {
    // In a major-family key the diatonic version is typically the major form (uppercase);
    // in a minor-family key the diatonic version uses the natural minor quality (lowercase for min/dim).
    const strippedRN  = target.romanNumeral.replace(/[°+]/g, '');
    const diatonicRN  = isMajFam
      ? strippedRN.toUpperCase()            // major key: diatonic = major quality
      : strippedRN.charAt(0).toLowerCase() + strippedRN.slice(1); // minor key: lowercase
    subs.push({
      id: createId(),
      originalChordId: target.chordId,
      substituteSymbol: `(diatonic ${diatonicRN})`,
      substituteRomanNumeral: diatonicRN,
      tag: 'lighter',
      rationale: `Replace the borrowed ${target.romanNumeral} with the diatonic ${diatonicRN} for a straightforward, all-diatonic sound.`,
      tradeoff: 'Loses the modal-mixture colour that makes this progression distinctive.',
    });
  }

  // 2. Richer: add extensions
  if (chordRoot) {
    if (target.harmonicFunction === 'dominant') {
      subs.push({
        id: createId(),
        originalChordId: target.chordId,
        substituteSymbol: `${chordRoot}9`,
        substituteRomanNumeral: target.romanNumeral,
        tag: 'richer',
        rationale: 'Add a ninth to the dominant chord for a richer, jazzier tension.',
        tradeoff: 'More dissonant — may not fit simpler or folk-adjacent styles.',
      });
    } else if (target.harmonicFunction === 'tonic') {
      const ext = isMajFam ? `${chordRoot}maj7` : `${chordRoot}m7`;
      subs.push({
        id: createId(),
        originalChordId: target.chordId,
        substituteSymbol: ext,
        substituteRomanNumeral: target.romanNumeral,
        tag: 'richer',
        rationale: `Add a seventh (${ext}) for a lush, jazzy tonic colour.`,
        tradeoff: 'The added seventh softens the sense of resolution — less conclusive.',
      });
    }
  }

  // 3. Smoother voice-leading: substitute with adjacent scale-degree chord
  if (target.harmonicFunction === 'dominant') {
    // Suggest ii as a pre-dominant alternative
    const iiSemitone = (keySemitone + intervals[1]) % 12;
    const iiRoot     = noteNameExp(iiSemitone, keyContext.root);
    const iiSymbol   = `${iiRoot}m`;
    subs.push({
      id: createId(),
      originalChordId: target.chordId,
      substituteSymbol: iiSymbol,
      substituteRomanNumeral: 'ii',
      tag: 'smoother',
      rationale: `Replace with ii (${iiSymbol}) — a pre-dominant that creates smooth bass motion and gentler tension.`,
      tradeoff: 'Less tension than the dominant — won\'t pull to resolve as strongly.',
    });
  } else if (target.harmonicFunction === 'predominant') {
    // Suggest IV as a smoother alternative
    const ivSemitone = (keySemitone + intervals[3]) % 12;
    const ivRoot     = noteNameExp(ivSemitone, keyContext.root);
    const ivSymbol   = isMajFam ? ivRoot : `${ivRoot}m`;
    subs.push({
      id: createId(),
      originalChordId: target.chordId,
      substituteSymbol: ivSymbol,
      substituteRomanNumeral: isMajFam ? 'IV' : 'iv',
      tag: 'smoother',
      rationale: `Replace with IV (${ivSymbol}) — a traditional pre-dominant with smooth voice leading.`,
      tradeoff: 'More predictable than the current chord — less harmonic interest.',
    });
  }

  return subs;
}

// ─── Uncertainty notices ──────────────────────────────────────────────────────

function buildUncertaintyNotices(chordAnalyses: ChordAnalysis[]): string[] {
  const notices: string[] = [];

  const uncertain = chordAnalyses.filter((a) => a.uncertain);
  if (uncertain.length > 0)
    notices.push(
      `${uncertain.length} chord${uncertain.length > 1 ? 's' : ''} could not be analysed with high confidence — marked uncertain. Interpretations may not be fully accurate.`
    );

  const lowConf = chordAnalyses.filter((a) => a.confidence < 0.7 && !a.uncertain);
  if (lowConf.length > 0)
    notices.push(
      `${lowConf.length} chord${lowConf.length > 1 ? 's' : ''} ${lowConf.length > 1 ? 'have' : 'has'} reduced confidence (possible secondary function or borrowed chord).`
    );

  return notices;
}

// ─── Breakdown builder ────────────────────────────────────────────────────────

function buildBreakdown(
  chordAnalyses: ChordAnalysis[],
  bars: Bar[],
): ExplanationBreakdownItem[] {
  // Flatten all chords from bars in order
  const allChords: Array<{ id: string; symbol: string }> = [];
  for (const bar of bars) {
    for (const chord of bar.chords) allChords.push({ id: chord.id, symbol: chord.symbol });
  }

  return chordAnalyses.map((analysis, i) => {
    const chordInfo    = allChords.find((c) => c.id === analysis.chordId);
    const nextAnalysis = chordAnalyses[i + 1] ?? null;

    let detail = romanDetail(analysis.romanNumeral);
    if (analysis.isBorrowed && analysis.borrowedFrom)
      detail += `. Borrowed from ${analysis.borrowedFrom} — adds modal colour`;
    if (analysis.isSecondaryDominant && analysis.secondaryTarget)
      detail += `. Briefly tonicises ${analysis.secondaryTarget}`;
    if (analysis.uncertain)
      detail += ' (analysis uncertain — chromatic or unusual chord)';

    return {
      chordId:         analysis.chordId,
      symbol:          chordInfo?.symbol ?? '',
      romanNumeral:    analysis.romanNumeral,
      harmonicFunction: analysis.harmonicFunction,
      detail,
      tensionRole:     tensionRole(analysis, nextAnalysis),
      connectionToNext: connectionToNext(analysis, nextAnalysis),
      uncertain:       analysis.uncertain,
      confidence:      analysis.confidence,
    };
  });
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Generate a grounded harmonic explanation for a selection of bars.
 *
 * All explanations are derived from the computed `SectionAnalysis` produced by
 * `analyzeSection`.  Uncertainty is surfaced honestly when confidence is low.
 */
export function explainSelection(
  bars: Bar[],
  keyContext: KeyContext,
  sectionId: string,
  selectionRange: SelectionRange,
  constraints: PromptConstraints | null,
): ExplanationResult {
  const analysis = analyzeSection(bars, keyContext, sectionId);
  const { chordAnalyses, cadences, rationaleTags } = analysis;

  return {
    selectionRange,
    summary:             buildSummary(chordAnalyses, keyContext, rationaleTags),
    breakdown:           buildBreakdown(chordAnalyses, bars),
    styleFit:            buildStyleFit(rationaleTags, constraints),
    cadenceExplanation:  buildCadenceExplanation(cadences),
    substitutions:       buildSubstitutions(chordAnalyses, keyContext, bars),
    uncertaintyNotices:  buildUncertaintyNotices(chordAnalyses),
  };
}
