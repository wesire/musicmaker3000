// Positional
export interface BarPosition { sectionIndex: number; barIndex: number; beat?: number; }
export interface SelectionRange { start: BarPosition; end: BarPosition; }

// Key
export type NoteKey = 'C'|'C#'|'Db'|'D'|'D#'|'Eb'|'E'|'F'|'F#'|'Gb'|'G'|'G#'|'Ab'|'A'|'A#'|'Bb'|'B';
export type Mode = 'major'|'minor'|'dorian'|'mixolydian'|'phrygian'|'lydian'|'locrian';
export interface KeyContext { root: NoteKey; mode: Mode; }

// Chord
export interface ChordEvent { id: string; beat: number; durationBeats: number; symbol: string; notes?: string[]; }

// Bar
export interface Bar { id: string; index: number; timeSignature: [number, number]; chords: ChordEvent[]; }

// Section
export type SectionType = 'verse'|'chorus'|'bridge'|'intro'|'outro'|'prechorus'|'solo'|'custom';
export interface Section { id: string; index: number; type: SectionType; label: string; bars: Bar[]; keyContext?: KeyContext; }

// Song
export interface Song { id: string; title: string; tempo: number; keyContext: KeyContext; timeSignature: [number, number]; sections: Section[]; }

// SongVersion
export interface SongVersion { id: string; songId: string; version: number; timestamp: string; song: Song; description?: string; }

// EditOperation
export type EditOperationType = 'SET_CHORD'|'DELETE_CHORD'|'ADD_BAR'|'REMOVE_BAR'|'ADD_SECTION'|'REMOVE_SECTION'|'SET_TEMPO'|'SET_KEY';
export interface EditOperation { id: string; type: EditOperationType; timestamp: string; selection?: SelectionRange; payload: unknown; }

// Prompt types
export type PromptType = 'GENERATE_SONG'|'EDIT_LOCAL'|'EXPLAIN_SELECTION'|'REHARMONISE'|'SIMPLIFY'|'ALTERNATIVES';
export type RequestStatus = 'idle'|'loading'|'success'|'error';
export interface GenerationPrompt { id: string; type: PromptType; text: string; selection?: SelectionRange; timestamp: string; status: RequestStatus; response?: PromptResponse; }
export interface PromptResponse { id: string; promptId: string; type: PromptType; data: unknown; mockGenerated: boolean; }

// Playback
export type PlaybackState = 'stopped'|'playing'|'paused';
export interface TransportState { playbackState: PlaybackState; currentBar: number; currentBeat: number; tempo: number; loopEnabled: boolean; loopStart?: number; loopEnd?: number; transpose: number; }
export interface PlaybackPreset { id: string; name: string; instrumentType: string; description: string; }

// Annotations
export interface AnalysisAnnotation { id: string; barPosition: BarPosition; label: string; detail: string; }
export interface ExplanationItem { id: string; barPosition: BarPosition; text: string; category: string; }
export interface AlternativeSuggestion { id: string; barPosition: BarPosition; alternatives: ChordEvent[][]; }

// ArrangementTrack
export interface ArrangementTrack { id: string; name: string; instrument: string; muted: boolean; }

// EditPrompt
export interface EditPrompt { id: string; promptId: string; selection: SelectionRange; type: PromptType; text: string; }

// Project
export interface Project { id: string; name: string; createdAt: string; updatedAt: string; songs: Song[]; currentSongId: string; versions: SongVersion[]; editHistory: EditOperation[]; promptHistory: GenerationPrompt[]; }

// ─── Phase 2: Prompt Constraints ────────────────────────────────────────────

export type StyleTag = 'pop'|'rock'|'jazz'|'folk'|'dreamy'|'cinematic'|'funk'|'blues'|'classical'|'country';
export type MoodTag = 'happy'|'sad'|'energetic'|'calm'|'tense'|'uplifting'|'dark'|'mysterious'|'romantic';
export type HarmonicComplexity = 'simple'|'moderate'|'complex'|'jazzy';
export type ColorVocab = 'diatonic'|'modal_mixture'|'lush'|'jazzy'|'colorful'|'sparse';
export type EditIntent = 'add_tension'|'simplify'|'brighten'|'darken'|'more_colorful'|'smoother_voice_leading'|'stronger_lift'|'less_predictable';
export type CadenceStrength = 'weak'|'moderate'|'strong';

export interface PromptConstraints {
  raw: string;
  styles: StyleTag[];
  moods: MoodTag[];
  complexity: HarmonicComplexity;
  /** -1 = dark, 0 = neutral, 1 = bright */
  brightness: number;
  /** 0 = relaxed, 1 = very tense */
  tension: number;
  cadenceStrength: CadenceStrength;
  colorVocab: ColorVocab[];
  editIntent?: EditIntent;
  sectionHints?: Partial<Record<SectionType, string>>;
  beginnerFriendly: boolean;
}

