import type { GenerationPrompt } from '../../models/types';

interface Props {
  prompts: GenerationPrompt[];
}

export default function PromptHistory({ prompts }: Props) {
  if (prompts.length === 0) return null;

  return (
    <div>
      <div style={{ fontSize: '0.75rem', color: '#606080', marginBottom: '4px' }}>History</div>
      <div className="prompt-history-list">
        {[...prompts].reverse().map((p) => (
          <div key={p.id} className="prompt-history-item">
            <div className={`history-status-dot ${p.status}`} />
            <span className="history-text">{p.text || '(no text)'}</span>
            <span className="history-type">{p.type.replace('_', ' ')}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
