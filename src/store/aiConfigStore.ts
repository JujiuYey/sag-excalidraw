import { create } from "zustand";
import { ModelConfig, DEFAULT_MODEL_CONFIG } from "@/types/ai";

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
