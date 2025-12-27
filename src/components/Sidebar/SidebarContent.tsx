import { TreeView } from "@/components/Sidebar/TreeView";
import { FileTreeNode } from "@/types";

interface SidebarContentProps {
  fileTree: FileTreeNode[];
  activeFilePath?: string;
  onFileClick: (node: FileTreeNode) => void;
  currentDirectory: string | null;
}

export function SidebarContent({
  fileTree,
  activeFilePath,
  onFileClick,
  currentDirectory,
}: SidebarContentProps) {
  const hasFiles = fileTree.length > 0;

  return (
    <div style={{ flex: 1, overflow: "auto" }}>
      <div style={{ padding: 8 }}>
        {!hasFiles ? (
          <div
            style={{
              fontSize: 14,
              color: "#9ca3af",
              textAlign: "center",
              padding: "48px 16px",
            }}
          >
            <div style={{ color: "#d1d5db", marginBottom: 8, fontSize: 24 }}>
              📁
            </div>
            {currentDirectory ? "未找到 .excalidraw 文件" : "请先选择一个目录"}
          </div>
        ) : (
          <TreeView
            nodes={fileTree}
            onFileClick={onFileClick}
            activeFilePath={activeFilePath}
          />
        )}
      </div>
    </div>
  );
}
