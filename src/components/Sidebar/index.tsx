import { useFileStore } from "@/store/fileStore";
import { FileTreeNode } from "@/types";
import { SidebarContent } from "./SidebarContent";
import { SidebarFooter } from "./SidebarFooter";

export function Sidebar() {
  const { currentDirectory, fileTree, activeFile, loadFileFromTree } =
    useFileStore();

  const handleFileClick = async (node: FileTreeNode) => {
    await loadFileFromTree(node);
  };

  return (
    <div className="w-[280px] h-full border-r border-border flex flex-col">
      <SidebarContent
        fileTree={fileTree}
        activeFilePath={activeFile?.path}
        onFileClick={handleFileClick}
        currentDirectory={currentDirectory}
      />
      <SidebarFooter fileTree={fileTree} />
    </div>
  );
}
