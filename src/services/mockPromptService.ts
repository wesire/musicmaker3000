import { createId } from '../models/factories';
import type { GenerationPrompt, PromptResponse, PromptType, SelectionRange } from '../models/types';

const MOCK_DELAY = 500;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function mockGenerateSong(): Promise<unknown> {
  return {
    title: 'AI Generated Song',
    sections: [
      { label: 'Verse', chords: ['C', 'G', 'Am', 'F'] },
      { label: 'Chorus', chords: ['F', 'C', 'G', 'G'] },
    ],
  };
}

async function mockEditLocal(selection?: SelectionRange): Promise<unknown> {
  return {
    selection,
    edits: [
      { barIndex: selection?.start.barIndex ?? 0, chord: 'Dm7' },
      { barIndex: (selection?.start.barIndex ?? 0) + 1, chord: 'G7' },
    ],
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

async function mockReharmonise(selection?: SelectionRange): Promise<unknown> {
  return {
    selection,
    alternatives: [
      ['Dm7', 'G7', 'Cmaj7', 'A7'],
      ['Em7b5', 'A7', 'Dm7', 'G7'],
    ],
  };
}

async function mockSimplify(selection?: SelectionRange): Promise<unknown> {
  return {
    selection,
    simplified: ['C', 'F', 'G', 'C'],
    description: 'Simplified to basic I-IV-V-I progression',
  };
}

async function mockAlternatives(selection?: SelectionRange): Promise<unknown> {
  return {
    selection,
    progressions: [
      { name: 'Option A', chords: ['C', 'Am', 'F', 'G'] },
      { name: 'Option B', chords: ['C', 'Em', 'F', 'G'] },
      { name: 'Option C', chords: ['Am', 'F', 'C', 'G'] },
    ],
  };
}

export async function sendPrompt(
  type: PromptType,
  _text: string,
  selection?: SelectionRange,
): Promise<PromptResponse> {
  await delay(MOCK_DELAY);

  let data: unknown;
  switch (type) {
    case 'GENERATE_SONG':
      data = await mockGenerateSong();
      break;
    case 'EDIT_LOCAL':
      data = await mockEditLocal(selection);
      break;
    case 'EXPLAIN_SELECTION':
      data = await mockExplainSelection(selection);
      break;
    case 'REHARMONISE':
      data = await mockReharmonise(selection);
      break;
    case 'SIMPLIFY':
      data = await mockSimplify(selection);
      break;
    case 'ALTERNATIVES':
      data = await mockAlternatives(selection);
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
