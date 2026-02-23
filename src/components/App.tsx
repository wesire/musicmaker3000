import { useEffect } from 'react';
import './App.css';
import ContextualActions from './ContextualActions/ContextualActions';
import ProjectCreator from './ProjectCreator/ProjectCreator';
import PromptFlow from './PromptFlow/PromptFlow';
import Timeline from './Timeline/Timeline';
import Transport from './Transport/Transport';
import VersionPanel from './VersionPanel/VersionPanel';
import { useProjectStore } from '../store/projectStore';
import { useSelectionStore } from '../store/selectionStore';

function App() {
  const { project, loadFromLocalStorage, saveToLocalStorage } = useProjectStore();
  const { selection } = useSelectionStore();

  useEffect(() => {
    loadFromLocalStorage();
  }, [loadFromLocalStorage]);

  if (!project) {
    return <ProjectCreator />;
  }

  return (
    <div className="app">
      <header className="app-header">
        <span className="app-title">🎵 MusicMaker3000</span>
        <span className="project-name">{project.name}</span>
        <div className="header-actions">
          <button className="btn btn-secondary btn-sm" onClick={saveToLocalStorage}>
            💾 Save
          </button>
          <button className="btn btn-ghost btn-sm" onClick={loadFromLocalStorage}>
            📂 Load
          </button>
        </div>
      </header>

      <main className="app-main">
        <div className="timeline-area">
          <Timeline />
        </div>
        <div className="right-panel">
          <PromptFlow />
          <VersionPanel />
        </div>
      </main>

      {selection && <ContextualActions />}
      <footer className="app-footer">
        <Transport />
      </footer>
    </div>
  );
}

export default App;
