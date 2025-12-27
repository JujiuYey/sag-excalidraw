import { useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useFileStore } from "../store/fileStore";
import { useUIStore } from "../store/uiStore";

export function useKeyboardShortcuts() {
  const { toggleSidebar } = useUIStore();
  const { saveCurrentFile, files, activeFile, loadFile, createNewFile } =
    useFileStore();

  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const modKey = isMac ? e.metaKey : e.ctrlKey;

      // Don't handle any events if clipboard operations are being used
      // Let Excalidraw handle all clipboard operations natively
      if (
        modKey &&
        (e.key === "c" || e.key === "v" || e.key === "x" || e.key === "a")
      ) {
        return;
      }

      // Cmd/Ctrl + B: Toggle sidebar
      if (modKey && e.key === "b") {
        e.preventDefault();
        toggleSidebar();
      }

      // Cmd/Ctrl + S: Save current file
      if (modKey && e.key === "s") {
        e.preventDefault();
        await saveCurrentFile();
      }

      // Cmd/Ctrl + O: Open directory
      if (modKey && e.key === "o") {
        e.preventDefault();
        const dir = await invoke<string | null>("select_directory");
        if (dir) {
          await useFileStore.getState().loadDirectory(dir);
        }
      }

      // Cmd/Ctrl + N: New file
      if (modKey && e.key === "n") {
        e.preventDefault();

        const fileStore = useFileStore.getState();

        // If no directory is selected, select one first
        if (!fileStore.currentDirectory) {
          const dir = await invoke<string | null>("select_directory");
          if (dir) {
            await fileStore.loadDirectory(dir);
          }
          return;
        }

        // Create with timestamp filename
        const fileName = `未命名-${Date.now()}.excalidraw`;
        await createNewFile(fileName);
      }

      // Cmd/Ctrl + Tab: Switch to next file
      if (modKey && e.key === "Tab") {
        e.preventDefault();
        if (files.length > 1 && activeFile) {
          const currentIndex = files.findIndex(
            (f) => f.path === activeFile.path,
          );
          const nextIndex = (currentIndex + 1) % files.length;
          await loadFile(files[nextIndex]);
        }
      }

      // Cmd/Ctrl + Shift + Tab: Switch to previous file
      if (modKey && e.shiftKey && e.key === "Tab") {
        e.preventDefault();
        if (files.length > 1 && activeFile) {
          const currentIndex = files.findIndex(
            (f) => f.path === activeFile.path,
          );
          const prevIndex =
            currentIndex === 0 ? files.length - 1 : currentIndex - 1;
          await loadFile(files[prevIndex]);
        }
      }
    };

    // Use non-capturing phase to let Excalidraw handle events first
    window.addEventListener("keydown", handleKeyDown, false);
    return () => window.removeEventListener("keydown", handleKeyDown, false);
  }, [
    toggleSidebar,
    saveCurrentFile,
    files,
    activeFile,
    loadFile,
    createNewFile,
  ]);
}
