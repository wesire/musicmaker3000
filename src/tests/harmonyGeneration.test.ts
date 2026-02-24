import { describe, it, expect } from 'vitest';
import { analyzeChord, analyzeSection } from '../services/analysisEngine';
import { generateSong, generateSectionBars, generateSectionAlternatives } from '../services/harmonyGenerator';
import { createChordEvent } from '../models/factories';
import {
  popPromptConstraints,
  jazzPromptConstraints,
  darkRockPromptConstraints,
  dreamyPromptConstraints,
  folkPromptConstraints,
} from '../fixtures/phase2Fixtures';

// ─── Chord Analysis ───────────────────────────────────────────────────────────

describe('analyzeChord', () => {
  const cMajorKey = { root: 'C' as const, mode: 'major' as const };

  it('identifies I chord in C major', () => {
    const chord = createChordEvent(1, 'C', 4);
    const analysis = analyzeChord(chord, cMajorKey);
    expect(analysis.romanNumeral).toBe('I');
    expect(analysis.harmonicFunction).toBe('tonic');
    expect(analysis.isBorrowed).toBe(false);
    expect(analysis.confidence).toBeGreaterThanOrEqual(0.9);
  });

  it('identifies IV chord (F) in C major', () => {
    const chord = createChordEvent(1, 'F', 4);
    const analysis = analyzeChord(chord, cMajorKey);
    expect(analysis.romanNumeral).toBe('IV');
    expect(analysis.harmonicFunction).toBe('predominant');
  });

  it('identifies V chord (G) in C major', () => {
    const chord = createChordEvent(1, 'G', 4);
    const analysis = analyzeChord(chord, cMajorKey);
    expect(analysis.romanNumeral).toBe('V');
    expect(analysis.harmonicFunction).toBe('dominant');
  });

  it('identifies vi chord (Am) in C major', () => {
    const chord = createChordEvent(1, 'Am', 4);
    const analysis = analyzeChord(chord, cMajorKey);
    expect(analysis.romanNumeral).toBe('vi');
    expect(analysis.harmonicFunction).toBe('tonic');
  });

  it('identifies ii chord (Dm) in C major', () => {
    const chord = createChordEvent(1, 'Dm', 4);
    const analysis = analyzeChord(chord, cMajorKey);
    expect(analysis.romanNumeral).toBe('ii');
    expect(analysis.harmonicFunction).toBe('predominant');
  });

  it('identifies vii° chord (Bdim) in C major', () => {
    const chord = createChordEvent(1, 'Bdim', 4);
    const analysis = analyzeChord(chord, cMajorKey);
    expect(analysis.romanNumeral).toBe('vii°');
    expect(analysis.harmonicFunction).toBe('dominant');
  });

  it('identifies secondary dominant V/V (D major in C)', () => {
    const chord = createChordEvent(1, 'D', 4);
    const analysis = analyzeChord(chord, cMajorKey);
    expect(analysis.isSecondaryDominant).toBe(true);
    expect(analysis.romanNumeral).toContain('V/');
    expect(analysis.harmonicFunction).toBe('dominant');
  });

  it('identifies borrowed bVII (Bb in C major)', () => {
    const chord = createChordEvent(1, 'Bb', 4);
    const analysis = analyzeChord(chord, cMajorKey);
    expect(analysis.isBorrowed).toBe(true);
    expect(analysis.borrowedFrom).toBe('parallel minor');
  });

  it('marks chromatic chord as uncertain', () => {
    const chord = createChordEvent(1, 'F#', 4);
    const analysis = analyzeChord(chord, cMajorKey);
    // F# is chromatic in C major (not easily borrowed)
    expect(analysis.confidence).toBeLessThan(0.9);
  });

  it('handles 7th chord extensions', () => {
    const chord = createChordEvent(1, 'Cmaj7', 4);
    const analysis = analyzeChord(chord, cMajorKey);
    expect(analysis.romanNumeral).toBe('I');
    expect(analysis.quality).toContain('maj7');
  });

  it('analyses chord in minor key', () => {
    const aMinorKey = { root: 'A' as const, mode: 'minor' as const };
    const chord = createChordEvent(1, 'Am', 4);
    const analysis = analyzeChord(chord, aMinorKey);
    expect(analysis.romanNumeral).toBe('i');
    expect(analysis.harmonicFunction).toBe('tonic');
  });
});

// ─── Section Analysis ─────────────────────────────────────────────────────────

