import { create } from "zustand";
import { Preferences } from "@/types";
import { invoke } from "@tauri-apps/api/core";
import { applyTheme } from "@/hooks/useTheme";
import { message } from "antd";

export interface UIStore {
  /** 用户偏好设置，包含主题、目录历史等 */
  preferences: Preferences;
  /** 侧边栏是否可见 */
  sidebarVisible: boolean;
  /** AI 聊天面板是否可见 */
  aiChatPanelVisible: boolean;
  /** AI 聊天面板宽度 */
  aiChatPanelWidth: number;

  /** 切换侧边栏可见状态 */
  toggleSidebar: () => void;
  /** 切换AI面板可见状态 */
  toggleAIChatPanel: () => void;
  /** 设置AI面板宽度 */
  setAIChatPanelWidth: (width: number) => void;

  /** 从后端加载偏好设置 */
  loadPreferences: () => Promise<void>;
  /** 设置用户偏好配置 */
  setPreferences: (preferences: Preferences) => void;
  /** 保存偏好设置到后端 */
  savePreferences: () => Promise<void>;
}

export const useUIStore = create<UIStore>((set, get) => ({
  preferences: {
    theme: "system",
  },
  sidebarVisible: true,
  aiChatPanelVisible: false,
  aiChatPanelWidth: 320,

  /**
   * 切换侧边栏可见状态
   */
  toggleSidebar: () => {
    set((state) => ({ sidebarVisible: !state.sidebarVisible }));
  },

  /**
   * 切换 AI 聊天面板可见状态
   */
  toggleAIChatPanel: () => {
    set((state) => ({ aiChatPanelVisible: !state.aiChatPanelVisible }));
  },

  /**
   * 设置 AI 聊天面板宽度
   */
  setAIChatPanelWidth: (width) => {
    set({ aiChatPanelWidth: width });
  },

  loadPreferences: async () => {
    try {
      const rustPreferences = await invoke<any>("get_preferences");
      message.info(`已加载偏好设置: ${JSON.stringify(rustPreferences)}`);

      const preferences: Preferences = {
        theme: (rustPreferences?.theme as Preferences["theme"]) || "system",
      };

      set({
        preferences,
        sidebarVisible:
          rustPreferences?.sidebar_visible ??
          rustPreferences?.sidebarVisible ??
          true,
      });

      applyTheme(preferences.theme);
    } catch (error) {
      message.error(`加载偏好设置失败: ${error}`);
      const defaultPreferences: Preferences = {
        theme: "system",
      };
      set({
        preferences: defaultPreferences,
        sidebarVisible: true,
      });
    }
  },

  /**
   * 设置用户偏好配置
   * @param preferences
   */
  setPreferences: (preferences) => set({ preferences }),

  /**
   * 保存偏好设置到后端
   */
  savePreferences: async () => {
    const { preferences } = get();
    try {
      await invoke("save_preferences", {
        preferences: {
          theme: preferences.theme,
        },
      });
    } catch (error) {
      message.error(`保存偏好设置失败: ${error}`);
    }
  },
}));
