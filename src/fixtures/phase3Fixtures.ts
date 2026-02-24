/**
 * Phase 3 test fixtures.
 *
 * Showcases harmonic explanation scenarios:
 *   - Simple diatonic progression
 *   - Borrowed chord / modal mixture
 *   - Pre-chorus tension build
 *   - Deceptive cadence
 *   - Alternative substitution examples
 */
import type { Bar, KeyContext, SelectionRange } from '../models/types';
import { createBar, createChordEvent, createId } from '../models/factories';
import {
  popPromptConstraints,
  jazzPromptConstraints,
  darkRockPromptConstraints,
} from './phase2Fixtures';

// ─── Key contexts ─────────────────────────────────────────────────────────────

export const keyC: KeyContext  = { root: 'C',  mode: 'major' };
export const keyCm: KeyContext = { root: 'C',  mode: 'minor' };
export const keyG: KeyContext  = { root: 'G',  mode: 'major' };
export const keyAm: KeyContext = { root: 'A',  mode: 'minor' };

// ─── Helper to build a single-chord bar ──────────────────────────────────────

function bar(symbol: string, barIndex: number): Bar {
  const b = createBar(barIndex, [4, 4]);
  b.chords = [createChordEvent(1, symbol, 4)];
  return b;
}

// ─── Scenario 1: Simple diatonic I–IV–V–I (C major) ─────────────────────────

export const diatonicBars: Bar[] = [
  bar('C',  0),
  bar('F',  1),
  bar('G',  2),
  bar('C',  3),
];

export const diatonicSelection: SelectionRange = {
  start: { sectionIndex: 0, barIndex: 0 },
  end:   { sectionIndex: 0, barIndex: 3 },
};

// ─── Scenario 2: Borrowed chord / modal mixture (C major with bVII) ──────────
// C – F – Bb – C   (Bb = bVII borrowed from C Mixolydian / C minor)

export const borrowedChordBars: Bar[] = [
  bar('C',  0),
  bar('F',  1),
  bar('Bb', 2),
  bar('C',  3),
];

export const borrowedChordSelection: SelectionRange = {
  start: { sectionIndex: 0, barIndex: 0 },
  end:   { sectionIndex: 0, barIndex: 3 },
};

// ─── Scenario 3: Pre-chorus tension build (ii–V–I push) ──────────────────────
// Dm – G7 – C – G7  (builds tension, ends on dominant half cadence)

export const preChorusBars: Bar[] = [
  bar('Dm', 0),
  bar('G7', 1),
  bar('C',  2),
  bar('G7', 3),
];

export const preChorusSelection: SelectionRange = {
  start: { sectionIndex: 0, barIndex: 0 },
  end:   { sectionIndex: 0, barIndex: 3 },
};

// ─── Scenario 4: Deceptive cadence feel ──────────────────────────────────────
// C – F – G – Am  (G resolves deceptively to Am instead of C)

export const deceptiveCadenceBars: Bar[] = [
  bar('C',  0),
  bar('F',  1),
  bar('G',  2),
  bar('Am', 3),
];

export const deceptiveCadenceSelection: SelectionRange = {
  start: { sectionIndex: 0, barIndex: 0 },
  end:   { sectionIndex: 0, barIndex: 3 },
};

// ─── Scenario 5: Ambiguous / chromatic chord ─────────────────────────────────
// C – F – Db – G  (Db is chromatic in C major)

export const chromaticChordBars: Bar[] = [
  bar('C',  0),
  bar('F',  1),
  bar('Db', 2),
  bar('G',  3),
];

export const chromaticChordSelection: SelectionRange = {
  start: { sectionIndex: 0, barIndex: 0 },
  end:   { sectionIndex: 0, barIndex: 3 },
};

// ─── Scenario 6: Single-chord selection ──────────────────────────────────────

export const singleChordBar: Bar[] = [bar('G', 0)];

export const singleChordSelection: SelectionRange = {
  start: { sectionIndex: 0, barIndex: 0 },
  end:   { sectionIndex: 0, barIndex: 0 },
};

// ─── Re-export Phase 2 constraints for reuse in Phase 3 tests ────────────────

export { popPromptConstraints, jazzPromptConstraints, darkRockPromptConstraints };

// ─── A reusable section ID for tests ─────────────────────────────────────────

export const testSectionId = createId();
