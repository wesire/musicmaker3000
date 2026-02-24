import type { Song, TransportState } from '../models/types';

export interface PlaybackEngine {
  play(song: Song, transport: TransportState): void;
  stop(): void;
  pause(): void;
  setTempo(bpm: number): void;
  onBeatChange(callback: (bar: number, beat: number) => void): void;
}

export class MockPlaybackEngine implements PlaybackEngine {
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private beatCallback: ((bar: number, beat: number) => void) | null = null;
  private currentBar = 0;
  private currentBeat = 1;
  private beatsPerBar = 4;
  private totalBars = 0;
  private bpm = 120;

  play(song: Song, transport: TransportState): void {
    this.stop();
    this.bpm = transport.tempo;
    this.currentBar = transport.currentBar;
    this.currentBeat = transport.currentBeat || 1;
    this.totalBars = song.sections.reduce((acc, s) => acc + s.bars.length, 0);
    this.beatsPerBar = song.timeSignature[0];

    const msPerBeat = (60 / this.bpm) * 1000;
    this.intervalId = setInterval(() => {
      this.beatCallback?.(this.currentBar, this.currentBeat);
      this.currentBeat++;
      if (this.currentBeat > this.beatsPerBar) {
        this.currentBeat = 1;
        this.currentBar++;
        if (this.currentBar >= this.totalBars) {
          this.currentBar = transport.loopEnabled ? (transport.loopStart ?? 0) : 0;
          if (!transport.loopEnabled) this.stop();
        }
      }
    }, msPerBeat);
  }

  stop(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.currentBar = 0;
    this.currentBeat = 1;
  }

  pause(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  setTempo(bpm: number): void {
    this.bpm = bpm;
  }

  onBeatChange(callback: (bar: number, beat: number) => void): void {
    this.beatCallback = callback;
  }
}

export const mockPlaybackEngine = new MockPlaybackEngine();
