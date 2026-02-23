import { useState } from 'react';
import './ProjectCreator.css';
import { createProject, createSection, createSong } from '../../models/factories';
import type { KeyContext, Mode, NoteKey } from '../../models/types';
import { useProjectStore } from '../../store/projectStore';

const TEMPLATES = [
  { id: 'simple-pop', name: 'Simple Pop', desc: '2 sections, C major, 120bpm' },
  { id: 'jazz-colors', name: 'Jazz Colors', desc: '3 sections, Bb major, 92bpm' },
  { id: 'multi-rock', name: 'Multi-Section Rock', desc: '6 sections, E minor, 140bpm' },
  { id: 'blank', name: 'Blank', desc: 'Start from scratch' },
];

const NOTE_KEYS: NoteKey[] = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const MODES: Mode[] = ['major', 'minor', 'dorian', 'mixolydian', 'phrygian', 'lydian', 'locrian'];

export default function ProjectCreator() {
  const { setProject, loadDemoProject } = useProjectStore();
  const [name, setName] = useState('My Project');
  const [root, setRoot] = useState<NoteKey>('C');
  const [mode, setMode] = useState<Mode>('major');
  const [tempo, setTempo] = useState(120);
  const [template, setTemplate] = useState('simple-pop');

  function handleCreate() {
    if (template === 'simple-pop') {
      loadDemoProject('Simple Pop');
      return;
    }
    if (template === 'jazz-colors') {
      loadDemoProject('Jazz Colors');
      return;
    }
    if (template === 'multi-rock') {
      loadDemoProject('Multi-Section Rock');
      return;
    }
    // blank
    const keyContext: KeyContext = { root, mode };
    const verse = createSection(0, 'verse', 'Verse', 8);
    const song = createSong(name, keyContext, tempo, [verse]);
    const project = createProject(name, song);
    setProject(project);
  }

  return (
    <div className="project-creator-overlay">
      <div className="project-creator">
        <h1>🎵 MusicMaker3000</h1>
        <p className="subtitle">Create a new project to get started</p>

        <div className="form-group">
          <label>Project Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="My Project" />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Key</label>
            <select value={root} onChange={(e) => setRoot(e.target.value as NoteKey)}>
              {NOTE_KEYS.map((k) => <option key={k} value={k}>{k}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Mode</label>
            <select value={mode} onChange={(e) => setMode(e.target.value as Mode)}>
              {MODES.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Tempo</label>
            <input type="number" value={tempo} min={20} max={300} onChange={(e) => setTempo(Number(e.target.value))} />
          </div>
        </div>

        <div className="form-group">
          <label>Template</label>
        </div>
        <div className="template-grid">
          {TEMPLATES.map((t) => (
            <div
              key={t.id}
              className={`template-card${template === t.id ? ' selected' : ''}`}
              onClick={() => setTemplate(t.id)}
            >
              <h3>{t.name}</h3>
              <p>{t.desc}</p>
            </div>
          ))}
        </div>

        <button className="create-btn" onClick={handleCreate}>
          Create Project
        </button>
      </div>
    </div>
  );
}
