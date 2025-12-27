import { useEffect, useMemo } from "react";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { ConfigProvider, theme } from "antd";
import type { ThemeConfig } from "antd";
import { TopBar } from "./components/TopBar";
import { Sidebar } from "./components/Sidebar/index";
import { ExcalidrawEditor } from "./components/ExcalidrawEditor/ExcalidrawEditor";
import { AIChatPanel } from "./components/AIChatPanel";
import { useFileStore } from "./store/fileStore";
import { useUIStore } from "./store/uiStore";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { useMenuHandler } from "./hooks/useMenuHandler";

function App() {
  const {
    loadDirectory,
    currentDirectory,
    loadFileTree,
    setActiveFile,
    setFileContent,
    setIsDirty,
    isDirty,
    saveCurrentFile,
  } = useFileStore();
  const { sidebarVisible, preferences } = useUIStore();
  const { aiChatPanelVisible } = useUIStore();

  const antdTheme = useMemo<ThemeConfig>(() => {
    return {
      algorithm:
        preferences.theme === "dark"
          ? theme.darkAlgorithm
          : preferences.theme === "light"
            ? theme.defaultAlgorithm
            : window.matchMedia("(prefers-color-scheme: dark)").matches
              ? theme.darkAlgorithm
              : theme.defaultAlgorithm,
      token: {
        borderRadius: 6,
        colorPrimary: "#3b82f6",
      },
    };
  }, [preferences.theme]);

  // Load preferences and setup on mount
  useEffect(() => {
    useUIStore.getState().loadPreferences();
  }, []);

  // Listen for file system changes
  useEffect(() => {
    if (!currentDirectory) return;

    const unlisten = listen("file-system-change", async () => {
      await loadFileTree(currentDirectory);

      const state = useFileStore.getState();
      if (state.activeFile) {
        const fileStillExists = state.fileTree.some(
          (node: { path: string; children?: Array<{ path: string }> }) =>
            node.path === state.activeFile?.path ||
            (node.children &&
              node.children.some(
                (child) => child.path === state.activeFile?.path,
              )),
        );

        if (!fileStillExists) {
          setActiveFile(null);
          setFileContent(null);
          setIsDirty(false);
        }
      }
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, [
    currentDirectory,
    loadDirectory,
    loadFileTree,
    setActiveFile,
    setFileContent,
    setIsDirty,
  ]);

  // Listen for window close event
  useEffect(() => {
    const unlisten = listen("check-unsaved-before-close", async () => {
      if (isDirty) {
        const { confirm } = await import("@tauri-apps/plugin-dialog");

        // First ask if they want to save
        const shouldSave = await confirm("关闭前要保存更改吗？", {
          title: "未保存的更改",
          kind: "warning",
          okLabel: "保存并关闭",
          cancelLabel: "取消",
        });

        if (shouldSave === null || shouldSave === undefined) {
          // User cancelled, don't close
          return;
        }

        if (shouldSave) {
          // Save before closing
          await saveCurrentFile();
          await invoke("force_close_app");
        } else {
          // Ask for confirmation to close without saving
          const reallyClose = await confirm(
            "Are you sure you want to close without saving?",
            {
              title: "Confirm Close",
              kind: "warning",
              okLabel: "Close Without Saving",
              cancelLabel: "Cancel",
            },
          );

          if (reallyClose) {
            await invoke("force_close_app");
          }
        }
      } else {
        // No unsaved changes, close directly
        await invoke("force_close_app");
      }
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, [isDirty, saveCurrentFile]);

  // Setup keyboard shortcuts
  useKeyboardShortcuts();

  // Setup menu handler (NOTE: ExcalidrawEditor will set the Excalidraw API)
  useMenuHandler();

  return (
    <ConfigProvider theme={antdTheme}>
      <div className="h-screen flex flex-col overflow-hidden">
        <TopBar />
        <div className="flex-1 flex overflow-hidden">
          {sidebarVisible && <Sidebar />}
          <ExcalidrawEditor />
          {aiChatPanelVisible && <AIChatPanel />}
        </div>
      </div>
    </ConfigProvider>
  );
}

export default App;
