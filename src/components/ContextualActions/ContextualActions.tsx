import './ContextualActions.css';
import { usePromptStore } from '../../store/promptStore';
import { useProjectStore } from '../../store/projectStore';
import { useSelectionStore } from '../../store/selectionStore';

const EDIT_INTENTS = [
  { label: '⚡ Add Tension',    text: 'add tension to the selected bars' },
  { label: '✂️ Simplify',      text: 'simplify the selected bars' },
  { label: '☀️ Brighten',      text: 'brighten the selected bars' },
  { label: '🌑 Darken',        text: 'darken the selected bars' },
  { label: '🎨 Colorful',      text: 'more colorful chords in the selected bars' },
  { label: '〰️ Smoother',      text: 'smoother voice leading in the selected bars' },
] as const;

export default function ContextualActions() {
  const { openPromptPanel, submitPrompt } = usePromptStore();
  const { currentSong } = useProjectStore();
  const { selection, clearSelection } = useSelectionStore();

  async function handleEditIntent(intentText: string) {
    openPromptPanel('EDIT_LOCAL');
    await submitPrompt(intentText, selection ?? undefined, currentSong);
  }

  return (
    <div className="contextual-actions">
      <span className="contextual-label">Selection:</span>
      <button className="btn btn-secondary" onClick={() => openPromptPanel('EXPLAIN_SELECTION')}>
        💡 Explain
      </button>
      <button className="btn btn-secondary" onClick={() => openPromptPanel('REHARMONISE')}>
        🎼 Reharmonise
      </button>
      <button className="btn btn-secondary" onClick={() => openPromptPanel('SIMPLIFY')}>
        ✂️ Simplify
      </button>
      <button className="btn btn-secondary" onClick={() => openPromptPanel('ALTERNATIVES')}>
        🔀 Alternatives
      </button>
      <button className="btn btn-secondary" onClick={() => openPromptPanel('EDIT_LOCAL')}>
        ✏️ Edit Local
      </button>
      <div className="intent-row">
        {EDIT_INTENTS.map(({ label, text }) => (
          <button
            key={label}
            className="btn btn-ghost btn-xs"
            onClick={() => handleEditIntent(text)}
            title={text}
          >
            {label}
          </button>
        ))}
      </div>
      <button className="btn-icon" onClick={clearSelection} title="Clear selection">✕</button>
    </div>
  );
}
