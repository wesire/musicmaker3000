import './Transport.css';
import { usePlaybackStore } from '../../store/playbackStore';
import { useProjectStore } from '../../store/projectStore';
import { mockPlaybackEngine } from '../../services/playbackEngine';

export default function Transport() {
  const { transport, presets, activePresetId, play, stop, pause, setTempo, toggleLoop, setTranspose, setPreset } = usePlaybackStore();
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
  }

  return (
    <div className="transport">
      <div className="transport-section">
        <button className={`play-btn ${transport.playbackState === 'playing' ? 'pause' : 'play'}`} onClick={handlePlay}>
          {transport.playbackState === 'playing' ? '⏸' : '▶'}
        </button>
        <button className="play-btn stop" onClick={handleStop}>⏹</button>
      </div>

      <div className="transport-divider" />

      <div className="transport-section">
        <span className="transport-label">BPM</span>
        <button className="btn-icon" onClick={() => setTempo(transport.tempo - 1)}>−</button>
        <span className="transport-value">{transport.tempo}</span>
        <button className="btn-icon" onClick={() => setTempo(transport.tempo + 1)}>+</button>
      </div>

      <div className="transport-divider" />

      <div className="transport-section">
        <button
          className={`loop-btn${transport.loopEnabled ? ' active' : ''}`}
          onClick={toggleLoop}
        >
          🔁 Loop
        </button>
      </div>

      <div className="transport-divider" />

      <div className="transport-section">
        <span className="transport-label">Transpose</span>
        <button className="btn-icon" onClick={() => setTranspose(transport.transpose - 1)}>−</button>
        <span className="transport-value">{transport.transpose >= 0 ? '+' : ''}{transport.transpose}</span>
        <button className="btn-icon" onClick={() => setTranspose(transport.transpose + 1)}>+</button>
      </div>

      <div className="transport-divider" />

      <div className="transport-section">
        <span className="transport-label">Preset</span>
        <select
          className="preset-select"
          value={activePresetId}
          onChange={(e) => setPreset(e.target.value)}
        >
          {presets.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      <div className="transport-divider" />

      <div className="transport-section">
        <span className="transport-label">Bar</span>
        <span className="transport-value">{transport.currentBar + 1}</span>
        <span className="transport-label">Beat</span>
        <span className="transport-value">{transport.currentBeat}</span>
        <span className={`transport-label`} style={{ color: transport.playbackState === 'playing' ? '#60c080' : '#606080' }}>
          {transport.playbackState.toUpperCase()}
        </span>
      </div>
    </div>
  );
}
