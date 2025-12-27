import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import { ExcalidrawFile, FileTreeNode } from "../types";
import { message, Modal } from "antd";

export interface FileStore {
  // 当前选中的目录
  currentDirectory: string | null;
  // 当前目录下的文件列表
  files: ExcalidrawFile[];
  // 当前目录下的文件树
  fileTree: FileTreeNode[];
  // 当前选中的文件
  activeFile: ExcalidrawFile | null;
  // 当前选中文件的内容
  fileContent: string | null;
  // 当前选中文件是否被修改
  isDirty: boolean;

  // 设置当前选中的目录
  setCurrentDirectory: (dir: string | null) => void;
  // 设置当前目录下的文件列表
  setFiles: (files: ExcalidrawFile[]) => void;
  // 设置当前目录下的文件树
  setFileTree: (tree: FileTreeNode[]) => void;
  // 设置当前选中的文件
  setActiveFile: (file: ExcalidrawFile | null) => void;
  // 设置当前选中文件的内容
  setFileContent: (content: string | null) => void;
  // 设置当前选中文件是否被修改
  setIsDirty: (dirty: boolean) => void;
  // 标记文件是否被修改
  markFileAsModified: (filePath: string, modified: boolean) => void;
  // 标记文件树节点是否被修改
  markTreeNodeAsModified: (filePath: string, modified: boolean) => void;
  // 加载目录下的文件列表和文件树
  loadDirectory: (dir: string) => Promise<void>;
  // 加载目录下的文件树
  loadFileTree: (dir: string) => Promise<void>;
  // 加载文件内容
  loadFile: (file: ExcalidrawFile) => Promise<void>;
  // 从文件树加载文件内容
  loadFileFromTree: (node: FileTreeNode) => Promise<void>;
  // 保存当前选中文件
  saveCurrentFile: (content?: string) => Promise<void>;
  // 创建新文件
  createNewFile: (fileName?: string) => Promise<void>;
  // 重命名文件
  renameFile: (oldPath: string, newName: string) => Promise<void>;
  // 删除文件
  deleteFile: (filePath: string) => Promise<boolean>;
}

const updateNode = (
  nodes: FileTreeNode[],
  filePath: string,
  modified: boolean,
): FileTreeNode[] => {
  return nodes.map((node) => {
    if (node.path === filePath) {
      return { ...node, modified };
    }
    if (node.children) {
      return {
        ...node,
        children: updateNode(node.children, filePath, modified),
      };
    }
    return node;
  });
};