// ─── Phase 2: Harmonic Analysis ─────────────────────────────────────────────

export type HarmonicFunction = 'tonic'|'predominant'|'dominant'|'chromatic'|'ambiguous';
export type CadenceType = 'authentic'|'half'|'plagal'|'deceptive'|'none';

export interface ChordAnalysis {
  chordId: string;
  romanNumeral: string;
  quality: string;
  harmonicFunction: HarmonicFunction;
  isBorrowed: boolean;
  borrowedFrom?: string;
  isSecondaryDominant: boolean;
  secondaryTarget?: string;
  cadenceRole?: CadenceType;
  /** 0–1 confidence in the analysis */
  confidence: number;
  uncertain?: boolean;
}

export interface SectionAnalysis {
  sectionId: string;
  keyContext: KeyContext;
  chordAnalyses: ChordAnalysis[];
  cadences: Array<{ barIndex: number; type: CadenceType }>;
  rationaleTags: string[];
}

// ─── Phase 2: Alternatives & Generation Results ──────────────────────────────

export interface AlternativeOption {
  id: string;
  label: 'A'|'B'|'C';
  /** Replacement bars for the selected range (EDIT_LOCAL) */
  bars: Bar[];
  metadataTags: string[];
  analysis?: SectionAnalysis;
}

export interface SongAlternative {
  id: string;
  label: 'A'|'B'|'C';
  song: Song;
  metadataTags: string[];
}

export interface BarDiff {
  sectionIndex: number;
  barIndex: number;
  before: ChordEvent[];
  after: ChordEvent[];
}

export interface GenerateSongResult {
  song: Song;
  alternatives: SongAlternative[];
  sectionAnalyses: SectionAnalysis[];
  constraints: PromptConstraints;
}

export interface EditLocalResult {
  alternatives: AlternativeOption[];
  changedRange: SelectionRange;
  diff: BarDiff[];
  constraints: PromptConstraints;
}

// ─── Phase 3: Explanation ────────────────────────────────────────────────────

export interface SubstitutionOption {
  id: string;
  originalChordId: string;
  substituteSymbol: string;
  substituteRomanNumeral: string;
  tag: 'lighter' | 'richer' | 'smoother' | 'standard';
  rationale: string;
  tradeoff: string;
}

export interface ExplanationBreakdownItem {
  chordId: string;
  symbol: string;
  romanNumeral: string;
  harmonicFunction: HarmonicFunction;
  detail: string;
  tensionRole?: string;
  connectionToNext?: string;
  uncertain?: boolean;
  confidence?: number;
}

export interface ExplanationResult {
  selectionRange: SelectionRange;
  summary: string;
  breakdown: ExplanationBreakdownItem[];
  styleFit?: string;
  cadenceExplanation?: string;
  substitutions: SubstitutionOption[];
  uncertaintyNotices: string[];
}

// ─── Phase 3: Overlay Settings ───────────────────────────────────────────────

export interface OverlaySettings {
  showChordSymbols: boolean;
  showRomanNumerals: boolean;
  showFunctionTags: boolean;
  showSectionLabels: boolean;
  showKeyContext: boolean;
  showNashvilleNumbers: boolean;
  showCadenceMarkers: boolean;
}

// ─── Phase 4: Arrangement / Voicing Engine ───────────────────────────────────

/** How notes are spread across time for a chord event. */
export type ArrangementPattern = 'block' | 'arpeggio' | 'pad' | 'strum' | 'rhythmic';

/** How many chord tones are included in each voicing. */
export type VoicingDensity = 'simple' | 'medium' | 'rich';

/** Playback quality tier — controls preset selection and arrangement sophistication. */
export type PlaybackQualityMode = 'sketch' | 'enhanced' | 'pro';

/** Controls passed to the voicing / arrangement engine. */
export interface VoicingOptions {
  /** How many chord tones to include. */
  density: VoicingDensity;
  /** Middle octave for root placement (4 = C4 / middle C). */
  octaveBase: number;
  /** 0 = no humanization, 1 = maximum humanization. */
  humanizeAmount: number;
  /** Preferred chord inversion strategy. */
  inversionPreference: 'root' | 'first' | 'second' | 'auto';
  /** Temporal spread of notes within the chord event. */
  pattern: ArrangementPattern;
}

/** A single synthesisable note event produced by the arrangement engine. */
export interface PlaybackNoteEvent {
  /** MIDI note number (0–127). C4 = 60. */
  midiNote: number;
  /** Beat position within the bar (1-indexed, matching ChordEvent.beat). */
  startBeat: number;
  /** Duration in beats. */
  durationBeats: number;
  /** MIDI velocity (0–127). */
  velocity: number;
}

/** The full set of note events generated for a single bar. */
export interface ArrangementResult {
  barId: string;
  notes: PlaybackNoteEvent[];
  pattern: ArrangementPattern;
  density: VoicingDensity;
}
