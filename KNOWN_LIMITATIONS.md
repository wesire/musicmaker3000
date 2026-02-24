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

## Phase 3: Explanation & Overlays
- Explanation engine is fully rule-based and analysis-driven; it does not use an LLM backend
- Substitution alternatives are heuristic (lighter/richer/smoother) based on scale degrees; voice-leading quality is not optimised
- Style fit reasoning only triggers for a limited set of tag combinations (pop, jazz, folk, dreamy, rock)
- Cadence detection is limited to the last chord pair of each 4-bar phrase; inner-phrase cadences are not detected
- Overlay annotations (Roman numerals, function tags) are computed client-side on every render; very long songs may see a minor performance impact
- Nashville numbers are derived from Roman numerals; secondary dominant targets are shown as `5/n` which is an approximation
- The follow-up input in ExplanationPanel routes to EDIT_LOCAL (not a dedicated follow-up explanation type)
