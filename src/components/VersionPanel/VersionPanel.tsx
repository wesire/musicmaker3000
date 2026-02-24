import { useState } from 'react';
import './VersionPanel.css';
import { useProjectStore } from '../../store/projectStore';

export default function VersionPanel() {
  const { project, saveVersion, loadVersion } = useProjectStore();
  const [desc, setDesc] = useState('');
  const [collapsed, setCollapsed] = useState(false);

  if (!project) return null;

  function handleSave() {
    saveVersion(desc || undefined);
    setDesc('');
  }

  return (
    <div className="version-panel">
      <div className="version-panel-header" onClick={() => setCollapsed((c) => !c)}>
        <h3>📜 Versions</h3>
        <span>{collapsed ? '▼' : '▲'}</span>
      </div>

      {!collapsed && (
        <div className="version-panel-body">
          <div className="version-save-row">
            <input
              className="version-desc-input"
              placeholder="Version description..."
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
            />
            <button className="btn btn-primary btn-sm" onClick={handleSave}>
              Save
            </button>
          </div>

          <div className="version-list">
            {project.versions.length === 0 ? (
              <div className="no-versions">No versions saved yet</div>
            ) : (
              [...project.versions].reverse().map((v) => (
                <div key={v.id} className="version-item" onClick={() => loadVersion(v.id)}>
                  <span className="version-num">v{v.version}</span>
                  <div className="version-info">
                    <div className="version-desc">{v.description || 'No description'}</div>
                    <div className="version-time">{new Date(v.timestamp).toLocaleString()}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
