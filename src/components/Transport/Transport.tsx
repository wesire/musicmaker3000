import './Transport.css';
import { usePlaybackStore } from '../../store/playbackStore';
import { useProjectStore } from '../../store/projectStore';
import { mockPlaybackEngine } from '../../services/playbackEngine';
import type { ArrangementPattern, PlaybackQualityMode, VoicingDensity } from '../../models/types';

const QUALITY_MODES: { id: PlaybackQualityMode; label: string; title: string }[] = [
  { id: 'sketch',   label: 'Sketch',   title: 'Fast/lightweight — block chords, no humanization' },
  { id: 'enhanced', label: 'Enhanced', title: 'Richer voicings, humanization and arpeggio patterns' },
  { id: 'pro',      label: 'Pro ✦',    title: 'Pro-audio placeholder — full voicing density, rich patterns (desktop/plugin backend required)' },
];

const PATTERNS: { id: ArrangementPattern; label: string }[] = [
  { id: 'block',    label: 'Block'    },
  { id: 'arpeggio', label: 'Arpeggio' },
  { id: 'pad',      label: 'Pad'      },
  { id: 'strum',    label: 'Strum'    },
  { id: 'rhythmic', label: 'Rhythmic' },
];

const DENSITIES: { id: VoicingDensity; label: string }[] = [
  { id: 'simple', label: 'Simple' },
  { id: 'medium', label: 'Medium' },
  { id: 'rich',   label: 'Rich'   },
];

export default function Transport() {
  const {
    transport, presets, activePresetId,
    qualityMode, arrangementOptions, auditionVariantId,
    play, stop, pause, setTempo, toggleLoop, setTranspose,
    setPreset, setQualityMode, setArrangementOptions, stopAudition,
  } = usePlaybackStore();
  const { currentSong } = useProjectStore();

  function handlePlay() {
    if (transport.playbackState === 'playing') {
      pause();
      mockPlaybackEngine.pause();
    } else {
      play();
      if (currentSong) {
        mockPlaybackEngine.play(currentSong, transport);
      }
    }
  }

  function handleStop() {
    stop();
    mockPlaybackEngine.stop();
    if (auditionVariantId) stopAudition();
  }

  return (
    <div className="transport">
      {/* ── Playback controls ── */}
      <div className="transport-section">
        <button className={`play-btn ${transport.playbackState === 'playing' ? 'pause' : 'play'}`} onClick={handlePlay}>
          {transport.playbackState === 'playing' ? '⏸' : '▶'}
        </button>
        <button className="play-btn stop" onClick={handleStop}>⏹</button>
      </div>

      <div className="transport-divider" />

      {/* ── BPM ── */}
      <div className="transport-section">
        <span className="transport-label">BPM</span>
        <button className="btn-icon" onClick={() => setTempo(transport.tempo - 1)}>−</button>
        <span className="transport-value">{transport.tempo}</span>
        <button className="btn-icon" onClick={() => setTempo(transport.tempo + 1)}>+</button>
      </div>

      <div className="transport-divider" />

      {/* ── Loop ── */}
      <div className="transport-section">
        <button
          className={`loop-btn${transport.loopEnabled ? ' active' : ''}`}
          onClick={toggleLoop}
        >
          🔁 Loop
        </button>
      </div>

      <div className="transport-divider" />

      {/* ── Transpose ── */}
      <div className="transport-section">
        <span className="transport-label">Transpose</span>
        <button className="btn-icon" onClick={() => setTranspose(transport.transpose - 1)}>−</button>
        <span className="transport-value">{transport.transpose >= 0 ? '+' : ''}{transport.transpose}</span>
        <button className="btn-icon" onClick={() => setTranspose(transport.transpose + 1)}>+</button>
      </div>

      <div className="transport-divider" />

      {/* ── Preset ── */}
      <div className="transport-section">
        <span className="transport-label">Preset</span>
        <select
          className="preset-select"
          value={activePresetId}
          onChange={(e) => setPreset(e.target.value)}
        >
          {presets.map((p) => (
            <option key={p.id} value={p.id} title={p.description}>{p.name}</option>
          ))}
        </select>
      </div>

      <div className="transport-divider" />

      {/* ── Quality Mode ── */}
      <div className="transport-section">
        <span className="transport-label">Quality</span>
        {QUALITY_MODES.map(({ id, label, title }) => (
          <button
            key={id}
            className={`quality-btn${qualityMode === id ? ' active' : ''}${id === 'pro' ? ' pro' : ''}`}
            onClick={() => setQualityMode(id)}
            title={title}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="transport-divider" />

      {/* ── Arrangement Pattern ── */}
      <div className="transport-section">
        <span className="transport-label">Pattern</span>
        <select
          className="preset-select"
          value={arrangementOptions.pattern}
          onChange={(e) => setArrangementOptions({ pattern: e.target.value as ArrangementPattern })}
        >
          {PATTERNS.map(({ id, label }) => (
            <option key={id} value={id}>{label}</option>
          ))}
        </select>
      </div>

      {/* ── Voicing Density ── */}
      <div className="transport-section">
        <span className="transport-label">Density</span>
        <select
          className="preset-select"
          value={arrangementOptions.density}
          onChange={(e) => setArrangementOptions({ density: e.target.value as VoicingDensity })}
        >
          {DENSITIES.map(({ id, label }) => (
            <option key={id} value={id}>{label}</option>
          ))}
        </select>
      </div>

      <div className="transport-divider" />

      {/* ── Audition badge ── */}
      {auditionVariantId && (
        <>
          <div className="transport-section">
            <span className="audition-badge">🎧 Auditioning {auditionVariantId}</span>
            <button className="btn-icon" onClick={stopAudition} title="Stop audition">✕</button>
          </div>
          <div className="transport-divider" />
        </>
      )}

      {/* ── Position / status ── */}
      <div className="transport-section">
        <span className="transport-label">Bar</span>
        <span className="transport-value">{transport.currentBar + 1}</span>
        <span className="transport-label">Beat</span>
        <span className="transport-value">{transport.currentBeat}</span>
        <span className={`transport-label transport-status--${transport.playbackState}`}>
          {transport.playbackState.toUpperCase()}
        </span>
      </div>
    </div>
  );
}
