import { describe, it, expect } from 'vitest';
import { sendPrompt } from '../services/mockPromptService';

describe('Prompt service', { timeout: 5000 }, () => {
  it('returns a response for GENERATE_SONG', async () => {
    const response = await sendPrompt('GENERATE_SONG', 'Generate a pop song', undefined);
    expect(response).toBeDefined();
    expect(response.mockGenerated).toBe(true);
    expect(response.type).toBe('GENERATE_SONG');
    expect(response.id).toBeTruthy();
    expect(response.data).toBeDefined();
  });

  it('returns a response for EXPLAIN_SELECTION', async () => {
    const response = await sendPrompt('EXPLAIN_SELECTION', 'Explain this', {
      start: { sectionIndex: 0, barIndex: 0 },
      end: { sectionIndex: 0, barIndex: 1 },
    });
    expect(response.type).toBe('EXPLAIN_SELECTION');
    const data = response.data as { items: unknown[] };
    expect(Array.isArray(data.items)).toBe(true);
    expect(data.items.length).toBeGreaterThan(0);
  });

  it('returns alternatives for ALTERNATIVES', async () => {
    const response = await sendPrompt('ALTERNATIVES', 'Give alternatives', undefined);
    const data = response.data as { progressions: unknown[] };
    expect(Array.isArray(data.progressions)).toBe(true);
    expect(data.progressions).toHaveLength(3);
  });

  it('returns simplified chords for SIMPLIFY', async () => {
    const response = await sendPrompt('SIMPLIFY', 'Simplify', undefined);
    const data = response.data as { simplified: string[]; description: string };
    expect(Array.isArray(data.simplified)).toBe(true);
    expect(typeof data.description).toBe('string');
  });

  it('returns reharmonisation for REHARMONISE', async () => {
    const response = await sendPrompt('REHARMONISE', 'Reharmonise this', undefined);
    const data = response.data as { alternatives: string[][] };
    expect(Array.isArray(data.alternatives)).toBe(true);
  });

  it('returns alternatives for EDIT_LOCAL', async () => {
    const response = await sendPrompt('EDIT_LOCAL', 'Change these chords', undefined);
    const data = response.data as { alternatives: unknown[]; diff: unknown[]; changedRange: unknown };
    expect(Array.isArray(data.alternatives)).toBe(true);
    expect(data.alternatives).toHaveLength(3);
    expect(Array.isArray(data.diff)).toBe(true);
  });
});
