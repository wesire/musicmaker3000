# MusicMaker3000 Demo Walkthrough

## Getting Started
1. Run `npm run dev` to start the development server
2. Open http://localhost:5173
3. Choose a template (Simple Pop, Jazz Colors, Multi-Section Rock) or start blank
4. Use the timeline to view and edit chords
5. Use the transport bar to control playback

## Phase 2: AI-Assisted Harmony Generation

### Generate a Full Song
1. In the **🤖 AI Assistant** panel, click **GENERATE SONG**
2. Type a style/mood prompt, e.g.:
   - `upbeat pop song, happy and catchy`
   - `dreamy ethereal ambient floating, jazzy chord extensions`
   - `dark heavy rock, energetic, minor key`
3. Click **▶ Submit** (or Ctrl+Enter)
4. Three variants appear: **Apply Primary**, **Apply B** (smoother), **Apply C** (colorful)
5. Click a variant to replace the current song — the previous version is auto-saved

### Local Section / Bar Rewrite
1. Click a bar in the timeline to select it (shift-click to extend selection)
2. Click a section header to select the entire section
3. The **Selection:** toolbar appears with quick-intent buttons:
   - **⚡ Add Tension** — dominant-heavy, urgency
   - **✂️ Simplify** — I-IV-V only, stripped back
   - **☀️ Brighten** — major emphasis, lifted feel
   - **🌑 Darken** — minor/submediant emphasis
   - **🎨 Colorful** — extended harmony, ii chords
   - **〰️ Smoother** — stepwise root motion
4. Click an intent button → three A/B/C alternatives appear in the AI panel
5. Each alternative shows a **bar diff** (before → after chord symbols)
6. Click **Apply A/B/C** to apply the selected alternative to only the chosen bars
7. All other bars remain unchanged

### Compare & Revert
- Every Apply auto-saves a version in the **📜 Versions** panel
- Click any version to revert to it
- Use **Discard** in the AI panel to dismiss alternatives without applying

## Phase 3: Explainable Harmony & Educational Overlays

### Get a Grounded Harmonic Explanation
1. Click a bar (or shift-click to extend the selection) in the timeline
2. In the **Selection:** toolbar, click **💡 Explain**
3. The **💡 Harmonic Explanation** panel appears in the right column with:
   - A plain-language summary of the chord progression
   - Per-chord breakdown: Roman numeral, harmonic function, tension role, cadence connections
   - Cadence explanation (authentic, half, plagal, deceptive) when detected
   - Style fit reasoning (when a prompt was previously submitted)
   - Suggested alternatives (lighter, richer, smoother) with pros/cons
   - Uncertainty notices for chromatic or ambiguous chords
4. In the Explanation Panel, type a follow-up (e.g. `"make this less tense"`) and press Enter to submit an EDIT_LOCAL request while keeping the selection intact

### Educational Overlays
The **Overlays** toolbar appears at the top of the timeline with toggles for:
- **Chords** — chord symbol labels (on by default)
- **Roman #** — Roman numeral annotations per chord (e.g. `I`, `V/V`)
- **Function** — harmonic function tag per chord (`T`=tonic, `P`=predominant, `D`=dominant, `C`=chromatic)
- **Nashville #** — Nashville number notation (e.g. `1`, `5`, `2m`)
- **Cadences** — cadence type markers at the end of phrases (e.g. `✓ auth`, `↑ half`, `↺ dec`)
- **Sections** — section type badges and labels
- **Key** — global key context in the timeline header

Toggle any combination for a clean, uncluttered view.

