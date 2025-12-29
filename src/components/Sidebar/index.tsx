import { useEffect, useRef, useCallback } from "react";
import { useFileStore } from "@/store/fileStore";
import { useUIStore } from "@/store/uiStore";
import { FileTreeNode } from "@/types";
import { SidebarContent } from "./SidebarContent";
import { SidebarFooter } from "./SidebarFooter";

const MIN_WIDTH = 8; // vw
const MAX_WIDTH = 20; // vw

export function Sidebar() {
  const { currentDirectory, fileTree, activeFile, loadFileFromTree } =
    useFileStore();
  const { sidebarWidth, setSidebarWidth } = useUIStore();

  const isResizing = useRef(false);
  const resizingRef = useRef<HTMLDivElement>(null);

  const handleFileClick = async (node: FileTreeNode) => {
    await loadFileFromTree(node);
  };

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;
    document.body.style.cursor = "ew-resize";
    document.body.style.userSelect = "none";
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing.current) return;

      const newWidthPx = e.clientX;
      const newWidthVw = (newWidthPx / window.innerWidth) * 100;

      const clampedWidth = Math.min(Math.max(newWidthVw, MIN_WIDTH), MAX_WIDTH);
      setSidebarWidth(clampedWidth);
    },
    [setSidebarWidth],
  );

  const handleMouseUp = useCallback(() => {
    isResizing.current = false;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  return (
    <div
      ref={resizingRef}
      style={{
        width: `${sidebarWidth}vw`,
        height: "100%",
        borderRight: "1px solid var(--color-border)",
        display: "flex",
        flexDirection: "column",
        position: "relative",
      }}
    >
      <SidebarContent
        fileTree={fileTree}
        activeFilePath={activeFile?.path}
        onFileClick={handleFileClick}
        currentDirectory={currentDirectory}
      />
      <SidebarFooter fileTree={fileTree} />
      <div
        onMouseDown={handleMouseDown}
        style={{
          position: "absolute",
          right: -4,
          top: 0,
          bottom: 0,
          width: 8,
          cursor: "ew-resize",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 10,
        }}
      >
        <div
          style={{
            width: 2,
            height: 40,
            backgroundColor: "var(--color-border)",
            borderRadius: 1,
            opacity: 0.5,
          }}
        />
      </div>
    </div>
  );
}
