import { describe, it, expect } from 'vitest';
import { parsePrompt } from '../services/promptParser';

describe('Prompt parsing', () => {
  it('parses a simple pop prompt correctly', () => {
    const c = parsePrompt('upbeat pop song, happy, simple chords');
    expect(c.raw).toContain('pop');
    expect(c.styles).toContain('pop');
    expect(c.moods).toContain('happy');
    expect(c.complexity).toBe('simple');
    expect(c.brightness).toBeGreaterThan(0);
    expect(c.beginnerFriendly).toBe(true);
  });

  it('parses a jazz prompt with complexity', () => {
    const c = parsePrompt('jazzy lush chord extensions with ninths and sevenths');
    expect(c.styles).toContain('jazz');
    expect(['complex', 'jazzy']).toContain(c.complexity);
    expect(c.colorVocab).toContain('jazzy');
  });

  it('parses a dark/moody prompt', () => {
    const c = parsePrompt('dark brooding minor rock, heavy energetic');
    expect(c.moods).toContain('dark');
    expect(c.brightness).toBeLessThan(0);
    expect(c.moods).toContain('energetic');
    expect(c.tension).toBeGreaterThan(0.3);
  });

  it('parses dreamy/ambient prompt', () => {
    const c = parsePrompt('dreamy ethereal floating ambient atmosphere');
    expect(c.styles).toContain('dreamy');
    expect(c.moods).toContain('calm');
    expect(c.tension).toBeLessThanOrEqual(0.3);
  });

  it('parses folk/acoustic prompt with beginner hint', () => {
    const c = parsePrompt('simple acoustic folk song, beginner-friendly');
    expect(c.styles).toContain('folk');
    expect(c.beginnerFriendly).toBe(true);
    expect(c.complexity).toBe('simple');
  });

  it('parses edit intent: add tension', () => {
    const c = parsePrompt('add tension to the selected bars, more suspense');
    expect(c.editIntent).toBe('add_tension');
  });

  it('parses edit intent: simplify', () => {
    const c = parsePrompt('simplify the chords, make it simpler');
    expect(c.editIntent).toBe('simplify');
  });

  it('parses edit intent: brighten', () => {
    const c = parsePrompt('brighten the progression, make it happier and lighter');
    expect(c.editIntent).toBe('brighten');
  });

  it('parses edit intent: darken', () => {
    const c = parsePrompt('darken the section, more minor feel, gloomier');
    expect(c.editIntent).toBe('darken');
  });

  it('parses edit intent: stronger lift', () => {
    const c = parsePrompt('stronger lift into chorus, more momentum');
    expect(c.editIntent).toBe('stronger_lift');
  });

  it('parses edit intent: less predictable', () => {
    const c = parsePrompt('less predictable cadence, surprising twist');
    expect(c.editIntent).toBe('less_predictable');
  });

  it('parses section-specific hints', () => {
    const c = parsePrompt('verse should be calm, chorus should be uplifting');
    expect(c.sectionHints?.verse).toBeDefined();
    expect(c.sectionHints?.chorus).toBeDefined();
  });

  it('stores raw text unmodified', () => {
    const text = 'My custom prompt text 123!';
    const c = parsePrompt(text);
    expect(c.raw).toBe(text);
  });

  it('defaults to moderate complexity when unspecified', () => {
    const c = parsePrompt('generate a song');
    expect(c.complexity).toBe('moderate');
  });

  it('brightness is within -1 to 1 range', () => {
    const c1 = parsePrompt('very dark brooding sinister ominous minor');
    const c2 = parsePrompt('very bright happy joyful cheerful upbeat major');
    expect(c1.brightness).toBeGreaterThanOrEqual(-1);
    expect(c1.brightness).toBeLessThanOrEqual(1);
    expect(c2.brightness).toBeGreaterThanOrEqual(-1);
    expect(c2.brightness).toBeLessThanOrEqual(1);
  });

  it('tension is within 0 to 1 range', () => {
    const c1 = parsePrompt('very calm peaceful serene gentle');
    const c2 = parsePrompt('very tense anxious unsettled suspenseful intense');
    expect(c1.tension).toBeGreaterThanOrEqual(0);
    expect(c1.tension).toBeLessThanOrEqual(1);
    expect(c2.tension).toBeGreaterThanOrEqual(0);
    expect(c2.tension).toBeLessThanOrEqual(1);
  });
});
