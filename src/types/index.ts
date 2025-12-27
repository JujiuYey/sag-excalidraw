/**
 * Excalidraw 文件信息
 */
export interface ExcalidrawFile {
  /** 文件名称 */
  name: string;
  /** 文件路径 */
  path: string;
  /** 是否已修改 */
  modified: boolean;
}

/**
 * 文件树节点，用于表示文件和目录结构
 */
export interface FileTreeNode {
  /** 节点名称 */
  name: string;
  /** 节点路径 */
  path: string;
  /** 是否为目录 */
  is_directory: boolean;
  /** 是否已修改 */
  modified: boolean;
  /** 子节点列表（仅目录有） */
  children?: FileTreeNode[];
}

/**
 * 用户偏好设置
 */
export interface Preferences {
  /** 主题模式：light-浅色, dark-深色, system-跟随系统 */
  theme: "light" | "dark" | "system";
}
