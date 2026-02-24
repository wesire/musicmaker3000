import { useState } from 'react';
import './ExplanationPanel.css';
import { usePromptStore } from '../../store/promptStore';
import { useSelectionStore } from '../../store/selectionStore';
import { useProjectStore } from '../../store/projectStore';

export default function ExplanationPanel() {
  const { pendingExplanationResult, clearExplanationResult, submitPrompt, status } = usePromptStore();
  const { selection } = useSelectionStore();
  const { currentSong } = useProjectStore();
  const [followUp, setFollowUp] = useState('');
  const [collapsed, setCollapsed] = useState(false);

  if (!pendingExplanationResult) return null;

  const result = pendingExplanationResult;

  async function handleFollowUp() {
    if (!followUp.trim()) return;
    // Route follow-up text edits to EDIT_LOCAL so the rewrite engine can act on the
    // current selection.  This intentional routing is noted in KNOWN_LIMITATIONS.md.
    const { openPromptPanel } = usePromptStore.getState();
    openPromptPanel('EDIT_LOCAL');
    await submitPrompt(followUp, selection ?? undefined, currentSong);
    setFollowUp('');
  }

  return (
    <div className="explanation-panel">
      <div
        className="explanation-header"
        onClick={() => setCollapsed((c) => !c)}
        role="button"
        aria-expanded={!collapsed}
      >
        <span>💡 Harmonic Explanation</span>
        <div className="explanation-header-actions" onClick={(e) => e.stopPropagation()}>
          <button
            className="btn btn-ghost btn-xs"
            onClick={clearExplanationResult}
            title="Close explanation"
          >✕</button>
          <span aria-hidden>{collapsed ? '▼' : '▲'}</span>
        </div>
      </div>

      {!collapsed && (
        <div className="explanation-body">
          {/* Summary */}
          <div className="explanation-summary">{result.summary}</div>

          {/* Uncertainty notices */}
          {result.uncertaintyNotices.length > 0 && (
            <div className="explanation-uncertainty">
              {result.uncertaintyNotices.map((n, i) => (
                <div key={i} className="uncertainty-notice">⚠️ {n}</div>
              ))}
            </div>
          )}

          {/* Cadence explanation */}
          {result.cadenceExplanation && (
            <div className="explanation-cadence">🎵 {result.cadenceExplanation}</div>
          )}

          {/* Style fit */}
          {result.styleFit && (
            <div className="explanation-style-fit">✨ Style fit: {result.styleFit}</div>
          )}

          {/* Chord Breakdown */}
          {result.breakdown.length > 0 && (
            <details className="explanation-section">
              <summary className="explanation-section-title">Chord Breakdown</summary>
              <div className="breakdown-list">
                {result.breakdown.map((item, i) => (
                  <div key={i} className={`breakdown-item${item.uncertain ? ' uncertain' : ''}`}>
                    <div className="breakdown-chord-row">
                      <span className="breakdown-symbol">{item.symbol || '—'}</span>
                      <span className="breakdown-rn">{item.romanNumeral}</span>
                      <span className={`breakdown-fn fn-${item.harmonicFunction}`}>
                        {item.harmonicFunction}
                      </span>
                      {item.uncertain && <span className="breakdown-uncertain">?</span>}
                    </div>
                    <div className="breakdown-detail">{item.detail}</div>
                    {item.tensionRole && (
                      <div className="breakdown-tension">{item.tensionRole}</div>
                    )}
                    {item.connectionToNext && (
                      <div className="breakdown-connection">→ {item.connectionToNext}</div>
                    )}
                  </div>
                ))}
              </div>
            </details>
          )}

          {/* Substitution alternatives */}
          {result.substitutions.length > 0 && (
            <details className="explanation-section">
              <summary className="explanation-section-title">Suggested Alternatives</summary>
              <div className="substitution-list">
                {result.substitutions.map((sub) => (
                  <div key={sub.id} className={`substitution-item tag-${sub.tag}`}>
                    <div className="sub-header">
                      <span className="sub-symbol">{sub.substituteSymbol}</span>
                      <span className="sub-rn">{sub.substituteRomanNumeral}</span>
                      <span className={`sub-tag tag-${sub.tag}`}>{sub.tag}</span>
                    </div>
                    <div className="sub-rationale">{sub.rationale}</div>
                    <div className="sub-tradeoff">⚖️ {sub.tradeoff}</div>
                  </div>
                ))}
              </div>
            </details>
          )}

          {/* Follow-up edit input */}
          <div className="explanation-followup">
            <input
              className="followup-input"
              placeholder='Follow-up (e.g. "make this less tense")'
              value={followUp}
              onChange={(e) => setFollowUp(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleFollowUp(); }}
            />
            <button
              className="btn btn-ghost btn-xs"
              onClick={handleFollowUp}
              disabled={status === 'loading' || !followUp.trim()}
              title="Submit follow-up edit"
            >
              ▶
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
