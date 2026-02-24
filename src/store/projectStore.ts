import { create } from 'zustand';
import { demoProjects } from '../fixtures/demoProjects';
import { createId } from '../models/factories';
import type { ChordEvent, EditOperation, KeyContext, Project, Section, Song, SongVersion } from '../models/types';
import { loadProject, saveProject } from '../services/persistenceService';

interface ProjectState {
  project: Project | null;
  currentSong: Song | null;
  setProject: (project: Project) => void;
  loadDemoProject: (name: string) => void;
  updateChord: (sectionIndex: number, barIndex: number, chord: ChordEvent) => void;
  addSection: (section: Section) => void;
  removeSection: (sectionIndex: number) => void;
  setTempo: (tempo: number) => void;
  setKey: (keyContext: KeyContext) => void;
  saveVersion: (description?: string) => void;
  loadVersion: (versionId: string) => void;
  saveToLocalStorage: () => void;
  loadFromLocalStorage: () => void;
  recordEditOperation: (op: EditOperation) => void;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  project: null,
  currentSong: null,

  setProject: (project) => {
    const currentSong = project.songs.find((s) => s.id === project.currentSongId) ?? project.songs[0] ?? null;
    set({ project, currentSong });
  },

  loadDemoProject: (name) => {
    const demo = demoProjects[name];
    if (demo) {
      // Create a fresh copy with new IDs to avoid shared references
      const fresh = JSON.parse(JSON.stringify(demo)) as Project;
      fresh.id = createId();
      const currentSong = fresh.songs[0] ?? null;
      if (currentSong) fresh.currentSongId = currentSong.id;
      set({ project: fresh, currentSong });
    }
  },

  updateChord: (sectionIndex, barIndex, chord) => {
    const { project } = get();
    if (!project) return;
    const song = project.songs.find((s) => s.id === project.currentSongId);
    if (!song) return;

    const newSections = song.sections.map((section, si) => {
      if (si !== sectionIndex) return section;
      return {
        ...section,
        bars: section.bars.map((bar, bi) => {
          if (bi !== barIndex) return bar;
          const existingIdx = bar.chords.findIndex((c) => c.id === chord.id);
          let newChords: ChordEvent[];
          if (existingIdx >= 0) {
            newChords = bar.chords.map((c) => (c.id === chord.id ? chord : c));
          } else {
            newChords = [...bar.chords, chord];
          }
          return { ...bar, chords: newChords };
        }),
      };
    });

    const updatedSong = { ...song, sections: newSections };
    const updatedProject = {
      ...project,
      songs: project.songs.map((s) => (s.id === song.id ? updatedSong : s)),
      updatedAt: new Date().toISOString(),
    };
    set({ project: updatedProject, currentSong: updatedSong });
  },

  addSection: (section) => {
    const { project } = get();
    if (!project) return;
    const song = project.songs.find((s) => s.id === project.currentSongId);
    if (!song) return;

    const updatedSong = { ...song, sections: [...song.sections, section] };
    const updatedProject = {
      ...project,
      songs: project.songs.map((s) => (s.id === song.id ? updatedSong : s)),
      updatedAt: new Date().toISOString(),
    };
    set({ project: updatedProject, currentSong: updatedSong });
  },

  removeSection: (sectionIndex) => {
    const { project } = get();
    if (!project) return;
    const song = project.songs.find((s) => s.id === project.currentSongId);
    if (!song) return;

    const updatedSong = {
      ...song,
      sections: song.sections.filter((_, i) => i !== sectionIndex),
    };
    const updatedProject = {
      ...project,
      songs: project.songs.map((s) => (s.id === song.id ? updatedSong : s)),
      updatedAt: new Date().toISOString(),
    };
    set({ project: updatedProject, currentSong: updatedSong });
  },

  setTempo: (tempo) => {
    const { project } = get();
    if (!project) return;
    const song = project.songs.find((s) => s.id === project.currentSongId);
    if (!song) return;

    const updatedSong = { ...song, tempo };
    const updatedProject = {
      ...project,
      songs: project.songs.map((s) => (s.id === song.id ? updatedSong : s)),
      updatedAt: new Date().toISOString(),
    };
    set({ project: updatedProject, currentSong: updatedSong });
  },

  setKey: (keyContext) => {
    const { project } = get();
    if (!project) return;
    const song = project.songs.find((s) => s.id === project.currentSongId);
    if (!song) return;

    const updatedSong = { ...song, keyContext };
    const updatedProject = {
      ...project,
      songs: project.songs.map((s) => (s.id === song.id ? updatedSong : s)),
      updatedAt: new Date().toISOString(),
    };
    set({ project: updatedProject, currentSong: updatedSong });
  },

  saveVersion: (description) => {
    const { project } = get();
    if (!project) return;
    const song = project.songs.find((s) => s.id === project.currentSongId);
    if (!song) return;

    const version: SongVersion = {
      id: createId(),
      songId: song.id,
      version: project.versions.length + 1,
      timestamp: new Date().toISOString(),
      song: JSON.parse(JSON.stringify(song)),
      description,
    };

    const updatedProject = {
      ...project,
      versions: [...project.versions, version],
      updatedAt: new Date().toISOString(),
    };
    set({ project: updatedProject });
  },

  loadVersion: (versionId) => {
    const { project } = get();
    if (!project) return;
    const version = project.versions.find((v) => v.id === versionId);
    if (!version) return;

    const restoredSong = JSON.parse(JSON.stringify(version.song)) as Song;
    const updatedProject = {
      ...project,
      songs: project.songs.map((s) => (s.id === restoredSong.id ? restoredSong : s)),
      updatedAt: new Date().toISOString(),
    };
    set({ project: updatedProject, currentSong: restoredSong });
  },

  saveToLocalStorage: () => {
    const { project } = get();
    if (project) saveProject(project);
  },

  loadFromLocalStorage: () => {
    const project = loadProject();
    if (project) {
      const currentSong = project.songs.find((s) => s.id === project.currentSongId) ?? project.songs[0] ?? null;
      set({ project, currentSong });
    }
  },

  recordEditOperation: (op) => {
    const { project } = get();
    if (!project) return;
    set({
      project: {
        ...project,
        editHistory: [...project.editHistory, op],
        updatedAt: new Date().toISOString(),
      },
    });
  },
}));
