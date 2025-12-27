import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { Excalidraw } from "@excalidraw/excalidraw";
// Type definitions for Excalidraw elements and state
type ExcalidrawElement = any;
type ExcalidrawAppState = any;
import { useFileStore } from "@/store/fileStore";
import { useUIStore } from "@/store/uiStore";
import { setGlobalExcalidrawAPI } from "../../hooks/useMenuHandler";
import { TIMING } from "../../constants";
import { getResolvedTheme } from "@/hooks/useTheme";

export function ExcalidrawEditor() {
  const activeFile = useFileStore((state) => state.activeFile);
  const fileContent = useFileStore((state) => state.fileContent);
  const themePreference = useUIStore((state) => state.preferences.theme);
  const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">(() =>
    getResolvedTheme(themePreference),
  );
  const lastSavedContentRef = useRef<string>("");
  const lastSavedElementsRef = useRef<string>("");
  const isUserChangeRef = useRef(true);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previousFilePathRef = useRef<string | null>(null);
  const initialLoadCompleteRef = useRef(false);

  // Use ref to store fileContent to avoid triggering useMemo on every content change
  const fileContentRef = useRef(fileContent);
  fileContentRef.current = fileContent;

  // Parse initial data from fileContent
  const initialData = useMemo(() => {
    const content = fileContentRef.current;
    const filePath = activeFile?.path;

    if (!content || !filePath) return null;

    // Check if we're switching files
    if (filePath !== previousFilePathRef.current) {
      previousFilePathRef.current = filePath;
      setIsLoading(true);
      // Disable user change detection during initial load
      isUserChangeRef.current = false;
      initialLoadCompleteRef.current = false;
    }

    try {
      const data = JSON.parse(content);
      // Store this as our baseline for change detection
      lastSavedContentRef.current = content;
      lastSavedElementsRef.current = JSON.stringify(data.elements || []);

      return {
        elements: data.elements || [],
        appState: {
          ...data.appState,
          zoom: { value: 1 },
          scrollX: 0,
          scrollY: 0,
        },
        files: data.files,
      };
    } catch {
      setIsLoading(false);
      return null;
    }
  }, [activeFile?.path]);

  // Center content and re-enable user change detection after initial load
  const activeFilePath = activeFile?.path;
  useEffect(() => {
    if (excalidrawAPI && initialData && isLoading && activeFilePath) {
      // Store the current file path to check later
      const currentFilePath = activeFilePath;

      // Give Excalidraw time to process the initial data
      const timer = setTimeout(() => {
        // Center the content if there are elements
        if (initialData.elements && initialData.elements.length > 0) {
          excalidrawAPI.scrollToContent(initialData.elements, {
            fitToContent: true,
          });
        }

        // Hide loading and enable user change detection
        setTimeout(() => {
          setIsLoading(false);
          initialLoadCompleteRef.current = true;

          // Wait a bit more before enabling user change detection
          // to ensure all initial onChange events have fired
          setTimeout(() => {
            isUserChangeRef.current = true;
          }, TIMING.USER_CHANGE_ENABLE_DELAY);

          // Only mark file as clean if we're still on the same file
          const fileStore = useFileStore.getState();
          if (fileStore.activeFile?.path === currentFilePath) {
            fileStore.setIsDirty(false);
            fileStore.markFileAsModified(currentFilePath, false);
            fileStore.markTreeNodeAsModified(currentFilePath, false);
          }
        }, TIMING.LOADING_HIDE_DELAY);
      }, TIMING.FILE_LOAD_DELAY);

      return () => clearTimeout(timer);
    }
  }, [excalidrawAPI, initialData, isLoading, activeFilePath]);

  // Handle changes with debouncing
  const handleChange = useCallback(
    (
      elements: readonly ExcalidrawElement[],
      appState: ExcalidrawAppState,
      files: any,
    ) => {
      // Skip if no active file
      if (!activeFile) {
        return;
      }

      // Skip if this is not a user change (initial load or programmatic update)
      if (!isUserChangeRef.current || !initialLoadCompleteRef.current) {
        // Still update our baseline during initial load
        const currentElements = JSON.stringify(elements || []);
        lastSavedElementsRef.current = currentElements;
        return;
      }

      // Compare only elements to detect actual changes
      const currentElements = JSON.stringify(elements || []);

      // If elements haven't changed from our saved baseline, skip
      if (currentElements === lastSavedElementsRef.current) {
        return;
      }

      // Update our baseline
      lastSavedElementsRef.current = currentElements;

      // Immediately mark as dirty so file switch detection works
      const fileStore = useFileStore.getState();
      if (!fileStore.isDirty) {
        fileStore.setIsDirty(true);
        fileStore.markFileAsModified(activeFile.path, true);
        fileStore.markTreeNodeAsModified(activeFile.path, true);
      }

      // Build the new content
      const newContent = JSON.stringify(
        {
          type: "excalidraw",
          version: 2,
          source: "SAG-Excalidraw",
          elements,
          appState: {
            gridSize: appState.gridSize,
            viewBackgroundColor: appState.viewBackgroundColor,
            currentItemFontFamily: appState.currentItemFontFamily,
            currentItemFontSize: appState.currentItemFontSize,
            currentItemStrokeColor: appState.currentItemStrokeColor,
            currentItemBackgroundColor: appState.currentItemBackgroundColor,
            currentItemFillStyle: appState.currentItemFillStyle,
            currentItemStrokeWidth: appState.currentItemStrokeWidth,
            currentItemRoughness: appState.currentItemRoughness,
            currentItemOpacity: appState.currentItemOpacity,
            currentItemTextAlign: appState.currentItemTextAlign,
          },
          files,
        },
        null,
        2,
      );

      // Clear existing debounce timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Debounce only the content update to avoid rapid re-renders
      debounceTimerRef.current = setTimeout(() => {
        const freshFileStore = useFileStore.getState();

        // Only update content if we're still on the same file
        if (freshFileStore.activeFile?.path === activeFile.path) {
          freshFileStore.setFileContent(newContent);
        }
      }, TIMING.DEBOUNCE_SAVE); // Debounce save operations
    },
    [activeFile],
  );

  // Handle save - update our reference
  useEffect(() => {
    const unsubscribe = useFileStore.subscribe(
      (
        state: {
          isDirty: boolean;
          fileContent: string | null;
          activeFile: { path: string } | null;
        },
        prevState: { isDirty: boolean; activeFile: { path: string } | null },
      ) => {
        // When file is saved (isDirty becomes false)
        if (prevState.isDirty && !state.isDirty && state.fileContent) {
          lastSavedContentRef.current = state.fileContent;
          try {
            const data = JSON.parse(state.fileContent);
            lastSavedElementsRef.current = JSON.stringify(data.elements || []);
          } catch {
            // Ignore parse errors
          }
        }

        // When switching files (activeFile changes)
        if (state.activeFile?.path !== prevState.activeFile?.path) {
          // Disable user change detection for file switch
          isUserChangeRef.current = false;
        }
      },
    );

    return unsubscribe;
  }, []);

  // Cleanup debounce timer on unmount or file change
  useEffect(() => {
    return () => {
      // If there's a pending content update, flush it immediately before cleanup
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
    };
  }, [activeFile?.path]);

  // Update resolved theme when preference changes or system theme changes
  useEffect(() => {
    setResolvedTheme(getResolvedTheme(themePreference));

    // Listen for system theme changes when using "system" preference
    if (themePreference === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = () => {
        setResolvedTheme(getResolvedTheme(themePreference));
      };
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, [themePreference]);

  if (!activeFile) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <p className="text-lg mb-2">No file selected</p>
          <p className="text-sm">
            Select a file from the sidebar to start editing
          </p>
        </div>
      </div>
    );
  }

  // Use key prop to force remount when switching files
  return (
    <div className="flex-1 h-full relative" key={activeFile.path}>
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-50 bg-white flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-solid border-blue-600 border-r-transparent mb-2"></div>
            <p className="text-sm text-gray-600">Loading...</p>
          </div>
        </div>
      )}

      {/* Excalidraw component */}
      <div className={`h-full ${isLoading ? "invisible" : "visible"}`}>
        <Excalidraw
          initialData={initialData}
          excalidrawAPI={(api) => {
            setExcalidrawAPI(api);
            setGlobalExcalidrawAPI(api);
          }}
          onChange={handleChange}
          theme={resolvedTheme}
          langCode="zh-CN"
          UIOptions={{
            canvasActions: {
              loadScene: false,
              saveToActiveFile: false,
              saveAsImage: true,
              export: {
                saveFileToDisk: true,
              },
            },
          }}
        />
      </div>
    </div>
  );
}
