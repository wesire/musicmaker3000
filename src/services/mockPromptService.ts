import { createId } from '../models/factories';
import type { Bar, GenerationPrompt, PromptResponse, PromptType, SelectionRange, Song } from '../models/types';
import { parsePrompt } from './promptParser';
import { generateSong } from './harmonyGenerator';
import { rewriteSelection } from './rewriteEngine';
import { explainSelection } from './explanationEngine';

const MOCK_DELAY = 300;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function handleGenerateSong(text: string): Promise<unknown> {
  const constraints = parsePrompt(text);
  return generateSong(constraints);
}

async function handleEditLocal(text: string, song: Song | null, selection?: SelectionRange): Promise<unknown> {
  const constraints = parsePrompt(text);
  if (song && selection) {
    return rewriteSelection(song, selection, constraints);
  }
  // Fallback when no song context available
  return {
    alternatives: [
      { id: createId(), label: 'A', bars: [], metadataTags: ['standard'] },
      { id: createId(), label: 'B', bars: [], metadataTags: ['smoother'] },
      { id: createId(), label: 'C', bars: [], metadataTags: ['colorful'] },
    ],
    changedRange: selection,
    diff: [],
    constraints,
  };
}

async function mockExplainSelection(
  song: Song | null,
  selection?: SelectionRange,
  text?: string,
): Promise<unknown> {
  if (!song || !selection) {
    return {
      selectionRange: selection ?? { start: { sectionIndex: 0, barIndex: 0 }, end: { sectionIndex: 0, barIndex: 0 } },
      summary: 'Select a chord or bar range to receive a grounded harmonic explanation.',
      breakdown: [],
      substitutions: [],
      uncertaintyNotices: [],
    };
  }

  // Extract bars from the selection
  const bars: Bar[] = [];
  for (let si = selection.start.sectionIndex; si <= selection.end.sectionIndex; si++) {
    const section = song.sections[si];
    if (!section) continue;
    const startBar = si === selection.start.sectionIndex ? selection.start.barIndex : 0;
    const endBar   = si === selection.end.sectionIndex   ? selection.end.barIndex   : section.bars.length - 1;
    for (let bi = startBar; bi <= endBar; bi++) {
      if (section.bars[bi]) bars.push(section.bars[bi]);
    }
  }

  const section    = song.sections[selection.start.sectionIndex];
  const keyContext = section?.keyContext ?? song.keyContext;
  const sectionId  = section?.id ?? createId();
  const constraints = text?.trim() ? parsePrompt(text) : null;

  return explainSelection(bars, keyContext, sectionId, selection, constraints);
}

async function mockReharmonise(text: string, selection?: SelectionRange): Promise<unknown> {
  const constraints = parsePrompt(text || 'reharmonise');
  // Use the simplify intent for reharmonise
  const rewriteConstraints = { ...constraints, editIntent: 'more_colorful' as const };
  if (selection) {
    // Return same shape as EditLocalResult but framed as reharmonisation
    return { selection, alternatives: [], constraints: rewriteConstraints };
  }
  return {
    selection,
    alternatives: [
      ['Dm7', 'G7', 'Cmaj7', 'A7'],
      ['Em7b5', 'A7', 'Dm7', 'G7'],
    ],
    constraints: rewriteConstraints,
  };
}

async function mockSimplify(selection?: SelectionRange): Promise<unknown> {
  return {
    selection,
    simplified: ['C', 'F', 'G', 'C'],
    description: 'Simplified to basic I-IV-V-I progression',
  };
}

async function mockAlternatives(text: string, selection?: SelectionRange): Promise<unknown> {
  const constraints = parsePrompt(text || 'alternatives');
  return {
    selection,
    progressions: [
      { name: 'Option A', chords: ['C', 'Am', 'F', 'G'] },
      { name: 'Option B', chords: ['C', 'Em', 'F', 'G'] },
      { name: 'Option C', chords: ['Am', 'F', 'C', 'G'] },
    ],
    constraints,
  };
}

export async function sendPrompt(
  type: PromptType,
  text: string,
  selection?: SelectionRange,
  currentSong?: Song | null,
): Promise<PromptResponse> {
  await delay(MOCK_DELAY);

  let data: unknown;
  switch (type) {
    case 'GENERATE_SONG':
      data = await handleGenerateSong(text);
      break;
    case 'EDIT_LOCAL':
      data = await handleEditLocal(text, currentSong ?? null, selection);
      break;
    case 'EXPLAIN_SELECTION':
      data = await mockExplainSelection(currentSong ?? null, selection, text);
      break;
    case 'REHARMONISE':
      data = await mockReharmonise(text, selection);
      break;
    case 'SIMPLIFY':
      data = await mockSimplify(selection);
      break;
    case 'ALTERNATIVES':
      data = await mockAlternatives(text, selection);
      break;
    default:
      data = {};
  }

  const promptId = createId();
  return {
    id: createId(),
    promptId,
    type,
    data,
    mockGenerated: true,
  };
}

export function createPromptRecord(
  type: PromptType,
  text: string,
  selection?: SelectionRange,
): GenerationPrompt {
  return {
    id: createId(),
    type,
    text,
    selection,
    timestamp: new Date().toISOString(),
    status: 'idle',
  };
}

