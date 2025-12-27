import { FileTreeNode } from "@/types";

function countFilesInTree(nodes: FileTreeNode[]): number {
  let count = 0;
  for (const node of nodes) {
    if (!node.is_directory) {
      count++;
    }
    if (node.children) {
      count += countFilesInTree(node.children);
    }
  }
  return count;
}

interface SidebarFooterProps {
  fileTree: FileTreeNode[];
}

export function SidebarFooter({ fileTree }: SidebarFooterProps) {
  return (
    <div className="px-4 py-2.5 border-t border-gray-100 ">
      <div className="text-xs text-gray-500 font-medium">
        {countFilesInTree(fileTree)} 个文件
      </div>
    </div>
  );
}
