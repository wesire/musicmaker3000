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

## Phase 4: Playback Quality Upgrade & Arrangement/Voicing Engine

### Services

#### `voicingEngine.ts`
Pure, side-effect-free module that transforms symbolic `ChordEvent` data into
synthesis-ready `PlaybackNoteEvent` arrays.

- **`parseChordSymbol(symbol)`** — parses a chord symbol (e.g. `"F#m7"`, `"Bbmaj9"`) into a root semitone (0–11) and an interval set. Handles triads, 7th/9th/6th chords, sus2/sus4, dim, aug, half-dim, and slash chords.
- **`chordSymbolToMidiNotes(symbol, octaveBase, density, inversionPreference)`** — converts a chord symbol to MIDI note numbers (C4 = 60). Supports `simple` (≤3 notes), `medium` (≤4 notes), and `rich` (all tones) density levels, and `root`/`first`/`second`/`auto` inversion preferences.
- **`humanizeEvents(events, amount, seed)`** — applies deterministic timing and velocity variation. `amount=0` is a no-op; `amount=1` is maximum variation. Output is fully reproducible for the same seed.
- **`generateChordVoicing(chord, options, seed)`** — generates `PlaybackNoteEvent[]` for a single `ChordEvent` using the selected `ArrangementPattern`:
  - `block` — all notes simultaneously at chord beat
  - `arpeggio` — notes staggered evenly across the chord duration
  - `pad` — all notes sustained; root louder, upper voices quieter
  - `strum` — guitar-like rapid stagger (0.05-beat offset between strings)
  - `rhythmic` — syncopated pattern with multiple chord hits within the duration
- **`generateArrangement(bar, options)`** — generates an `ArrangementResult` for an entire `Bar`, combining all chord voicings. Deterministic: seed derived from bar id.
- **`DEFAULT_VOICING_OPTIONS`** — preset `VoicingOptions` for each quality mode (`sketch`, `enhanced`, `pro`).

### Data Model Additions (Phase 4)
- `ArrangementPattern` — `'block' | 'arpeggio' | 'pad' | 'strum' | 'rhythmic'`
- `VoicingDensity` — `'simple' | 'medium' | 'rich'`
- `PlaybackQualityMode` — `'sketch' | 'enhanced' | 'pro'`
- `VoicingOptions` — density, octaveBase, humanizeAmount, inversionPreference, pattern
- `PlaybackNoteEvent` — midiNote, startBeat, durationBeats, velocity
- `ArrangementResult` — barId, notes[], pattern, density

### Store Updates (Phase 4)
- `playbackStore`:
  - `qualityMode: PlaybackQualityMode` — current quality tier
  - `arrangementOptions: VoicingOptions` — active voicing/arrangement settings
  - `auditionVariantId: string | null` — variant (A/B/C) currently being auditionally previewed
  - `setQualityMode(mode)` — switches mode and updates `arrangementOptions` to mode defaults
  - `setArrangementOptions(opts)` — partial override of arrangement options
  - `startAudition(variantId)` — begins auditional preview; enables transport loop
  - `stopAudition()` — ends audition; disables loop
  - Updated preset list: Grand Piano, Electric Piano, Warm Pad, Soft Pluck, Synth Keys, String Ensemble

### UI Flow (Phase 4)
1. Transport footer now shows **Quality** mode buttons: `Sketch` / `Enhanced` / `Pro ✦`
   - Sketch: fast/lightweight, block chords, no humanization
   - Enhanced: richer voicings, arpeggio pattern, subtle humanization
   - Pro: placeholder for desktop/plugin backend — rich density, maximum humanization
2. **Pattern** dropdown selects arrangement pattern (Block/Arpeggio/Pad/Strum/Rhythmic)
3. **Density** dropdown overrides voicing density without changing the quality tier
4. When an audition variant is active, a **🎧 Auditioning X** badge is shown; loop is automatically enabled
5. Stopping transport during audition exits audition mode

### Pro-Audio Extension Points (Phase 4)

The following interfaces and hooks are defined for future desktop/plugin expansion.
**None of these have backend implementations yet** — they describe the intended integration surface.

#### Alternate Playback Backend
`PlaybackEngine` interface (in `services/playbackEngine.ts`) is the contract for all
playback backends. A native/desktop implementation would:
- Accept the same `Song` + `TransportState` + `VoicingOptions` parameters
- Route note events from `voicingEngine.generateArrangement()` to a real audio engine
- Implement `onBeatChange` for synchronized UI updates

#### Offline High-Quality Render Pipeline
An offline renderer would:
- Accept a `Song` + `VoicingOptions` and call `generateArrangement()` per bar
- Feed the resulting `PlaybackNoteEvent[]` to a sample-based or plugin engine
- Output a PCM buffer or audio file

#### Desktop/Hybrid Plugin Host Integration
- `PlaybackQualityMode = 'pro'` is the designated trigger for desktop plugin routing
- The UI already renders a `Pro ✦` button; the backend hook is a `setQualityMode('pro')` handler
- A desktop bridge would listen for `qualityMode === 'pro'` changes and activate the plugin host

#### Per-Track FX Chain Metadata (placeholder)
`ArrangementTrack` (already in `types.ts`) holds `id`, `name`, `instrument`, and `muted`.
Future phases can extend this with an `fxChain: FxChainDescriptor[]` field without
breaking existing consumers.

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
