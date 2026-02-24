import './OverlayControls.css';
import { useOverlayStore } from '../../store/overlayStore';
import type { OverlaySettings } from '../../models/types';

const OVERLAY_OPTIONS: { key: keyof OverlaySettings; label: string; icon: string }[] = [
  { key: 'showChordSymbols',    label: 'Chords',        icon: '🎵' },
  { key: 'showRomanNumerals',   label: 'Roman #',       icon: 'ⅳ' },
  { key: 'showFunctionTags',    label: 'Function',      icon: '⊕' },
  { key: 'showNashvilleNumbers', label: 'Nashville #',  icon: '#' },
  { key: 'showCadenceMarkers',  label: 'Cadences',      icon: '⟾' },
  { key: 'showSectionLabels',   label: 'Sections',      icon: '§' },
  { key: 'showKeyContext',      label: 'Key',           icon: '🔑' },
];

export default function OverlayControls() {
  const { settings, toggleOverlay } = useOverlayStore();

  return (
    <div className="overlay-controls" role="toolbar" aria-label="Educational overlays">
      <span className="overlay-label">Overlays:</span>
      {OVERLAY_OPTIONS.map(({ key, label, icon }) => (
        <button
          key={key}
          className={`overlay-toggle${settings[key] ? ' active' : ''}`}
          onClick={() => toggleOverlay(key)}
          title={`Toggle ${label}`}
          aria-pressed={settings[key]}
        >
          {icon} {label}
        </button>
      ))}
    </div>
  );
}
