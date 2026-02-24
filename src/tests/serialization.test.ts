import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createProject, createSection, createSong } from '../models/factories';
import { saveProject, loadProject } from '../services/persistenceService';

describe('Serialization round-trip', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('serializes and deserializes a project', () => {
    const song = createSong('Round Trip Song', { root: 'C', mode: 'major' }, 130, [
      createSection(0, 'verse', 'Verse', 4),
    ]);
    const project = createProject('Round Trip Project', song);

    saveProject(project);
    const loaded = loadProject();

    expect(loaded).not.toBeNull();
    expect(loaded!.id).toBe(project.id);
    expect(loaded!.name).toBe(project.name);
    expect(loaded!.songs[0].title).toBe(song.title);
    expect(loaded!.songs[0].sections[0].bars).toHaveLength(4);
  });

  it('returns null when nothing saved', () => {
    const result = loadProject();
    expect(result).toBeNull();
  });

  it('preserves nested chord data', () => {
    const section = createSection(0, 'chorus', 'Chorus', 2);
    section.bars[0].chords.push({ id: 'chord1', beat: 1, durationBeats: 2, symbol: 'Cmaj7' });

    const song = createSong('Chord Song', { root: 'C', mode: 'major' }, 120, [section]);
    const project = createProject('Chord Project', song);

    saveProject(project);
    const loaded = loadProject();

    expect(loaded!.songs[0].sections[0].bars[0].chords[0].symbol).toBe('Cmaj7');
  });
});
