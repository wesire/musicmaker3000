import type { Bar, ChordEvent, KeyContext, Project, Section, SectionType, Song } from './types';

export function createId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID().replace(/-/g, '').slice(0, 12);
  }
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function createChordEvent(beat: number, symbol: string, durationBeats: number = 1): ChordEvent {
  return { id: createId(), beat, durationBeats, symbol };
}

export function createBar(index: number, timeSignature: [number, number] = [4, 4]): Bar {
  return { id: createId(), index, timeSignature, chords: [] };
}

export function createSection(index: number, type: SectionType, label: string, barCount: number, timeSignature: [number, number] = [4, 4]): Section {
  const bars = Array.from({ length: barCount }, (_, i) => createBar(i, timeSignature));
  return { id: createId(), index, type, label, bars };
}

export function createSong(title: string, keyContext: KeyContext, tempo: number, sections: Section[]): Song {
  return {
    id: createId(),
    title,
    tempo,
    keyContext,
    timeSignature: [4, 4],
    sections,
  };
}

export function createProject(name: string, song: Song): Project {
  const now = new Date().toISOString();
  return {
    id: createId(),
    name,
    createdAt: now,
    updatedAt: now,
    songs: [song],
    currentSongId: song.id,
    versions: [],
    editHistory: [],
    promptHistory: [],
  };
}
