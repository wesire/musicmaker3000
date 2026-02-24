import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { saveProject, loadProject, clearProject } from '../services/persistenceService';
import { createProject, createSong } from '../models/factories';

describe('Persistence service', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('saves and loads a project', () => {
    const song = createSong('Test', { root: 'C', mode: 'major' }, 120, []);
    const project = createProject('TestProject', song);

    saveProject(project);
    const loaded = loadProject();

    expect(loaded).not.toBeNull();
    expect(loaded!.name).toBe('TestProject');
  });

  it('returns null when no project saved', () => {
    expect(loadProject()).toBeNull();
  });

  it('clears the project from localStorage', () => {
    const song = createSong('Test', { root: 'C', mode: 'major' }, 120, []);
    const project = createProject('TestProject', song);
    saveProject(project);
    clearProject();
    expect(loadProject()).toBeNull();
  });

  it('overwrites previous save', () => {
    const song1 = createSong('Song1', { root: 'C', mode: 'major' }, 120, []);
    const project1 = createProject('Project1', song1);
    saveProject(project1);

    const song2 = createSong('Song2', { root: 'G', mode: 'minor' }, 140, []);
    const project2 = createProject('Project2', song2);
    saveProject(project2);

    const loaded = loadProject();
    expect(loaded!.name).toBe('Project2');
  });

  it('stores valid JSON', () => {
    const song = createSong('Test', { root: 'D', mode: 'dorian' }, 90, []);
    const project = createProject('JSONTest', song);
    saveProject(project);

    const raw = localStorage.getItem('musicmaker3000_project');
    expect(raw).not.toBeNull();
    expect(() => JSON.parse(raw!)).not.toThrow();
  });
});
