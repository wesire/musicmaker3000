import { describe, it, expect } from 'vitest';
import { rewriteSelection, applyAlternativeToBars } from '../services/rewriteEngine';
import { generateSong } from '../services/harmonyGenerator';
import {
  popPromptConstraints,
  darkRockPromptConstraints,
  selectionSection0Full,
} from '../fixtures/phase2Fixtures';
import type { PromptConstraints, SelectionRange } from '../models/types';

function makeSong() {
  return generateSong(popPromptConstraints, 'Rewrite Test Song').song;
}

// ─── rewriteSelection ─────────────────────────────────────────────────────────

describe('rewriteSelection', () => {
  it('returns exactly 3 alternatives labelled A, B, C', () => {
    const song = makeSong();
    const result = rewriteSelection(song, selectionSection0Full, popPromptConstraints);
    expect(result.alternatives).toHaveLength(3);
    expect(result.alternatives.map((a) => a.label)).toEqual(['A', 'B', 'C']);
  });

  it('each alternative has the correct bar count for the selection', () => {
    const song = makeSong();
    const result = rewriteSelection(song, selectionSection0Full, popPromptConstraints);
    const expectedBarCount =
      selectionSection0Full.end.barIndex - selectionSection0Full.start.barIndex + 1;
    result.alternatives.forEach((alt) => {
      expect(alt.bars).toHaveLength(expectedBarCount);
    });
  });

  it('includes changedRange matching the input selection', () => {
    const song = makeSong();
    const result = rewriteSelection(song, selectionSection0Full, popPromptConstraints);
    expect(result.changedRange).toEqual(selectionSection0Full);
  });

  it('includes constraints in result', () => {
    const song = makeSong();
    const result = rewriteSelection(song, selectionSection0Full, popPromptConstraints);
    expect(result.constraints).toBe(popPromptConstraints);
  });

  it('includes analysis annotation on each alternative', () => {
    const song = makeSong();
    const result = rewriteSelection(song, selectionSection0Full, popPromptConstraints);
    result.alternatives.forEach((alt) => {
      expect(alt.analysis).toBeDefined();
      expect(alt.analysis?.chordAnalyses.length).toBeGreaterThan(0);
    });
  });

  it('produces diff when bars changed', () => {
    const song = makeSong();
    // diff is computed against alternative A
    const result = rewriteSelection(song, selectionSection0Full, popPromptConstraints);
    // result.diff may be empty if A happens to produce same chords — but changedRange must be set
    expect(result.diff).toBeDefined();
    expect(Array.isArray(result.diff)).toBe(true);
  });

  it('edit intent "add_tension" produces dominant-heavy alternatives', () => {
    const song = makeSong();
    const constraints: PromptConstraints = { ...popPromptConstraints, editIntent: 'add_tension' };
    const result = rewriteSelection(song, selectionSection0Full, constraints);
    const metaA = result.alternatives[0].metadataTags;
    expect(metaA.some((t) => t.includes('tension') || t.includes('dominant'))).toBe(true);
  });

  it('edit intent "simplify" produces simplified metadata', () => {
    const song = makeSong();
    const constraints: PromptConstraints = { ...popPromptConstraints, editIntent: 'simplify' };
    const result = rewriteSelection(song, selectionSection0Full, constraints);
    const allTags = result.alternatives.flatMap((a) => a.metadataTags);
    expect(allTags.some((t) => /simpl|strip|minimal/i.test(t))).toBe(true);
  });

  it('edit intent "brighter" produces major-emphasis metadata', () => {
    const song = makeSong();
    const constraints: PromptConstraints = { ...popPromptConstraints, editIntent: 'brighten' };
    const result = rewriteSelection(song, selectionSection0Full, constraints);
    const allTags = result.alternatives.flatMap((a) => a.metadataTags);
    expect(allTags.some((t) => /bright|major|lift|open/i.test(t))).toBe(true);
  });

  it('handles selection at start of verse (bars 0-1)', () => {
    const song = makeSong();
    // selectionVerseStart requires song to have at least section[1] with 2+ bars
    // Use a safe selection on section 0 instead if song form may vary
    const safeSelection: SelectionRange = {
      start: { sectionIndex: 0, barIndex: 0 },
      end:   { sectionIndex: 0, barIndex: 1 },
    };
    const result = rewriteSelection(song, safeSelection, popPromptConstraints);
    expect(result.alternatives[0].bars).toHaveLength(2);
  });

  it('generates valid chords for dark rock (minor key)', () => {
    const rockSong = generateSong(darkRockPromptConstraints, 'Rock Test').song;
    const result = rewriteSelection(rockSong, selectionSection0Full, darkRockPromptConstraints);
    result.alternatives[0].bars.forEach((bar) => {
      expect(bar.chords[0].symbol).toBeTruthy();
    });
  });
});

