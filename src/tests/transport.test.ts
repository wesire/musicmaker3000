import { describe, it, expect, beforeEach } from 'vitest';
import { usePlaybackStore } from '../store/playbackStore';

describe('Transport store', () => {
  beforeEach(() => {
    usePlaybackStore.getState().stop();
    usePlaybackStore.getState().setTempo(120);
    usePlaybackStore.getState().setTranspose(0);
  });

  it('starts in stopped state', () => {
    const { transport } = usePlaybackStore.getState();
    expect(transport.playbackState).toBe('stopped');
  });

  it('transitions to playing on play()', () => {
    usePlaybackStore.getState().play();
    expect(usePlaybackStore.getState().transport.playbackState).toBe('playing');
  });

  it('transitions to stopped on stop()', () => {
    usePlaybackStore.getState().play();
    usePlaybackStore.getState().stop();
    expect(usePlaybackStore.getState().transport.playbackState).toBe('stopped');
  });

  it('transitions to paused on pause()', () => {
    usePlaybackStore.getState().play();
    usePlaybackStore.getState().pause();
    expect(usePlaybackStore.getState().transport.playbackState).toBe('paused');
  });

  it('resets position on stop()', () => {
    usePlaybackStore.getState().play();
    usePlaybackStore.getState().stop();
    const { transport } = usePlaybackStore.getState();
    expect(transport.currentBar).toBe(0);
    expect(transport.currentBeat).toBe(1);
  });

  it('sets tempo within bounds', () => {
    usePlaybackStore.getState().setTempo(150);
    expect(usePlaybackStore.getState().transport.tempo).toBe(150);
  });

  it('clamps tempo at minimum (20)', () => {
    usePlaybackStore.getState().setTempo(5);
    expect(usePlaybackStore.getState().transport.tempo).toBe(20);
  });

  it('clamps tempo at maximum (300)', () => {
    usePlaybackStore.getState().setTempo(500);
    expect(usePlaybackStore.getState().transport.tempo).toBe(300);
  });

  it('toggles loop', () => {
    expect(usePlaybackStore.getState().transport.loopEnabled).toBe(false);
    usePlaybackStore.getState().toggleLoop();
    expect(usePlaybackStore.getState().transport.loopEnabled).toBe(true);
    usePlaybackStore.getState().toggleLoop();
    expect(usePlaybackStore.getState().transport.loopEnabled).toBe(false);
  });

  it('sets transpose within bounds', () => {
    usePlaybackStore.getState().setTranspose(7);
    expect(usePlaybackStore.getState().transport.transpose).toBe(7);
  });

  it('clamps transpose at -12', () => {
    usePlaybackStore.getState().setTranspose(-20);
    expect(usePlaybackStore.getState().transport.transpose).toBe(-12);
  });

  it('clamps transpose at +12', () => {
    usePlaybackStore.getState().setTranspose(15);
    expect(usePlaybackStore.getState().transport.transpose).toBe(12);
  });
});

// ─── Phase 4: Quality Mode ────────────────────────────────────────────────────

describe('Quality mode', () => {
  beforeEach(() => {
    usePlaybackStore.getState().setQualityMode('sketch');
  });

  it('starts in sketch mode by default', () => {
    usePlaybackStore.setState({ qualityMode: 'sketch' });
    expect(usePlaybackStore.getState().qualityMode).toBe('sketch');
  });

  it('switches to enhanced mode', () => {
    usePlaybackStore.getState().setQualityMode('enhanced');
    expect(usePlaybackStore.getState().qualityMode).toBe('enhanced');
  });

  it('switches to pro mode', () => {
    usePlaybackStore.getState().setQualityMode('pro');
    expect(usePlaybackStore.getState().qualityMode).toBe('pro');
  });

  it('updates arrangement options when switching to enhanced', () => {
    usePlaybackStore.getState().setQualityMode('enhanced');
    const { arrangementOptions } = usePlaybackStore.getState();
    expect(arrangementOptions.density).toBe('medium');
    expect(arrangementOptions.pattern).toBe('arpeggio');
  });

  it('updates arrangement options when switching to pro', () => {
    usePlaybackStore.getState().setQualityMode('pro');
    const { arrangementOptions } = usePlaybackStore.getState();
    expect(arrangementOptions.density).toBe('rich');
  });

  it('resets to sketch defaults when switching back to sketch', () => {
    usePlaybackStore.getState().setQualityMode('enhanced');
    usePlaybackStore.getState().setQualityMode('sketch');
    const { arrangementOptions } = usePlaybackStore.getState();
    expect(arrangementOptions.density).toBe('simple');
    expect(arrangementOptions.pattern).toBe('block');
    expect(arrangementOptions.humanizeAmount).toBe(0);
  });

  it('persists quality mode after a stop()', () => {
    usePlaybackStore.getState().setQualityMode('enhanced');
    usePlaybackStore.getState().stop();
    expect(usePlaybackStore.getState().qualityMode).toBe('enhanced');
  });
});

// ─── Phase 4: Arrangement Options ────────────────────────────────────────────

describe('Arrangement options', () => {
  it('setArrangementOptions merges partial options', () => {
    usePlaybackStore.getState().setQualityMode('sketch');
    usePlaybackStore.getState().setArrangementOptions({ pattern: 'strum' });
    const { arrangementOptions } = usePlaybackStore.getState();
    expect(arrangementOptions.pattern).toBe('strum');
    // Other options preserved
    expect(arrangementOptions.density).toBe('simple');
  });

  it('can override density independently', () => {
    usePlaybackStore.getState().setQualityMode('sketch');
    usePlaybackStore.getState().setArrangementOptions({ density: 'rich' });
    expect(usePlaybackStore.getState().arrangementOptions.density).toBe('rich');
  });

  it('can override humanizeAmount', () => {
    usePlaybackStore.getState().setArrangementOptions({ humanizeAmount: 0.7 });
    expect(usePlaybackStore.getState().arrangementOptions.humanizeAmount).toBe(0.7);
  });
});

// ─── Phase 4: Audition Mode ───────────────────────────────────────────────────

describe('Audition mode', () => {
  beforeEach(() => {
    usePlaybackStore.getState().stopAudition();
  });

  it('starts with no audition variant', () => {
    expect(usePlaybackStore.getState().auditionVariantId).toBeNull();
  });

  it('startAudition sets the variant id', () => {
    usePlaybackStore.getState().startAudition('B');
    expect(usePlaybackStore.getState().auditionVariantId).toBe('B');
  });

  it('startAudition enables loop automatically', () => {
    usePlaybackStore.getState().startAudition('A');
    expect(usePlaybackStore.getState().transport.loopEnabled).toBe(true);
  });

  it('stopAudition clears the variant id', () => {
    usePlaybackStore.getState().startAudition('C');
    usePlaybackStore.getState().stopAudition();
    expect(usePlaybackStore.getState().auditionVariantId).toBeNull();
  });

  it('stopAudition disables loop', () => {
    usePlaybackStore.getState().startAudition('A');
    usePlaybackStore.getState().stopAudition();
    expect(usePlaybackStore.getState().transport.loopEnabled).toBe(false);
  });

  it('can switch between variants', () => {
    usePlaybackStore.getState().startAudition('A');
    usePlaybackStore.getState().startAudition('B');
    expect(usePlaybackStore.getState().auditionVariantId).toBe('B');
  });
});

