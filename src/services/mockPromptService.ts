import { createId } from '../models/factories';
import type { GenerationPrompt, PromptResponse, PromptType, SelectionRange, Song } from '../models/types';
import { parsePrompt } from './promptParser';
import { generateSong } from './harmonyGenerator';
import { rewriteSelection } from './rewriteEngine';

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

async function mockExplainSelection(selection?: SelectionRange): Promise<unknown> {
  return {
    items: [
      {
        id: createId(),
        barPosition: selection?.start ?? { sectionIndex: 0, barIndex: 0 },
        text: 'This chord progression uses a ii-V-I pattern, common in jazz.',
        category: 'harmonic-function',
      },
      {
        id: createId(),
        barPosition: selection?.start ?? { sectionIndex: 0, barIndex: 0 },
        text: 'The voice leading moves smoothly by step between chords.',
        category: 'voice-leading',
      },
    ],
  };
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
      data = await mockExplainSelection(selection);
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

