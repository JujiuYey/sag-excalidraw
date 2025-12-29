import { create } from "zustand";
import type { ModelConfig } from "@/types/ai";
import { DEFAULT_MODEL_CONFIG } from "@/constants/ai";

export interface AIConfigStore {
  aiModelConfig: ModelConfig;
  setAIModelConfig: (config: ModelConfig) => void;
}

export const useAIConfigStore = create<AIConfigStore>((set) => ({
  aiModelConfig: DEFAULT_MODEL_CONFIG,

  setAIModelConfig: (config) => {
    set({ aiModelConfig: config });
  },
}));
