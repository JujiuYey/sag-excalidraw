import { Empty } from "antd";
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
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              currentDirectory ? "未找到 .excalidraw 文件" : "请先选择一个目录"
            }
          />
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
