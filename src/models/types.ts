// Positional
export interface BarPosition { sectionIndex: number; barIndex: number; beat?: number; }
export interface SelectionRange { start: BarPosition; end: BarPosition; }

// Key
export type NoteKey = 'C'|'C#'|'Db'|'D'|'D#'|'Eb'|'E'|'F'|'F#'|'Gb'|'G'|'G#'|'Ab'|'A'|'A#'|'Bb'|'B';
export type Mode = 'major'|'minor'|'dorian'|'mixolydian'|'phrygian'|'lydian'|'locrian';
export interface KeyContext { root: NoteKey; mode: Mode; }

// Chord
export interface ChordEvent { id: string; beat: number; durationBeats: number; symbol: string; notes?: string[]; }

// Bar
export interface Bar { id: string; index: number; timeSignature: [number, number]; chords: ChordEvent[]; }

// Section
export type SectionType = 'verse'|'chorus'|'bridge'|'intro'|'outro'|'prechorus'|'solo'|'custom';
export interface Section { id: string; index: number; type: SectionType; label: string; bars: Bar[]; keyContext?: KeyContext; }

// Song
export interface Song { id: string; title: string; tempo: number; keyContext: KeyContext; timeSignature: [number, number]; sections: Section[]; }

// SongVersion
export interface SongVersion { id: string; songId: string; version: number; timestamp: string; song: Song; description?: string; }

// EditOperation
export type EditOperationType = 'SET_CHORD'|'DELETE_CHORD'|'ADD_BAR'|'REMOVE_BAR'|'ADD_SECTION'|'REMOVE_SECTION'|'SET_TEMPO'|'SET_KEY';
export interface EditOperation { id: string; type: EditOperationType; timestamp: string; selection?: SelectionRange; payload: unknown; }

// Prompt types
export type PromptType = 'GENERATE_SONG'|'EDIT_LOCAL'|'EXPLAIN_SELECTION'|'REHARMONISE'|'SIMPLIFY'|'ALTERNATIVES';
export type RequestStatus = 'idle'|'loading'|'success'|'error';
export interface GenerationPrompt { id: string; type: PromptType; text: string; selection?: SelectionRange; timestamp: string; status: RequestStatus; response?: PromptResponse; }
export interface PromptResponse { id: string; promptId: string; type: PromptType; data: unknown; mockGenerated: boolean; }

// Playback
export type PlaybackState = 'stopped'|'playing'|'paused';
export interface TransportState { playbackState: PlaybackState; currentBar: number; currentBeat: number; tempo: number; loopEnabled: boolean; loopStart?: number; loopEnd?: number; transpose: number; }
export interface PlaybackPreset { id: string; name: string; instrumentType: string; description: string; }

// Annotations
export interface AnalysisAnnotation { id: string; barPosition: BarPosition; label: string; detail: string; }
export interface ExplanationItem { id: string; barPosition: BarPosition; text: string; category: string; }
export interface AlternativeSuggestion { id: string; barPosition: BarPosition; alternatives: ChordEvent[][]; }

// ArrangementTrack
export interface ArrangementTrack { id: string; name: string; instrument: string; muted: boolean; }

// EditPrompt
export interface EditPrompt { id: string; promptId: string; selection: SelectionRange; type: PromptType; text: string; }

// Project
export interface Project { id: string; name: string; createdAt: string; updatedAt: string; songs: Song[]; currentSongId: string; versions: SongVersion[]; editHistory: EditOperation[]; promptHistory: GenerationPrompt[]; }