export const useFileStore = create<FileStore>((set, get) => ({
  currentDirectory: null,
  files: [],
  fileTree: [],
  activeFile: null,
  fileContent: null,
  isDirty: false,

  setCurrentDirectory: (dir) => set({ currentDirectory: dir }),
  setFiles: (files) => set({ files }),
  setFileTree: (tree) => set({ fileTree: tree }),
  setActiveFile: (file) => set({ activeFile: file }),
  setFileContent: (content) => set({ fileContent: content }),
  setIsDirty: (dirty) => set({ isDirty: dirty }),

  markFileAsModified: (filePath, modified) => {
    set((state) => ({
      files: state.files.map((f) =>
        f.path === filePath ? { ...f, modified } : f,
      ),
    }));
  },

  markTreeNodeAsModified: (filePath, modified) => {
    set((state) => ({
      fileTree: updateNode(state.fileTree, filePath, modified),
    }));
  },

  loadDirectory: async (dir) => {
    try {
      message.loading("正在加载目录...", 0);
      const [files, fileTree] = await Promise.all([
        invoke<ExcalidrawFile[]>("list_excalidraw_files", { directory: dir }),
        invoke<FileTreeNode[]>("get_file_tree", { directory: dir }),
      ]);

      set({
        currentDirectory: dir,
        files,
        fileTree,
        activeFile: null,
        fileContent: null,
      });

      await invoke("watch_directory", { directory: dir });
      message.destroy();
      message.success(`已加载目录: ${dir}`);
    } catch (error) {
      message.destroy();
      message.error(`加载目录失败: ${error}`);
    }
  },

  loadFileTree: async (dir) => {
    try {
      const fileTree = await invoke<FileTreeNode[]>("get_file_tree", {
        directory: dir,
      });
      set({ fileTree });
    } catch (error) {
      message.error(`加载文件树失败: ${error}`);
    }
  },

  loadFile: async (file) => {
    const state = get();

    if (state.activeFile?.path === file.path) {
      return;
    }

    if (state.isDirty && state.activeFile) {
      const activeFile = state.activeFile;
      const confirmed = await new Promise<boolean>((resolve) => {
        Modal.confirm({
          title: "未保存的更改",
          content: `切换文件前要保存对 "${activeFile.name}" 的更改吗？`,
          okText: "保存",
          cancelText: "不保存",
          onOk: () => resolve(true),
          onCancel: () => resolve(false),
        });
      });

      if (confirmed) {
        await state.saveCurrentFile();
      } else {
        return;
      }
    }

    try {
      message.loading("正在加载文件...", 0);
      const content = await invoke<string>("read_file", {
        filePath: file.path,
      });

      set({
        activeFile: file,
        fileContent: content,
        isDirty: false,
      });

      state.markFileAsModified(file.path, false);
      state.markTreeNodeAsModified(file.path, false);
      message.destroy();
      message.success(`已加载: ${file.name}`);
    } catch (error) {
      if (
        String(error).includes("No such file") ||
        String(error).includes("not found")
      ) {
        message.destroy();
        message.warning(
          `文件未找到: ${file.name}\n\n文件可能已被删除或移动，正在刷新文件列表...`,
        );

        if (state.activeFile?.path === file.path) {
          set({
            activeFile: null,
            fileContent: null,
            isDirty: false,
          });
        }

        if (state.currentDirectory) {
          await state.loadFileTree(state.currentDirectory);
        }
      } else {
        message.destroy();
        message.error(`加载文件失败: ${error}`);
      }
    }
  },

  loadFileFromTree: async (node) => {
    if (node.is_directory) return;

    const state = get();

    if (state.activeFile?.path === node.path) {
      return;
    }

    if (state.isDirty && state.activeFile) {
      const activeFile = state.activeFile;
      const confirmed = await new Promise<boolean>((resolve) => {
        Modal.confirm({
          title: "未保存的更改",
          content: `切换文件前要保存对 "${activeFile.name}" 的更改吗？`,
          okText: "保存",
          cancelText: "不保存",
          onOk: () => resolve(true),
          onCancel: () => resolve(false),
        });
      });

      if (confirmed) {
        await state.saveCurrentFile();
      } else {
        return;
      }
    }

    try {
      message.loading("正在加载文件...", 0);
      const content = await invoke<string>("read_file", {
        filePath: node.path,
      });

      const file: ExcalidrawFile = {
        name: node.name,
        path: node.path,
        modified: node.modified,
      };

      set({
        activeFile: file,
        fileContent: content,
      });
      message.destroy();
      message.success(`已加载: ${node.name}`);
    } catch (error) {
      message.error(`加载文件失败: ${error}`);
    }
  },

  saveCurrentFile: async (content) => {
    const state = get();
    const { activeFile, fileContent, isDirty } = state;

    if (!activeFile) {
      return;
    }

    if (!isDirty && !content) {
      return;
    }

    const contentToSave = content || fileContent;
    if (!contentToSave) {
      return;
    }

    try {
      const parsed = JSON.parse(contentToSave);
      if (!parsed || typeof parsed !== "object") {
        return;
      }

      if (
        Array.isArray(parsed.elements) &&
        parsed.elements.length === 0 &&
        !content
      ) {
        return;
      }
    } catch {
      return;
    }

    try {
      message.loading("正在保存文件...", 0);
      await invoke("save_file", {
        filePath: activeFile.path,
        content: contentToSave,
      });

      state.markFileAsModified(activeFile.path, false);
      state.markTreeNodeAsModified(activeFile.path, false);
      set({ isDirty: false });
      message.destroy();
      message.success(`已保存: ${activeFile.name}`);
    } catch (error) {
      message.destroy();
      message.error(`保存文件失败: ${error}`);
    }
  },

  createNewFile: async (fileName) => {
    const state = get();
    let { currentDirectory } = state;

    if (state.isDirty && state.activeFile) {
      const activeFile = state.activeFile;
      const confirmed = await new Promise<boolean>((resolve) => {
        Modal.confirm({
          title: "未保存的更改",
          content: `创建新文件前要保存对 "${activeFile.name}" 的更改吗？`,
          okText: "保存",
          cancelText: "不保存",
          onOk: () => resolve(true),
          onCancel: () => resolve(false),
        });
      });

      if (confirmed) {
        await state.saveCurrentFile();
      } else {
        return;
      }
    }

    if (!currentDirectory) {
      try {
        const dir = await invoke<string | null>("select_directory");
        if (!dir) {
          return;
        }
        await state.loadDirectory(dir);
        currentDirectory = dir;
      } catch (error) {
        message.error(`选择目录失败: ${error}`);
        return;
      }
    }

    let finalFileName: string;
    if (fileName) {
      finalFileName = fileName.endsWith(".excalidraw")
        ? fileName
        : `${fileName}.excalidraw`;
    } else {
      const unnamedFiles = state.files.filter((f) =>
        f.name.startsWith("未命名"),
      );
      const maxSuffix = unnamedFiles.reduce((max, file) => {
        const match = file.name.match(/未命名(?:-\d+)?$/);
        if (match) {
          const suffix = match[0].replace("未命名-", "");
          const num = suffix === "未命名" ? 0 : parseInt(suffix, 10);
          return Math.max(max, num);
        }
        return max;
      }, -1);
      finalFileName = `未命名${maxSuffix >= 0 ? `-${maxSuffix + 1}` : ""}.excalidraw`;
    }

    try {
      message.loading("正在创建新文件...", 0);
      const filePath = await invoke<string>("create_new_file", {
        directory: currentDirectory,
        fileName: finalFileName,
      });
      message.destroy();

      await state.loadFileTree(currentDirectory);

      const file: ExcalidrawFile = {
        name: finalFileName,
        path: filePath,
        modified: false,
      };

      await state.loadFile(file);
      message.success(`已创建新文件: ${finalFileName}`);
    } catch (error) {
      console.error("Failed to create new file:", error);
      message.destroy();
      message.error(`创建文件失败: ${error}`);
    }
  },

  renameFile: async (oldPath, newName) => {
    try {
      message.loading("正在重命名文件...", 0);
      const finalName = newName.endsWith(".excalidraw")
        ? newName
        : `${newName}.excalidraw`;

      const newPath = await invoke<string>("rename_file", {
        oldPath,
        newName: finalName,
      });

      const state = get();

      if (state.activeFile?.path === oldPath) {
        set({
          activeFile: {
            ...state.activeFile,
            name: finalName,
            path: newPath,
          },
        });
      }

      if (state.currentDirectory) {
        await state.loadFileTree(state.currentDirectory);
      }
      message.destroy();
      message.success(`已将文件重命名为: ${finalName}`);
    } catch (error) {
      console.error("Failed to rename file:", error);
      message.destroy();
      message.error(`重命名文件失败: ${error}`);
    }
  },

  deleteFile: async (filePath) => {
    try {
      message.loading("正在删除文件...", 0);
      await invoke("delete_file", { filePath });

      const state = get();

      if (state.activeFile?.path === filePath) {
        set({
          activeFile: null,
          fileContent: null,
          isDirty: false,
        });
      }

      if (state.currentDirectory) {
        await state.loadFileTree(state.currentDirectory);
      }

      message.destroy();
      message.success("文件已删除");
      return true;
    } catch (error) {
      console.error("[deleteFile] Failed to delete file:", error);
      message.destroy();
      message.error(`删除文件失败: ${error}`);
      throw error;
    }
  },
}));