describe('analyzeSection', () => {
  const cMajorKey = { root: 'C' as const, mode: 'major' as const };

  it('returns analysis with chordAnalyses for each chord', () => {
    const bars = [
      { id: 'b1', index: 0, timeSignature: [4, 4] as [number, number], chords: [createChordEvent(1, 'C', 4)] },
      { id: 'b2', index: 1, timeSignature: [4, 4] as [number, number], chords: [createChordEvent(1, 'F', 4)] },
      { id: 'b3', index: 2, timeSignature: [4, 4] as [number, number], chords: [createChordEvent(1, 'G', 4)] },
      { id: 'b4', index: 3, timeSignature: [4, 4] as [number, number], chords: [createChordEvent(1, 'C', 4)] },
    ];
    const analysis = analyzeSection(bars, cMajorKey, 'sec1');
    expect(analysis.chordAnalyses).toHaveLength(4);
    expect(analysis.sectionId).toBe('sec1');
    expect(analysis.keyContext).toEqual(cMajorKey);
  });

  it('detects authentic cadence at phrase end', () => {
    const bars = [
      { id: 'b1', index: 0, timeSignature: [4, 4] as [number, number], chords: [createChordEvent(1, 'C', 4)] },
      { id: 'b2', index: 1, timeSignature: [4, 4] as [number, number], chords: [createChordEvent(1, 'F', 4)] },
      { id: 'b3', index: 2, timeSignature: [4, 4] as [number, number], chords: [createChordEvent(1, 'G', 4)] },
      { id: 'b4', index: 3, timeSignature: [4, 4] as [number, number], chords: [createChordEvent(1, 'C', 4)] },
    ];
    const analysis = analyzeSection(bars, cMajorKey, 'sec1');
    const hasAuthentic = analysis.cadences.some((c) => c.type === 'authentic');
    expect(hasAuthentic).toBe(true);
  });

  it('adds rationale tags for I-IV-V presence', () => {
    const bars = [
      { id: 'b1', index: 0, timeSignature: [4, 4] as [number, number], chords: [createChordEvent(1, 'C', 4)] },
      { id: 'b2', index: 1, timeSignature: [4, 4] as [number, number], chords: [createChordEvent(1, 'F', 4)] },
      { id: 'b3', index: 2, timeSignature: [4, 4] as [number, number], chords: [createChordEvent(1, 'G', 4)] },
      { id: 'b4', index: 3, timeSignature: [4, 4] as [number, number], chords: [createChordEvent(1, 'Am', 4)] },
    ];
    const analysis = analyzeSection(bars, cMajorKey, 'sec1');
    expect(analysis.rationaleTags).toContain('I-IV-V present');
  });

  it('annotates borrowed chords in rationale tags', () => {
    const bars = [
      { id: 'b1', index: 0, timeSignature: [4, 4] as [number, number], chords: [createChordEvent(1, 'C', 4)] },
      { id: 'b2', index: 1, timeSignature: [4, 4] as [number, number], chords: [createChordEvent(1, 'Fm', 4)] }, // borrowed iv
      { id: 'b3', index: 2, timeSignature: [4, 4] as [number, number], chords: [createChordEvent(1, 'G', 4)] },
      { id: 'b4', index: 3, timeSignature: [4, 4] as [number, number], chords: [createChordEvent(1, 'C', 4)] },
    ];
    const analysis = analyzeSection(bars, cMajorKey, 'sec1');
    expect(analysis.rationaleTags).toContain('modal mixture');
  });
});

// ─── Harmony Generation ───────────────────────────────────────────────────────

describe('generateSectionBars', () => {
  it('generates the correct number of bars', () => {
    const bars = generateSectionBars('verse', 8, { root: 'C', mode: 'major' }, popPromptConstraints);
    expect(bars).toHaveLength(8);
  });

  it('every bar has exactly one chord', () => {
    const bars = generateSectionBars('chorus', 4, { root: 'C', mode: 'major' }, popPromptConstraints);
    bars.forEach((bar) => expect(bar.chords).toHaveLength(1));
  });

  it('chords have non-empty symbols', () => {
    const bars = generateSectionBars('verse', 4, { root: 'G', mode: 'major' }, folkPromptConstraints);
    bars.forEach((bar) => {
      expect(bar.chords[0].symbol).toBeTruthy();
      expect(bar.chords[0].symbol.length).toBeGreaterThan(0);
    });
  });

  it('generates simple triads for simple complexity', () => {
    const bars = generateSectionBars('verse', 4, { root: 'C', mode: 'major' }, folkPromptConstraints);
    bars.forEach((bar) => {
      const sym = bar.chords[0].symbol;
      // Simple complexity should not include 7ths/9ths in most cases
      expect(sym).not.toMatch(/maj7|m9|maj9/);
    });
  });

  it('generates 7th/9th extensions for jazzy complexity', () => {
    const bars = generateSectionBars('verse', 4, { root: 'C', mode: 'major' }, jazzPromptConstraints);
    const symbols = bars.map((b) => b.chords[0].symbol);
    const hasExtension = symbols.some((s) => /maj7|m7|m9|maj9|7/.test(s));
    expect(hasExtension).toBe(true);
  });

  it('generates different patterns for different variants', () => {
    const key = { root: 'C' as const, mode: 'major' as const };
    const barsA = generateSectionBars('verse', 4, key, popPromptConstraints, 0);
    const barsB = generateSectionBars('verse', 4, key, popPromptConstraints, 1);
    const chordsA = barsA.map((b) => b.chords[0].symbol).join(',');
    const chordsB = barsB.map((b) => b.chords[0].symbol).join(',');
    expect(chordsA).not.toBe(chordsB);
  });

  it('generates valid chords for minor key', () => {
    const bars = generateSectionBars('verse', 4, { root: 'A', mode: 'minor' }, darkRockPromptConstraints);
    expect(bars).toHaveLength(4);
    bars.forEach((bar) => expect(bar.chords[0].symbol).toBeTruthy());
  });

  it('harmonic minor: V is raised to major in minor key', () => {
    // In A minor, the V degree (degree 4) should produce E (major), not Em
    const key = { root: 'A' as const, mode: 'minor' as const };
    // Use prechorus which uses degree 4 heavily
    const bars = generateSectionBars('prechorus', 4, key, darkRockPromptConstraints, 0);
    const symbols = bars.map((b) => b.chords[0].symbol);
    // At least one bar should have E (major V), not Em
    const hasE = symbols.some((s) => s === 'E' || s === 'E7' || s === 'E9');
    expect(hasE).toBe(true);
  });
});

