import { useState, useRef, useEffect, memo } from "react";
import {
  ChevronDown,
  ChevronRight,
  File,
  Folder,
  FolderOpen,
  Edit2,
  Trash2,
  MoreVertical,
} from "lucide-react";
import { Dropdown } from "antd";
import { cn } from "../lib/utils";
import { FileTreeNode } from "../types";
import { useFileStore } from "../store/fileStore";
import { ask } from "@tauri-apps/plugin-dialog";

interface TreeViewProps {
  nodes: FileTreeNode[];
  onFileClick: (node: FileTreeNode) => void;
  activeFilePath?: string;
}

interface TreeNodeProps {
  node: FileTreeNode;
  onFileClick: (node: FileTreeNode) => void;
  activeFilePath?: string;
  depth: number;
}

const TreeNode = memo(function TreeNode({
  node,
  onFileClick,
  activeFilePath,
  depth,
}: TreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(depth === 0);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(node.name.replace(".excalidraw", ""));
  const renameInputRef = useRef<HTMLInputElement>(null);
  const { renameFile, deleteFile } = useFileStore();

  useEffect(() => {
    if (isRenaming && renameInputRef.current) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        renameInputRef.current?.focus();
        renameInputRef.current?.select();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isRenaming]);

  const handleClick = () => {
    if (node.is_directory) {
      setIsExpanded(!isExpanded);
    } else {
      onFileClick(node);
    }
  };

  const handleRename = async () => {
    if (!newName.trim()) {
      setNewName(node.name.replace(".excalidraw", ""));
      setIsRenaming(false);
      return;
    }

    const finalName = newName.trim();
    if (finalName !== node.name.replace(".excalidraw", "")) {
      await renameFile(node.path, finalName);
    }
    setIsRenaming(false);
  };

  const handleDelete = async () => {
    // Get the filename for clear confirmation
    const fileName = node.name.replace(".excalidraw", "");

    try {
      // Use Tauri's native dialog API for confirmation
      const confirmed = await ask(`你确定要删除"${fileName}"吗？`, {
        title: "确认删除",
        kind: "warning",
        okLabel: "删除",
        cancelLabel: "取消",
      });

      console.log("Tauri dialog response:", confirmed, "for file:", fileName);

      // Check if user clicked Delete (true) or Cancel (false)
      if (confirmed === true) {
        console.log(
          "✅ User clicked Delete, proceeding with deletion of:",
          node.path,
        );
        // Delete the file
        try {
          await deleteFile(node.path);
          console.log("✅ File deleted successfully");
        } catch (error) {
          console.error("❌ Failed to delete file:", error);
          // Use Tauri dialog for error too
          const { message } = await import("@tauri-apps/plugin-dialog");
          await message(`Failed to delete file: ${error}`, {
            title: "Error",
            kind: "error",
          });
        }
      } else {
        console.log("❌ User clicked Cancel, file NOT deleted:", fileName);
      }
    } catch (error) {
      console.error("Error showing confirmation dialog:", error);
    }
  };

  const handleRenameClick = () => {
    setIsRenaming(true);
  };

  const isActive = activeFilePath === node.path;
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className="relative">
      <div
        className={cn(
          "w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-all duration-150 group relative",
          !isRenaming && "cursor-pointer hover:bg-gray-100",
          isActive && "bg-blue-50 text-blue-700 font-medium shadow-sm",
          !isActive && "text-gray-700",
          node.modified && "font-semibold",
        )}
        style={{ paddingLeft: `${8 + depth * 16}px` }}
        onClick={!isRenaming ? handleClick : undefined}
      >
        {node.is_directory &&
          hasChildren &&
          (isExpanded ? (
            <ChevronDown className="w-4 h-4 shrink-0" />
          ) : (
            <ChevronRight className="w-4 h-4 shrink-0" />
          ))}

        {node.is_directory && !hasChildren && (
          <div className="w-4 h-4 shrink-0" />
        )}

        {node.is_directory ? (
          isExpanded ? (
            <FolderOpen className="w-4 h-4 shrink-0 text-blue-500 group-hover:text-blue-600" />
          ) : (
            <Folder className="w-4 h-4 shrink-0 text-blue-500 group-hover:text-blue-600" />
          )
        ) : (
          <File className="w-4 h-4 shrink-0 text-gray-400 group-hover:text-gray-600" />
        )}

        {isRenaming ? (
          <input
            ref={renameInputRef}
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleRename();
              } else if (e.key === "Escape") {
                e.preventDefault();
                setNewName(node.name.replace(".excalidraw", ""));
                setIsRenaming(false);
              }
            }}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            className="flex-1 text-sm px-2 py-1 border-2 border-blue-500 rounded-md outline-none focus:ring-2 focus:ring-blue-200 bg-white"
          />
        ) : (
          <span className="text-sm truncate flex-1">
            {node.is_directory
              ? node.name
              : node.name.replace(".excalidraw", "")}
          </span>
        )}

        {node.modified && (
          <span className="w-1.5 h-1.5 bg-orange-500 rounded-full shrink-0 animate-pulse" />
        )}

        {!node.is_directory && (
          <Dropdown
            menu={{
              items: [
                {
                  key: "rename",
                  label: "重命名",
                  icon: <Edit2 className="w-4 h-4" />,
                  onClick: handleRenameClick,
                },
                {
                  key: "delete",
                  label: "删除",
                  icon: <Trash2 className="w-4 h-4" />,
                  danger: true,
                  onClick: () => handleDelete(),
                },
              ],
            }}
            trigger={["click"]}
          >
            <button
              onClick={(e) => e.stopPropagation()}
              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded-md transition-all duration-200 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>
          </Dropdown>
        )}

        {isActive && !node.is_directory && (
          <ChevronRight className="w-4 h-4 shrink-0" />
        )}
      </div>

      {node.is_directory && hasChildren && isExpanded && (
        <div>
          {node.children!.map((child) => (
            <TreeNode
              key={child.path}
              node={child}
              onFileClick={onFileClick}
              activeFilePath={activeFilePath}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
});

export function TreeView({
  nodes,
  onFileClick,
  activeFilePath,
}: TreeViewProps) {
  if (nodes.length === 0) {
    return (
      <div className="text-sm text-gray-500 text-center py-8">
        No .excalidraw files found
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {nodes.map((node) => (
        <TreeNode
          key={node.path}
          node={node}
          onFileClick={onFileClick}
          activeFilePath={activeFilePath}
          depth={0}
        />
      ))}
    </div>
  );
}
