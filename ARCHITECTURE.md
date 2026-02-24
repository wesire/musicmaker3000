# MusicMaker3000 Architecture

## Tech Stack
- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Zustand** - State management
- **Vitest** - Testing framework
- **@testing-library/react** - Component testing

## Directory Structure
```
src/
  models/       # TypeScript types and factory functions
  fixtures/     # Demo project data + Phase 2 test fixtures
  services/     # Persistence, prompt parsing, harmonic generation, analysis, rewrite engine
  store/        # Zustand stores (project, selection, prompt, playback)
  components/   # React components
  tests/        # Test files and setup
```

## Phase 2: Harmonic Generation Engine

### Services

#### `promptParser.ts`
Converts free-text prompts into typed `PromptConstraints` objects via keyword matching.
- Extracts style tags (pop, jazz, rock, folk, dreamy, …)
- Extracts mood tags (happy, sad, energetic, calm, …)
- Infers harmonic complexity, brightness (-1–1), tension (0–1)
- Detects edit intents (add_tension, simplify, brighten, darken, …)
- Extracts section-specific hints

#### `analysisEngine.ts`
Produces machine-readable harmonic analysis for chord events.
- Maps chord symbols to Roman numerals relative to a `KeyContext`
- Assigns harmonic function (tonic / predominant / dominant / chromatic)
- Detects secondary dominants (V/V, V/vi, …)
- Detects borrowed / modal-mixture chords
- Detects cadence types (authentic, half, plagal, deceptive)
- Attaches confidence scores; marks uncertain chords

#### `harmonyGenerator.ts`
Rule-based chord progression generator.
- Supports all 7 modes: major, minor, dorian, mixolydian, phrygian, lydian, locrian
- Per-section-type patterns (intro, verse, pre-chorus, chorus, bridge, outro, solo)
- Three pattern variants per section: primary (A), smoother (B), colorful (C)
- Applies harmonic-minor convention (raised V in minor-family keys)
- Returns `GenerateSongResult`: primary song + B/C alternatives + `SectionAnalysis[]`

#### `rewriteEngine.ts`
Selection-aware local bar rewriter.
- Accepts a `SelectionRange` and rewrites only those bars
- Preserves all bars outside the selection exactly
- Intent-driven patterns for all 8 `EditIntent` values
- Returns `EditLocalResult`: 3 A/B/C `AlternativeOption[]` + `BarDiff[]`
- `applyAlternativeToBars()` applies replacement bars to a song immutably

### Data Model Additions (Phase 2)
- `PromptConstraints` — structured constraints parsed from free text
- `ChordAnalysis` — per-chord Roman numeral, function, borrowed/secondary tags, confidence
- `SectionAnalysis` — per-section analysis with cadence detection and rationale tags
- `AlternativeOption` — A/B/C bar replacement with metadata tags and analysis
- `SongAlternative` — A/B/C full-song variants for GENERATE_SONG
- `GenerateSongResult` / `EditLocalResult` — typed response data shapes
- `BarDiff` — before/after diff for changed bars

### Store Updates (Phase 2)
- `projectStore`: `applySongGeneration(song)`, `applyLocalEdit(selection, bars)`
- `promptStore`: `pendingGenerateSongResult`, `pendingEditLocalResult`, `clearPendingResults()`

### UI Flow (Phase 2)
1. User types a style/mood prompt and submits GENERATE_SONG
2. `PromptFlow` receives `GenerateSongResult` and shows **Apply Primary / Apply B / Apply C** buttons
3. User clicks Apply → `projectStore.applySongGeneration()` replaces current song (auto-saves version)
4. User selects bars and submits EDIT_LOCAL (or clicks an intent button in `ContextualActions`)
5. `PromptFlow` shows A/B/C alternatives with bar diff
6. User clicks Apply → `projectStore.applyLocalEdit()` replaces only selected bars (auto-saves version)
7. Revert is available via the Version Panel
