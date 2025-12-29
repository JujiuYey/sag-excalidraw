// 导入zustand状态管理库
import { create } from "zustand";
// 导入AI消息类型
import { AIMessage } from "@/types/ai";
// 导入AI日志器和日志条目类型
import { aiLogger, LogEntry } from "@/lib/ai-logger";

/**
 * AI状态存储接口
 * 定义了AI相关的状态和操作方法
 */
export interface AIStore {
  // AI消息列表
  aiMessages: AIMessage[];
  // AI是否正在加载
  aiIsLoading: boolean;
  // AI日志列表
  aiLogs: LogEntry[];
  // 日志面板是否可见
  isLogPanelVisible: boolean;
  // 日志是否已加载
  isLogsLoaded: boolean;

  // 添加AI消息
  addAIMessage: (message: AIMessage) => void;
  // 清空AI消息
  clearAIMessages: () => void;
  // 设置AI加载状态
  setAIIsLoading: (loading: boolean) => void;
  // 更新最后一条AI消息
  updateLastAIMessage: (updates: Partial<AIMessage>) => void;
  // 设置日志面板可见性
  setLogPanelVisible: (visible: boolean) => void;
  // 清空日志
  clearLogs: () => Promise<void>;
  // 加载日志
  loadLogs: () => Promise<void>;
}

/**
 * 加载初始日志
 * @returns 日志条目列表
 */
async function loadInitialLogs(): Promise<LogEntry[]> {
  try {
    return await aiLogger.loadLogs();
  } catch {
    // 加载失败时返回空数组
    return [];
  }
}

/**
 * 创建AI状态存储
 * 使用zustand创建全局状态管理
 */
export const useAIStore = create<AIStore>((set) => {
  // 日志是否已加载的标志
  let logsLoaded = false;

  // 日志监听器，用于实时更新日志
  const initListener = (log: LogEntry) => {
    set((state) => ({
      // 只保留最后1000条日志，防止内存溢出
      aiLogs: [...state.aiLogs, log].slice(-1000),
    }));
  };

  // 添加日志监听器
  aiLogger.addListener(initListener);

  // 在页面卸载前清空日志
  if (typeof window !== "undefined") {
    window.addEventListener("beforeunload", () => {
      aiLogger.clear();
    });
  }

  // 初始状态和方法定义
  return {
    // 初始AI消息列表为空
    aiMessages: [],
    // 初始AI加载状态为false
    aiIsLoading: false,
    // 初始AI日志列表为空
    aiLogs: [],
    // 初始日志面板不可见
    isLogPanelVisible: false,
    // 初始日志未加载
    isLogsLoaded: false,

    /**
     * 添加AI消息
     * @param message 要添加的AI消息
     */
    addAIMessage: (message) => {
      set((state) => ({
        aiMessages: [...state.aiMessages, message],
      }));
    },

    /**
     * 清空AI消息
     */
    clearAIMessages: () => {
      set({ aiMessages: [] });
    },

    /**
     * 设置AI加载状态
     * @param loading 加载状态
     */
    setAIIsLoading: (loading) => {
      set({ aiIsLoading: loading });
    },

    /**
     * 更新最后一条AI消息
     * @param updates 要更新的部分消息内容
     */
    updateLastAIMessage: (updates) => {
      set((state) => {
        // 如果没有消息则不更新
        if (state.aiMessages.length === 0) return state;
        const lastIndex = state.aiMessages.length - 1;
        const updatedMessages = [...state.aiMessages];
        // 合并更新内容到最后一条消息
        updatedMessages[lastIndex] = {
          ...updatedMessages[lastIndex],
          ...updates,
        };
        return { aiMessages: updatedMessages };
      });
    },

    /**
     * 设置日志面板可见性
     * @param visible 可见性状态
     */
    setLogPanelVisible: (visible) => {
      set({ isLogPanelVisible: visible });
    },

    /**
     * 清空日志
     */
    clearLogs: async () => {
      await aiLogger.clear();
      set({ aiLogs: [] });
    },

    /**
     * 加载日志
     */
    loadLogs: async () => {
      // 防止重复加载
      if (logsLoaded) return;
      const logs = await loadInitialLogs();
      set({ aiLogs: logs, isLogsLoaded: true });
      logsLoaded = true;
    },
  };
});
