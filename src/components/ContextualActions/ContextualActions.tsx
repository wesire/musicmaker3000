import './ContextualActions.css';
import { usePromptStore } from '../../store/promptStore';
import { useSelectionStore } from '../../store/selectionStore';

export default function ContextualActions() {
  const { openPromptPanel } = usePromptStore();
  const { clearSelection } = useSelectionStore();

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
      <button className="btn-icon" onClick={clearSelection} title="Clear selection">✕</button>
    </div>
  );
}
