import { create } from "zustand";
import { AIMessage } from "@/types/ai";
import { aiLogger, LogEntry } from "@/lib/ai-logger";

export interface AIStore {
  aiMessages: AIMessage[];
  aiIsLoading: boolean;
  aiLogs: LogEntry[];
  isLogPanelVisible: boolean;
  isLogsLoaded: boolean;

  addAIMessage: (message: AIMessage) => void;
  clearAIMessages: () => void;
  setAIIsLoading: (loading: boolean) => void;
  updateLastAIMessage: (updates: Partial<AIMessage>) => void;
  setLogPanelVisible: (visible: boolean) => void;
  clearLogs: () => Promise<void>;
  loadLogs: () => Promise<void>;
}

async function loadInitialLogs(): Promise<LogEntry[]> {
  try {
    return await aiLogger.loadLogs();
  } catch {
    return [];
  }
}

export const useAIStore = create<AIStore>((set) => {
  let logsLoaded = false;

  const initListener = (log: LogEntry) => {
    set((state) => ({
      aiLogs: [...state.aiLogs, log].slice(-1000),
    }));
  };

  aiLogger.addListener(initListener);

  if (typeof window !== "undefined") {
    window.addEventListener("beforeunload", () => {
      aiLogger.clear();
    });
  }

  return {
    aiMessages: [],
    aiIsLoading: false,
    aiLogs: [],
    isLogPanelVisible: false,
    isLogsLoaded: false,

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

    setLogPanelVisible: (visible) => {
      set({ isLogPanelVisible: visible });
    },

    clearLogs: async () => {
      await aiLogger.clear();
      set({ aiLogs: [] });
    },

    loadLogs: async () => {
      if (logsLoaded) return;
      const logs = await loadInitialLogs();
      set({ aiLogs: logs, isLogsLoaded: true });
      logsLoaded = true;
    },
  };
});
