import { useState } from 'react';
import './PromptFlow.css';
import PromptHistory from './PromptHistory';
import { usePromptStore } from '../../store/promptStore';
import { useProjectStore } from '../../store/projectStore';
import { useSelectionStore } from '../../store/selectionStore';
import type { AlternativeOption, SongAlternative } from '../../models/types';

export default function PromptFlow() {
  const {
    panelOpen, promptType, status, prompts,
    pendingGenerateSongResult, pendingEditLocalResult,
    openPromptPanel, submitPrompt, clearPrompts, clearPendingResults,
  } = usePromptStore();
  const { currentSong, applySongGeneration, applyLocalEdit } = useProjectStore();
  const { selection } = useSelectionStore();
  const [text, setText] = useState('');
  const [collapsed, setCollapsed] = useState(false);

  async function handleSubmit() {
    if (!text.trim() && promptType !== 'GENERATE_SONG') return;
    await submitPrompt(text || 'Generate', selection ?? undefined, currentSong);
    setText('');
  }

  function handleApplySong(song: typeof pendingGenerateSongResult extends null ? never : NonNullable<typeof pendingGenerateSongResult>['song']) {
    applySongGeneration(song, 'AI generated song');
    clearPendingResults();
  }

  function handleApplyLocalEdit(alt: AlternativeOption) {
    if (!pendingEditLocalResult) return;
    applyLocalEdit(pendingEditLocalResult.changedRange, alt.bars, `Local edit: ${alt.metadataTags.join(', ')}`);
    clearPendingResults();
  }

  const showGenerateSongResult = promptType === 'GENERATE_SONG' && pendingGenerateSongResult;
  const showEditLocalResult    = promptType === 'EDIT_LOCAL'    && pendingEditLocalResult;

  return (
    <div className="prompt-flow">
      <div className="prompt-flow-header" onClick={() => setCollapsed((c) => !c)}>
        <h3>🤖 AI Assistant</h3>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          {panelOpen && <span className="prompt-type-badge">{promptType.replace('_', ' ')}</span>}
          <span>{collapsed ? '▼' : '▲'}</span>
        </div>
      </div>

      {!collapsed && (
        <div className="prompt-flow-body">
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {(['GENERATE_SONG', 'EDIT_LOCAL'] as const).map((t) => (
              <button
                key={t}
                className={`btn btn-sm ${promptType === t && panelOpen ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => openPromptPanel(t)}
              >
                {t.replace('_', ' ')}
              </button>
            ))}
          </div>

          <div className="prompt-input-area">
            <textarea
              className="prompt-textarea"
              placeholder={`Describe what you want... (${promptType})`}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && e.ctrlKey) handleSubmit(); }}
            />
            <button
              className="prompt-submit-btn"
              disabled={status === 'loading'}
              onClick={handleSubmit}
            >
              {status === 'loading' ? '⏳ Thinking...' : '▶ Submit'}
            </button>
          </div>

          {status !== 'idle' && !showGenerateSongResult && !showEditLocalResult && (
            <div className={`prompt-status ${status}`}>
              {status === 'loading' && '⏳ Generating response...'}
              {status === 'success' && '✅ Response received'}
              {status === 'error' && '❌ Error generating response'}
            </div>
          )}

          {/* ── GENERATE_SONG result ── */}
          {showGenerateSongResult && (
            <div className="prompt-result">
              <div className="prompt-result-title">✅ Song generated — choose a variant to apply:</div>
              <div className="prompt-alternatives">
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => handleApplySong(pendingGenerateSongResult!.song)}
                >
                  ▶ Apply Primary
                </button>
                {pendingGenerateSongResult!.alternatives.map((alt: SongAlternative) => (
                  <button
                    key={alt.id}
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleApplySong(alt.song)}
                    title={alt.metadataTags.join(', ')}
                  >
                    Apply {alt.label} <span className="alt-tags">({alt.metadataTags.join(', ')})</span>
                  </button>
                ))}
                <button className="btn btn-ghost btn-sm" onClick={clearPendingResults}>Discard</button>
              </div>
            </div>
          )}

          {/* ── EDIT_LOCAL result ── */}
          {showEditLocalResult && (
            <div className="prompt-result">
              <div className="prompt-result-title">
                ✅ {pendingEditLocalResult!.alternatives.length} alternatives — pick one to apply:
              </div>
              {pendingEditLocalResult!.diff.length > 0 && (
                <div className="prompt-diff">
                  {pendingEditLocalResult!.diff.map((d, i) => (
                    <div key={i} className="diff-row">
                      §{d.sectionIndex + 1} Bar {d.barIndex + 1}:&nbsp;
                      <span className="diff-before">{d.before.map((c) => c.symbol).join(' ')}</span>
                      {' → '}
                      <span className="diff-after">{d.after.map((c) => c.symbol).join(' ')}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="prompt-alternatives">
                {pendingEditLocalResult!.alternatives.map((alt: AlternativeOption) => (
                  <button
                    key={alt.id}
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleApplyLocalEdit(alt)}
                    title={alt.metadataTags.join(', ')}
                  >
                    Apply {alt.label} <span className="alt-tags">({alt.metadataTags.join(', ')})</span>
                  </button>
                ))}
                <button className="btn btn-ghost btn-sm" onClick={clearPendingResults}>Discard</button>
              </div>
            </div>
          )}

          <PromptHistory prompts={prompts} />

          {prompts.length > 0 && (
            <button className="btn btn-ghost btn-sm" onClick={clearPrompts}>
              Clear History
            </button>
          )}
        </div>
      )}
    </div>
  );
}
