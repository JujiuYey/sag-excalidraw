import { create } from "zustand";
import { AIMessage } from "@/types/ai";

export interface AIStore {
  aiMessages: AIMessage[];
  aiIsLoading: boolean;

  addAIMessage: (message: AIMessage) => void;
  clearAIMessages: () => void;
  setAIIsLoading: (loading: boolean) => void;
  updateLastAIMessage: (updates: Partial<AIMessage>) => void;
}

export const useAIStore = create<AIStore>((set) => ({
  aiMessages: [],
  aiIsLoading: false,

  addAIMessage: (message) => {
    set((state) => ({
      aiMessages: [...state.aiMessages, message],
    }));
  },

  clearAIMessages: () => {
    set({ aiMessages: [] });
  },

  setAIIsLoading: (loading) => {
    set({ aiIsLoading: loading });
  },

  updateLastAIMessage: (updates) => {
    set((state) => {
      if (state.aiMessages.length === 0) return state;
      const lastIndex = state.aiMessages.length - 1;
      const updatedMessages = [...state.aiMessages];
      updatedMessages[lastIndex] = {
        ...updatedMessages[lastIndex],
        ...updates,
      };
      return { aiMessages: updatedMessages };
    });
  },
}));
