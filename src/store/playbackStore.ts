import { create } from 'zustand';
import type { PlaybackPreset, TransportState } from '../models/types';

const DEFAULT_PRESETS: PlaybackPreset[] = [
  { id: 'piano', name: 'Piano', instrumentType: 'keyboard', description: 'Classic piano sound' },
  { id: 'guitar', name: 'Acoustic Guitar', instrumentType: 'strings', description: 'Acoustic guitar strumming' },
  { id: 'organ', name: 'Organ', instrumentType: 'keyboard', description: 'Classic organ sound' },
  { id: 'strings', name: 'Strings', instrumentType: 'orchestra', description: 'String ensemble' },
];

const DEFAULT_TRANSPORT: TransportState = {
  playbackState: 'stopped',
  currentBar: 0,
  currentBeat: 1,
  tempo: 120,
  loopEnabled: false,
  transpose: 0,
};

interface PlaybackState {
  transport: TransportState;
  presets: PlaybackPreset[];
  activePresetId: string;
  play: () => void;
  stop: () => void;
  pause: () => void;
  setTempo: (bpm: number) => void;
  toggleLoop: () => void;
  setLoopRange: (start: number, end: number) => void;
  setTranspose: (semitones: number) => void;
  setPreset: (presetId: string) => void;
  setCurrentPosition: (bar: number, beat: number) => void;
}

export const usePlaybackStore = create<PlaybackState>((set) => ({
  transport: DEFAULT_TRANSPORT,
  presets: DEFAULT_PRESETS,
  activePresetId: 'piano',

  play: () => set((state) => ({ transport: { ...state.transport, playbackState: 'playing' } })),
  stop: () => set((state) => ({ transport: { ...state.transport, playbackState: 'stopped', currentBar: 0, currentBeat: 1 } })),
  pause: () => set((state) => ({ transport: { ...state.transport, playbackState: 'paused' } })),

  setTempo: (bpm) => {
    const clamped = Math.min(300, Math.max(20, bpm));
    set((state) => ({ transport: { ...state.transport, tempo: clamped } }));
  },

  toggleLoop: () => set((state) => ({
    transport: { ...state.transport, loopEnabled: !state.transport.loopEnabled },
  })),

  setLoopRange: (start, end) => set((state) => ({
    transport: { ...state.transport, loopStart: start, loopEnd: end },
  })),

  setTranspose: (semitones) => {
    const clamped = Math.min(12, Math.max(-12, semitones));
    set((state) => ({ transport: { ...state.transport, transpose: clamped } }));
  },

  setPreset: (presetId) => set({ activePresetId: presetId }),

  setCurrentPosition: (bar, beat) => set((state) => ({
    transport: { ...state.transport, currentBar: bar, currentBeat: beat },
  })),
}));
