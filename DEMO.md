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
