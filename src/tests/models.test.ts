import { describe, it, expect } from 'vitest';
import { createBar, createChordEvent, createProject, createSection, createSong } from '../models/factories';

describe('Model factories', () => {
  it('creates a bar with correct defaults', () => {
    const bar = createBar(0);
    expect(bar.index).toBe(0);
    expect(bar.timeSignature).toEqual([4, 4]);
    expect(bar.chords).toEqual([]);
    expect(bar.id).toBeTruthy();
  });

  it('creates a bar with custom time signature', () => {
    const bar = createBar(2, [3, 4]);
    expect(bar.timeSignature).toEqual([3, 4]);
    expect(bar.index).toBe(2);
  });

  it('creates a section with correct number of bars', () => {
    const section = createSection(0, 'verse', 'Verse', 8);
    expect(section.bars).toHaveLength(8);
    expect(section.type).toBe('verse');
    expect(section.label).toBe('Verse');
    expect(section.index).toBe(0);
  });

  it('creates a song with sections', () => {
    const sections = [createSection(0, 'verse', 'Verse', 4)];
    const song = createSong('Test Song', { root: 'C', mode: 'major' }, 120, sections);
    expect(song.title).toBe('Test Song');
    expect(song.tempo).toBe(120);
    expect(song.keyContext).toEqual({ root: 'C', mode: 'major' });
    expect(song.sections).toHaveLength(1);
  });

  it('creates a project with a song', () => {
    const song = createSong('My Song', { root: 'G', mode: 'minor' }, 100, []);
    const project = createProject('My Project', song);
    expect(project.name).toBe('My Project');
    expect(project.songs).toHaveLength(1);
    expect(project.currentSongId).toBe(song.id);
    expect(project.versions).toEqual([]);
    expect(project.editHistory).toEqual([]);
    expect(project.promptHistory).toEqual([]);
  });

  it('creates a chord event', () => {
    const chord = createChordEvent(1, 'Am7', 2);
    expect(chord.beat).toBe(1);
    expect(chord.symbol).toBe('Am7');
    expect(chord.durationBeats).toBe(2);
    expect(chord.id).toBeTruthy();
  });

  it('chord event has default duration of 1', () => {
    const chord = createChordEvent(2, 'G');
    expect(chord.durationBeats).toBe(1);
  });
});
