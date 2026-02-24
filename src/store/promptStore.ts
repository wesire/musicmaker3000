import { create } from 'zustand';
import { createId } from '../models/factories';
import type {
  EditLocalResult,
  ExplanationResult,
  GenerateSongResult,
  GenerationPrompt,
  PromptType,
  RequestStatus,
  SelectionRange,
  Song,
} from '../models/types';
import { sendPrompt } from '../services/mockPromptService';

interface PromptState {
  prompts: GenerationPrompt[];
  activePrompt: GenerationPrompt | null;
  status: RequestStatus;
  panelOpen: boolean;
  promptType: PromptType;
  /** Structured result from the most recent successful generation. */
  pendingGenerateSongResult: GenerateSongResult | null;
  /** Structured result from the most recent successful local edit. */
  pendingEditLocalResult: EditLocalResult | null;
  /** Grounded explanation result from the most recent EXPLAIN_SELECTION. */
  pendingExplanationResult: ExplanationResult | null;
  openPromptPanel: (type: PromptType) => void;
  closePromptPanel: () => void;
  submitPrompt: (text: string, selection?: SelectionRange, currentSong?: Song | null) => Promise<void>;
  clearPrompts: () => void;
  clearPendingResults: () => void;
  clearExplanationResult: () => void;
}

export const usePromptStore = create<PromptState>((set, get) => ({
  prompts: [],
  activePrompt: null,
  status: 'idle',
  panelOpen: false,
  promptType: 'GENERATE_SONG',
  pendingGenerateSongResult: null,
  pendingEditLocalResult: null,
  pendingExplanationResult: null,

  openPromptPanel: (type) => set({ panelOpen: true, promptType: type }),
  closePromptPanel: () => set({ panelOpen: false }),

  submitPrompt: async (text, selection, currentSong) => {
    const { promptType } = get();
    const prompt: GenerationPrompt = {
      id: createId(),
      type: promptType,
      text,
      selection,
      timestamp: new Date().toISOString(),
      status: 'loading',
    };
    set({ activePrompt: prompt, status: 'loading', prompts: [...get().prompts, prompt] });

    try {
      const response = await sendPrompt(promptType, text, selection, currentSong);
      const updated: GenerationPrompt = { ...prompt, status: 'success', response };

      // Cache structured results for UI consumption
      let pendingGenerateSongResult = get().pendingGenerateSongResult;
      let pendingEditLocalResult    = get().pendingEditLocalResult;
      let pendingExplanationResult  = get().pendingExplanationResult;

      if (promptType === 'GENERATE_SONG') {
        pendingGenerateSongResult = response.data as GenerateSongResult;
        pendingEditLocalResult    = null;
      } else if (promptType === 'EDIT_LOCAL') {
        pendingEditLocalResult    = response.data as EditLocalResult;
        pendingGenerateSongResult = null;
      } else if (promptType === 'EXPLAIN_SELECTION') {
        pendingExplanationResult  = response.data as ExplanationResult;
      }

      set({
        activePrompt: updated,
        status: 'success',
        prompts: get().prompts.map((p) => (p.id === prompt.id ? updated : p)),
        pendingGenerateSongResult,
        pendingEditLocalResult,
        pendingExplanationResult,
      });
    } catch {
      const updated: GenerationPrompt = { ...prompt, status: 'error' };
      set({
        activePrompt: updated,
        status: 'error',
        prompts: get().prompts.map((p) => (p.id === prompt.id ? updated : p)),
      });
    }
  },

  clearPrompts: () => set({ prompts: [], activePrompt: null, status: 'idle' }),

  clearPendingResults: () =>
    set({ pendingGenerateSongResult: null, pendingEditLocalResult: null }),

  clearExplanationResult: () => set({ pendingExplanationResult: null }),
}));
