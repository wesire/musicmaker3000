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
  fixtures/     # Demo project data
  services/     # Persistence, mock prompt, playback engine
  store/        # Zustand stores (project, selection, prompt, playback)
  components/   # React components
  tests/        # Test files and setup
```
