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

## Phase 3: Explainable Harmony & Educational Overlays

### Services

#### `explanationEngine.ts`
Grounded explanation generator for selected bar ranges.
- Consumes computed `SectionAnalysis` from `analysisEngine.ts` — never fabricates certainty
- Produces `ExplanationResult`: summary, per-chord breakdown, style fit, cadence explanation, substitutions, uncertainty notices
- Per-chord `ExplanationBreakdownItem`: Roman numeral, harmonic function, detail, tension/release role, connection-to-next annotation
- Substitution alternatives: lighter/diatonic, richer (extensions), smoother (voice-leading) options with rationale and tradeoff
- Uncertainty surfaced honestly: flags chords with `uncertain=true` or confidence < 0.7 in `uncertaintyNotices[]`
- Style fit reasoning derived from `PromptConstraints` tags (pop, jazz, folk, dreamy, etc.)

### Data Model Additions (Phase 3)
- `ExplanationBreakdownItem` — per-chord explanation: Roman numeral, function, detail, tension role, connection
- `SubstitutionOption` — alternative chord with tag (`lighter`/`richer`/`smoother`/`standard`), rationale, tradeoff
- `ExplanationResult` — full explanation output: summary, breakdown[], styleFit?, cadenceExplanation?, substitutions[], uncertaintyNotices[]
- `OverlaySettings` — boolean flags for all educational overlay types

### Store Updates (Phase 3)
- `promptStore`: `pendingExplanationResult`, `clearExplanationResult()`
- `overlayStore`: `settings: OverlaySettings`, `toggleOverlay(key)`, `setOverlay(key, value)`

### UI Flow (Phase 3)
1. User selects bars/chords in the timeline
2. **ContextualActions** toolbar appears; clicking **💡 Explain** immediately submits to the explanation engine
3. **ExplanationPanel** appears in the right panel with grounded harmonic analysis:
   - Summary (progression, key, cadence type, style fit)
   - Per-chord breakdown (Roman numeral, function, tension role, connections)
   - Suggested alternatives (lighter/richer/smoother) with rationale and tradeoffs
   - Uncertainty notices when analysis is ambiguous
4. Follow-up edits (e.g. "make this less tense") can be submitted directly in the panel — routed to `EDIT_LOCAL`
5. **OverlayControls** toolbar in the timeline toggles educational annotations:
   - Roman numerals and Nashville numbers per chord (computed inline via `analyzeChord`)
   - Harmonic function tags per chord (T/P/D/C)
   - Cadence markers at end of phrases (authentic, half, plagal, deceptive)
   - Section labels and per-section key context
6. Alternatives (Apply A/B/C) integrate with the existing apply/revert/versioning workflow
