import { createChordEvent, createId, createProject, createSection, createSong } from '../models/factories';
import type { AnalysisAnnotation, Project } from '../models/types';

function makeSimplePop(): Project {
  const verse = createSection(0, 'verse', 'Verse', 8);
  const popChords = ['C', 'G', 'Am', 'F'];
  verse.bars.forEach((bar, i) => {
    bar.chords = [createChordEvent(1, popChords[i % 4])];
  });

  const chorus = createSection(1, 'chorus', 'Chorus', 8);
  const chorusChords = ['F', 'C', 'G', 'Am'];
  chorus.bars.forEach((bar, i) => {
    bar.chords = [createChordEvent(1, chorusChords[i % 4])];
  });

  const song = createSong('Simple Pop Song', { root: 'C', mode: 'major' }, 120, [verse, chorus]);
  return createProject('Simple Pop', song);
}

function makeJazzColors(): Project {
  const intro = createSection(0, 'intro', 'Intro', 4);
  intro.bars.forEach((bar, i) => {
    const jazzIntro = ['Cmaj7', 'Am7', 'Dm7', 'G7'];
    bar.chords = [createChordEvent(1, jazzIntro[i % 4])];
  });

  const verse = createSection(1, 'verse', 'Verse', 8);
  const jazzVerse = ['Cmaj7', 'Am7', 'Dm7', 'G7', 'Em7', 'A7', 'Dm7', 'G7'];
  verse.bars.forEach((bar, i) => {
    bar.chords = [createChordEvent(1, jazzVerse[i % 8])];
  });

  const bridge = createSection(2, 'bridge', 'Bridge', 4);
  const jazzBridge = ['Fm7', 'Bb7', 'Ebmaj7', 'Ab7'];
  bridge.bars.forEach((bar, i) => {
    bar.chords = [createChordEvent(1, jazzBridge[i % 4])];
  });

  const song = createSong('Jazz Colors', { root: 'Bb', mode: 'major' }, 92, [intro, verse, bridge]);
  return createProject('Jazz Colors', song);
}

function makeMultiSectionRock(): Project {
  const sections = [
    createSection(0, 'intro', 'Intro', 4),
    createSection(1, 'verse', 'Verse', 8),
    createSection(2, 'prechorus', 'Pre-Chorus', 4),
    createSection(3, 'chorus', 'Chorus', 8),
    createSection(4, 'bridge', 'Bridge', 4),
    createSection(5, 'outro', 'Outro', 4),
  ];

  const rockChords = ['Em', 'C', 'G', 'D'];
  sections.forEach((section) => {
    section.bars.forEach((bar, i) => {
      bar.chords = [createChordEvent(1, rockChords[i % 4])];
    });
  });

  const song = createSong('Multi-Section Rock', { root: 'E', mode: 'minor' }, 140, sections);
  return createProject('Multi-Section Rock', song);
}

export const demoProjects: Record<string, Project> = {
  'Simple Pop': makeSimplePop(),
  'Jazz Colors': makeJazzColors(),
  'Multi-Section Rock': makeMultiSectionRock(),
};

export const demoAnnotations: AnalysisAnnotation[] = [
  {
    id: createId(),
    barPosition: { sectionIndex: 0, barIndex: 0 },
    label: 'Tonic',
    detail: 'Root chord of the key - strong sense of resolution',
  },
  {
    id: createId(),
    barPosition: { sectionIndex: 0, barIndex: 1 },
    label: 'Dominant',
    detail: 'Creates tension that wants to resolve back to tonic',
  },
  {
    id: createId(),
    barPosition: { sectionIndex: 0, barIndex: 2 },
    label: 'Submediant',
    detail: 'Relative minor - adds emotional colour',
  },
];
