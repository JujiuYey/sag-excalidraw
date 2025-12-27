import { Plus } from "lucide-react";
import { Button } from "antd";
import { useUIStore } from "@/store/uiStore";
import { useFileStore } from "@/store/fileStore";
import { invoke } from "@tauri-apps/api/core";
import { MenuOutlined } from "@ant-design/icons";

export function LeftSection() {
  const currentDirectory = useFileStore((state) => state.currentDirectory);
  const createNewFile = useFileStore((state) => state.createNewFile);
  const loadDirectory = useFileStore((state) => state.loadDirectory);
  const sidebarVisible = useUIStore((state) => state.sidebarVisible);
  const toggleSidebar = useUIStore((state) => state.toggleSidebar);

  const handleNewFile = async () => {
    if (!currentDirectory) {
      const dir = await invoke<string | null>("select_directory");
      if (dir) {
        await loadDirectory(dir);
      }
      return;
    }
    const fileName = `未命名-${Date.now()}.excalidraw`;
    await createNewFile(fileName);
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        type={sidebarVisible ? "primary" : "text"}
        title="切换侧边栏"
        className="h-9 w-9 flex items-center justify-center"
        icon={<MenuOutlined />}
        onClick={toggleSidebar}
      />

      <div className="h-6 w-px bg-gray-200 dark:bg-gray-700" />

      <Button
        type="primary"
        icon={<Plus className="w-4 h-4" />}
        onClick={handleNewFile}
        title={!currentDirectory ? "请先选择目录" : "创建新文件"}
      >
        新建文件
      </Button>
    </div>
  );
}
