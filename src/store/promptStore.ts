import { create } from 'zustand';
import { createId } from '../models/factories';
import type { GenerationPrompt, PromptType, RequestStatus, SelectionRange } from '../models/types';
import { sendPrompt } from '../services/mockPromptService';

interface PromptState {
  prompts: GenerationPrompt[];
  activePrompt: GenerationPrompt | null;
  status: RequestStatus;
  panelOpen: boolean;
  promptType: PromptType;
  openPromptPanel: (type: PromptType) => void;
  closePromptPanel: () => void;
  submitPrompt: (text: string, selection?: SelectionRange) => Promise<void>;
  clearPrompts: () => void;
}

export const usePromptStore = create<PromptState>((set, get) => ({
  prompts: [],
  activePrompt: null,
  status: 'idle',
  panelOpen: false,
  promptType: 'GENERATE_SONG',

  openPromptPanel: (type) => set({ panelOpen: true, promptType: type }),
  closePromptPanel: () => set({ panelOpen: false }),

  submitPrompt: async (text, selection) => {
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
      const response = await sendPrompt(promptType, text, selection);
      const updated: GenerationPrompt = { ...prompt, status: 'success', response };
      set({
        activePrompt: updated,
        status: 'success',
        prompts: get().prompts.map((p) => (p.id === prompt.id ? updated : p)),
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
}));
