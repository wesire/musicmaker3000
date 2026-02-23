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