describe('generateSong', () => {
  it('returns a song with sections', () => {
    const result = generateSong(popPromptConstraints, 'Test Pop Song');
    expect(result.song).toBeDefined();
    expect(result.song.sections.length).toBeGreaterThan(0);
  });

  it('returns exactly 2 song alternatives (B and C)', () => {
    const result = generateSong(popPromptConstraints);
    expect(result.alternatives).toHaveLength(2);
    expect(result.alternatives[0].label).toBe('B');
    expect(result.alternatives[1].label).toBe('C');
  });

  it('includes sectionAnalyses for each section', () => {
    const result = generateSong(popPromptConstraints);
    expect(result.sectionAnalyses).toHaveLength(result.song.sections.length);
  });

  it('preserves constraint reference', () => {
    const result = generateSong(folkPromptConstraints, 'Folk Test');
    expect(result.constraints).toBe(folkPromptConstraints);
  });

  it('section analyses attach to correct section IDs', () => {
    const result = generateSong(popPromptConstraints);
    result.sectionAnalyses.forEach((analysis, i) => {
      expect(analysis.sectionId).toBe(result.song.sections[i].id);
    });
  });

  it('each chord event has an id', () => {
    const result = generateSong(popPromptConstraints);
    result.song.sections.forEach((sec) => {
      sec.bars.forEach((bar) => {
        bar.chords.forEach((chord) => {
          expect(chord.id).toBeTruthy();
        });
      });
    });
  });

  it('jazz song uses jazzy key (F major)', () => {
    const result = generateSong(jazzPromptConstraints, 'Jazz Test');
    expect(result.song.keyContext.root).toBe('F');
  });

  it('dark rock song uses minor key', () => {
    const result = generateSong(darkRockPromptConstraints, 'Rock Test');
    expect(result.song.keyContext.mode).toBe('minor');
  });

  it('dreamy song uses lydian mode', () => {
    const result = generateSong(dreamyPromptConstraints, 'Dreamy Test');
    expect(result.song.keyContext.mode).toBe('lydian');
  });
});

describe('generateSectionAlternatives', () => {
  it('returns exactly 3 alternatives labelled A, B, C', () => {
    const alts = generateSectionAlternatives('verse', 4, { root: 'C', mode: 'major' }, popPromptConstraints, 'sec1');
    expect(alts).toHaveLength(3);
    expect(alts.map((a) => a.label)).toEqual(['A', 'B', 'C']);
  });

  it('each alternative has bars and analysis', () => {
    const alts = generateSectionAlternatives('chorus', 4, { root: 'C', mode: 'major' }, popPromptConstraints, 'sec1');
    alts.forEach((alt) => {
      expect(alt.bars.length).toBeGreaterThan(0);
      expect(alt.analysis).toBeDefined();
      expect(alt.metadataTags.length).toBeGreaterThan(0);
    });
  });

  it('alternatives differ from each other', () => {
    const alts = generateSectionAlternatives('verse', 4, { root: 'C', mode: 'major' }, popPromptConstraints, 'sec1');
    const chordsA = alts[0].bars.map((b) => b.chords[0].symbol).join(',');
    const chordsB = alts[1].bars.map((b) => b.chords[0].symbol).join(',');
    expect(chordsA).not.toBe(chordsB);
  });
});