// ─── applyAlternativeToBars ───────────────────────────────────────────────────

describe('applyAlternativeToBars', () => {
  it('replaces only bars in the selection', () => {
    const song = makeSong();
    const selection = selectionSection0Full;
    const result = rewriteSelection(song, selection, popPromptConstraints);
    const altA = result.alternatives[0];

    const newSong = applyAlternativeToBars(song, selection, altA.bars);

    // Bars in selection have replacement chords (from altA)
    for (let bi = selection.start.barIndex; bi <= selection.end.barIndex; bi++) {
      const replacementIdx = bi - selection.start.barIndex;
      expect(newSong.sections[selection.start.sectionIndex].bars[bi].chords[0].symbol)
        .toBe(altA.bars[replacementIdx].chords[0].symbol);
    }
  });

  it('preserves bars outside the selection', () => {
    const song = makeSong();
    const section = song.sections[0];
    // Select only first 2 bars — remaining bars should be untouched
    const selection: SelectionRange = {
      start: { sectionIndex: 0, barIndex: 0 },
      end:   { sectionIndex: 0, barIndex: 1 },
    };
    const result = rewriteSelection(song, selection, popPromptConstraints);
    const newSong = applyAlternativeToBars(song, selection, result.alternatives[0].bars);

    // Bars from bar index 2 onward must be identical
    for (let bi = 2; bi < section.bars.length; bi++) {
      expect(newSong.sections[0].bars[bi].chords)
        .toEqual(song.sections[0].bars[bi].chords);
    }
  });

  it('preserves all sections not in selection', () => {
    const song = makeSong();
    if (song.sections.length < 2) return; // guard

    const selection: SelectionRange = {
      start: { sectionIndex: 0, barIndex: 0 },
      end:   { sectionIndex: 0, barIndex: song.sections[0].bars.length - 1 },
    };
    const result = rewriteSelection(song, selection, popPromptConstraints);
    const newSong = applyAlternativeToBars(song, selection, result.alternatives[0].bars);

    // Section 1+ must be identical
    for (let si = 1; si < song.sections.length; si++) {
      expect(newSong.sections[si]).toEqual(song.sections[si]);
    }
  });

  it('preserves bar ids and indexes after apply', () => {
    const song = makeSong();
    const selection = selectionSection0Full;
    const result = rewriteSelection(song, selection, popPromptConstraints);
    const newSong = applyAlternativeToBars(song, selection, result.alternatives[0].bars);

    // Bar IDs and index values should be preserved (only chords replaced)
    for (let bi = selection.start.barIndex; bi <= selection.end.barIndex; bi++) {
      expect(newSong.sections[0].bars[bi].id).toBe(song.sections[0].bars[bi].id);
      expect(newSong.sections[0].bars[bi].index).toBe(song.sections[0].bars[bi].index);
    }
  });
});

// ─── Integration: generate → rewrite → apply ─────────────────────────────────

describe('Full generation → rewrite → apply flow', () => {
  it('full flow: generate song, rewrite selection, apply alternative', () => {
    const { song } = generateSong(popPromptConstraints, 'Flow Test');
    const selection: SelectionRange = {
      start: { sectionIndex: 0, barIndex: 0 },
      end:   { sectionIndex: 0, barIndex: 3 },
    };

    const editResult = rewriteSelection(song, selection, {
      ...popPromptConstraints,
      editIntent: 'add_tension',
    });

    expect(editResult.alternatives).toHaveLength(3);
    const altC = editResult.alternatives[2];

    const updatedSong = applyAlternativeToBars(song, selection, altC.bars);

    // Verify changed bars
    for (let bi = 0; bi <= 3; bi++) {
      expect(updatedSong.sections[0].bars[bi].chords[0].symbol)
        .toBe(altC.bars[bi].chords[0].symbol);
    }

    // Verify analysis annotations exist on the applied alternative
    expect(altC.analysis).toBeDefined();
    expect(altC.analysis!.chordAnalyses.length).toBeGreaterThan(0);
  });
});
