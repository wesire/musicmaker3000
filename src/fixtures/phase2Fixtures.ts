/**
 * Phase 2 test fixtures.
 *
 * Provides pre-built PromptConstraints and generation/analysis results
 * for various musical styles, used in tests.
 */
import type { PromptConstraints, SelectionRange } from '../models/types';
import { parsePrompt } from '../services/promptParser';
import { generateSong } from '../services/harmonyGenerator';

// ─── Constraint fixtures (direct) ────────────────────────────────────────────

export const popPromptConstraints: PromptConstraints = {
  raw: 'upbeat pop song, happy, simple chords',
  styles: ['pop'],
  moods: ['happy', 'uplifting'],
  complexity: 'simple',
  brightness: 0.7,
  tension: 0.3,
  cadenceStrength: 'moderate',
  colorVocab: [],
  beginnerFriendly: true,
};

export const dreamyPromptConstraints: PromptConstraints = {
  raw: 'dreamy ethereal floating ambient atmosphere',
  styles: ['dreamy'],
  moods: ['calm', 'mysterious'],
  complexity: 'jazzy',
  brightness: 0.1,
  tension: 0.1,
  cadenceStrength: 'weak',
  colorVocab: ['lush', 'modal_mixture'],
  beginnerFriendly: false,
};

export const folkPromptConstraints: PromptConstraints = {
  raw: 'simple acoustic folk song, beginner-friendly, diatonic',
  styles: ['folk'],
  moods: ['calm', 'romantic'],
  complexity: 'simple',
  brightness: 0.2,
  tension: 0.1,
  cadenceStrength: 'moderate',
  colorVocab: ['diatonic', 'sparse'],
  beginnerFriendly: true,
};

export const jazzPromptConstraints: PromptConstraints = {
  raw: 'jazzy lush chords with ninths, sophisticated and colorful',
  styles: ['jazz'],
  moods: ['romantic', 'mysterious'],
  complexity: 'jazzy',
  brightness: 0.0,
  tension: 0.3,
  cadenceStrength: 'moderate',
  colorVocab: ['jazzy', 'lush', 'colorful'],
  beginnerFriendly: false,
};

export const darkRockPromptConstraints: PromptConstraints = {
  raw: 'dark heavy rock, minor, energetic driving, intense',
  styles: ['rock'],
  moods: ['dark', 'energetic'],
  complexity: 'moderate',
  brightness: -0.8,
  tension: 0.7,
  cadenceStrength: 'strong',
  colorVocab: [],
  beginnerFriendly: false,
};

export const lushChorusConstraints: PromptConstraints = {
  raw: 'lush uplifting chorus, stronger lift, more tension before chorus',
  styles: ['pop'],
  moods: ['uplifting', 'energetic'],
  complexity: 'moderate',
  brightness: 0.5,
  tension: 0.6,
  cadenceStrength: 'strong',
  colorVocab: ['lush'],
  editIntent: 'stronger_lift',
  sectionHints: { chorus: 'lush uplifting chorus', prechorus: 'stronger lift before chorus' },
  beginnerFriendly: false,
};

// ─── Parsed constraint fixtures ───────────────────────────────────────────────

export const parsedPopConstraints     = parsePrompt('upbeat pop song happy catchy radio');
export const parsedJazzConstraints    = parsePrompt('jazzy lush chord extensions with ninths and sevenths');
export const parsedDreamyConstraints  = parsePrompt('dreamy ethereal ambient floating');
export const parsedDarkRockConstraints = parsePrompt('dark heavy rock energetic driving intense minor');

// ─── Generation fixtures ──────────────────────────────────────────────────────

export const generatedPopSong         = generateSong(popPromptConstraints, 'Fixture Pop Song');
export const generatedJazzSong        = generateSong(jazzPromptConstraints, 'Fixture Jazz Song');
export const generatedDarkRockSong    = generateSong(darkRockPromptConstraints, 'Fixture Rock Song');

// ─── Selection range fixtures ─────────────────────────────────────────────────

/** Selects bars 0–3 of section 0. */
export const selectionSection0Full: SelectionRange = {
  start: { sectionIndex: 0, barIndex: 0 },
  end:   { sectionIndex: 0, barIndex: 3 },
};

/** Selects bars 0–1 of section 1 (e.g. beginning of verse). */
export const selectionVerseStart: SelectionRange = {
  start: { sectionIndex: 1, barIndex: 0 },
  end:   { sectionIndex: 1, barIndex: 1 },
};

/** Selects bars 4–7 of section 1 (e.g. end of verse / pre-chorus tension point). */
export const selectionVerseEnd: SelectionRange = {
  start: { sectionIndex: 1, barIndex: 4 },
  end:   { sectionIndex: 1, barIndex: 7 },
};
