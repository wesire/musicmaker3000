# Known Limitations

## Phase 1 / General
- No real audio playback (mock engine only)
- Chord editing is text-based only
- No MIDI export
- No notation export

## Phase 2: Harmonic Generation
- Generation is fully rule-based (no LLM/AI backend); musical variety is limited to the built-in patterns
- Only one chord per bar is generated (multi-chord bars must be edited manually)
- Chord symbol parsing covers common triads and 7th/9th chords; unusual extended or altered voicings (e.g. `7#11`, `sus2add9`) may be analysed as uncertain/chromatic
- Secondary dominant detection covers common cases (V/V, V/vi, V/IV, etc.) but not all chromatic secondary functions
- Modal mixture detection uses a simple parallel-mode comparison; complex modal borrowings are marked uncertain
- Song form is determined heuristically from mood/style tags; user cannot specify custom section order in the prompt yet
- Alternatives B and C differ by pattern variant only — they use the same key and tempo as the primary
- `applyLocalEdit` replaces chord content only; bar ids, indexes, and time signatures are preserved from the original
- No real AI integration (all generation remains rule-based / deterministic)

## Phase 4: Playback Quality Upgrade & Arrangement/Voicing Engine
- Voicing engine produces `PlaybackNoteEvent[]` but the mock playback engine does not yet consume it — audio preview remains beat-tick only
- `Pro` quality mode UI is present but has no desktop/plugin backend; selecting it applies rich voicing settings only
- Arrangement pattern and density controls affect `VoicingOptions` state and voicing engine output; they do not yet affect audible playback in the web build (full audio rendering requires a real Web Audio or native backend)
- Humanization is deterministic (seeded pseudo-random); it is not truly stochastic
- Guitar strum approximation is heuristic (fixed 0.05-beat offset per note); real strum timing would require per-instrument modeling
- Rhythmic pattern uses a fixed offset array `[0, 1, 1.5, 2.5, 3]`; compound meters and custom rhythm patterns are not yet supported
- Audition mode enables loop transport automatically but does not yet time-slice playback to the selected bar range — that requires loop-range integration with the mock engine
- Per-track FX chain metadata (`ArrangementTrack`) is a placeholder schema; no FX routing exists yet

- Explanation engine is fully rule-based and analysis-driven; it does not use an LLM backend
- Substitution alternatives are heuristic (lighter/richer/smoother) based on scale degrees; voice-leading quality is not optimised
- Style fit reasoning only triggers for a limited set of tag combinations (pop, jazz, folk, dreamy, rock)
- Cadence detection is limited to the last chord pair of each 4-bar phrase; inner-phrase cadences are not detected
- Overlay annotations (Roman numerals, function tags) are computed client-side on every render; very long songs may see a minor performance impact
- Nashville numbers are derived from Roman numerals; secondary dominant targets are shown as `5/n` which is an approximation
- The follow-up input in ExplanationPanel routes to EDIT_LOCAL (not a dedicated follow-up explanation type)
