import { create } from 'zustand';
import type { PlaybackPreset, PlaybackQualityMode, TransportState, VoicingOptions } from '../models/types';
import { DEFAULT_VOICING_OPTIONS } from '../services/voicingEngine';

const DEFAULT_PRESETS: PlaybackPreset[] = [
  { id: 'piano',    name: 'Grand Piano',     instrumentType: 'keyboard', description: 'Bright acoustic grand piano — clear attack, natural decay' },
  { id: 'epiano',  name: 'Electric Piano',  instrumentType: 'keyboard', description: 'Warm Rhodes-style electric piano with subtle chorus' },
  { id: 'pad',     name: 'Warm Pad',        instrumentType: 'synth',    description: 'Lush, slow-attack synthesiser pad — great for sustained chords' },
  { id: 'pluck',   name: 'Soft Pluck',      instrumentType: 'strings',  description: 'Guitar-like plucked string with short release' },
  { id: 'synth',   name: 'Synth Keys',      instrumentType: 'synth',    description: 'Crisp percussive synth keyboard — cutting through the mix' },
  { id: 'strings', name: 'String Ensemble', instrumentType: 'orchestra', description: 'Lush string section for cinematic or orchestral arrangements' },
];

const DEFAULT_TRANSPORT: TransportState = {
  playbackState: 'stopped',
  currentBar: 0,
  currentBeat: 1,
  tempo: 120,
  loopEnabled: false,
  transpose: 0,
};

interface PlaybackStoreState {
  transport: TransportState;
  presets: PlaybackPreset[];
  activePresetId: string;
  /** Current playback quality tier. */
  qualityMode: PlaybackQualityMode;
  /** Voicing/arrangement options applied at the current quality level. */
  arrangementOptions: VoicingOptions;
  /** ID of the variant (A/B/C) currently being auditionally previewed, or null. */
  auditionVariantId: string | null;
  play: () => void;
  stop: () => void;
  pause: () => void;
  setTempo: (bpm: number) => void;
  toggleLoop: () => void;
  setLoopRange: (start: number, end: number) => void;
  setTranspose: (semitones: number) => void;
  setPreset: (presetId: string) => void;
  setCurrentPosition: (bar: number, beat: number) => void;
  /** Switch quality mode and update arrangement options to the mode's defaults. */
  setQualityMode: (mode: PlaybackQualityMode) => void;
  /** Override individual arrangement options without changing the quality mode. */
  setArrangementOptions: (opts: Partial<VoicingOptions>) => void;
  /** Begin auditional preview of an A/B/C variant; enables loop automatically. */
  startAudition: (variantId: string) => void;
  /** End auditional preview and restore transport to its previous loop state. */
  stopAudition: () => void;
}

export const usePlaybackStore = create<PlaybackStoreState>((set) => ({
  transport: DEFAULT_TRANSPORT,
  presets: DEFAULT_PRESETS,
  activePresetId: 'piano',
  qualityMode: 'sketch',
  arrangementOptions: DEFAULT_VOICING_OPTIONS['sketch'],
  auditionVariantId: null,

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

  setQualityMode: (mode) => set({
    qualityMode: mode,
    arrangementOptions: DEFAULT_VOICING_OPTIONS[mode],
  }),

  setArrangementOptions: (opts) => set((state) => ({
    arrangementOptions: { ...state.arrangementOptions, ...opts },
  })),

  startAudition: (variantId) => set((state) => ({
    auditionVariantId: variantId,
    transport: { ...state.transport, loopEnabled: true },
  })),

  stopAudition: () => set((state) => ({
    auditionVariantId: null,
    transport: { ...state.transport, loopEnabled: false },
  })),
}));
