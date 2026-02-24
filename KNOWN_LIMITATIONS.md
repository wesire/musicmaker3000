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
