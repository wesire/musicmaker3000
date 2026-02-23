import { useState } from 'react';
import './PromptFlow.css';
import PromptHistory from './PromptHistory';
import { usePromptStore } from '../../store/promptStore';
import { useSelectionStore } from '../../store/selectionStore';

export default function PromptFlow() {
  const { panelOpen, promptType, status, activePrompt, prompts, openPromptPanel, submitPrompt, clearPrompts } = usePromptStore();
  const { selection } = useSelectionStore();
  const [text, setText] = useState('');
  const [collapsed, setCollapsed] = useState(false);

  async function handleSubmit() {
    if (!text.trim() && promptType !== 'GENERATE_SONG') return;
    await submitPrompt(text || 'Generate', selection ?? undefined);
    setText('');
  }

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

          {status !== 'idle' && (
            <div className={`prompt-status ${status}`}>
              {status === 'loading' && '⏳ Generating response...'}
              {status === 'success' && '✅ Response received'}
              {status === 'error' && '❌ Error generating response'}
            </div>
          )}

          {activePrompt?.response && (
            <div className="prompt-response">
              {JSON.stringify(activePrompt.response.data, null, 2)}
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
