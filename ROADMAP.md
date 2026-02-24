# MusicMaker3000 — Roadmap

## Strategy: Web-First with Pro-Audio Desktop Expansion

MusicMaker3000 is a **web-first** songwriting tool. The primary goal is to make
harmonic creativity fast and frictionless in the browser. Desktop/DAW integration
is a deliberate second-tier expansion — designed not to complicate the web UX.

---

## Completed Phases

### Phase 1 — Core Editor
- Song / section / bar / chord data model
- Timeline editor (chord entry, section management)
- Mock transport (play/pause/stop, BPM, loop, transpose)
- Version history and persistence (localStorage)

### Phase 2 — Harmonic Generation Engine
- Rule-based chord progression generator (7 modes, all section types)
- A/B/C alternative generation
- Prompt parser (style, mood, harmonic complexity tags)
- Analysis engine (Roman numerals, harmonic function, secondary dominants, borrowing)
- Local bar rewrite engine (intent-driven: tension, simplify, brighten, etc.)

### Phase 3 — Explainable Harmony & Educational Overlays
- Grounded explanation engine (per-chord breakdown, substitution alternatives)
- Harmonic overlay controls (Roman numerals, function tags, cadence markers)
- Follow-up edit flow in the explanation panel

### Phase 4 — Playback Quality Upgrade & Arrangement Engine
- Voicing engine: chord symbol → MIDI note events
- Arrangement patterns: block, arpeggio, pad, strum, rhythmic
- Voicing density: simple / medium / rich
- Humanization (deterministic, seeded)
- Playback quality modes: Sketch / Enhanced / Pro (placeholder)
- Audition workflow: start/stop variant preview, auto-loop
- Improved built-in presets (Grand Piano, Electric Piano, Warm Pad, Soft Pluck, Synth Keys, Strings)
- Pro-audio extension points documented in ARCHITECTURE.md

---

## Near-Term (Phase 5 Candidates)

### Web Audio Playback Integration
- Wire `voicingEngine.generateArrangement()` output to a real Web Audio graph
- Sample-based instruments: piano (SFZ/SF2 or custom Web Audio), pad, pluck
- Beat-accurate scheduling using `AudioContext.currentTime`
- Priority: **high** — directly improves the most visible UX gap

### MIDI Export
- Export current song + voicing settings as a MIDI file (SMF type 1)
- One track per section; quantized from `PlaybackNoteEvent[]`

### Loop Range from Selection
- Automatically set loop start/end from the currently selected bar range
- Wire audition mode to actually constrain playback to the loop window

### Chord Editor UX Improvements
- Multi-chord bars (more than one chord event per bar)
- Drag-to-resize chord duration in the timeline
- In-place chord symbol autocomplete

---

## Medium-Term (Phase 6+)

### Pro-Audio Desktop Expansion

> These features target a hypothetical Electron / Tauri desktop build or a
> future web-to-native bridge. They do **not** compromise the web UX.

#### Real Instrument Preset Quality
- High-fidelity sample libraries (not bundled in the web build — loaded on demand)
- Per-preset convolution reverb IR

#### Desktop Plugin Host (VST3 / AU)
- `PlaybackQualityMode = 'pro'` activates the plugin bridge
- Plugin routing defined by `ArrangementTrack.instrument` + future `fxChain` field
- Desktop bridge listens for `qualityMode === 'pro'` store changes
- Web build continues to run in `sketch` / `enhanced` mode

#### Offline High-Quality Render
- Offline renderer accepts `Song` + `VoicingOptions`, calls `generateArrangement()`
  per bar, and feeds events to a sample engine or VST host
- Outputs a WAV/FLAC file without real-time playback constraints

#### Per-Track FX Chain
- Extend `ArrangementTrack` with `fxChain: FxChainDescriptor[]`
- Descriptors are serialisable (no native handles) so the schema works in the web build
- Desktop bridge materialises descriptors into real plugin instances

---

## Long-Term (Out of Scope for Now)

| Feature | Why deferred |
|---|---|
| Full DAW mixer / routing | Scope creep; dedicated DAW tools do this better |
| Mobile-optimised UI | Low priority until core web UX is stable |
| Collaborative multi-user editing | Requires backend infrastructure |
| LLM / AI integration | Optional enhancement; rule-based engine covers MVP needs |
| Audio mastering suite | Out of scope for a chord/arrangement tool |
| Notation export (MusicXML / PDF) | Worthwhile eventually; needs a separate render layer |

---

## Extension Point Summary

See `ARCHITECTURE.md` (Phase 4 section) for detailed extension point descriptions.

| Extension Point | Status | Phase |
|---|---|---|
| `PlaybackEngine` interface (alternate backend) | Defined | Phase 1 |
| `VoicingOptions` + `generateArrangement()` | Implemented | Phase 4 |
| `PlaybackQualityMode = 'pro'` UI hook | Implemented (no backend) | Phase 4 |
| Web Audio scheduler | Planned | Phase 5 |
| `ArrangementTrack.fxChain` schema | Placeholder | Phase 4 |
| Desktop plugin bridge | Planned | Phase 6+ |
| Offline render pipeline | Planned | Phase 6+ |
