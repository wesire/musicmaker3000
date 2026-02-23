import type { Project } from '../models/types';

const PROJECT_KEY = 'musicmaker3000_project';

export function saveProject(project: Project): void {
  try {
    localStorage.setItem(PROJECT_KEY, JSON.stringify(project));
  } catch {
    console.warn('Could not save project to localStorage');
  }
}

export function loadProject(): Project | null {
  try {
    const raw = localStorage.getItem(PROJECT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Project;
  } catch {
    console.warn('Could not load project from localStorage');
    return null;
  }
}

export function clearProject(): void {
  try {
    localStorage.removeItem(PROJECT_KEY);
  } catch {
    console.warn('Could not clear project from localStorage');
  }
}
