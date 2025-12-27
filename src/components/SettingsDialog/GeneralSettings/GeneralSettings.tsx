import { FolderOpen } from "lucide-react";
import { useFileStore } from "@/store/fileStore";
import { invoke } from "@tauri-apps/api/core";
import { useState } from "react";

export function GeneralSettings() {
  const currentDirectory = useFileStore((state) => state.currentDirectory);
  const loadDirectory = useFileStore((state) => state.loadDirectory);
  const [directoryDisplay, setDirectoryDisplay] = useState(currentDirectory);

  const handleSelectDirectory = async () => {
    const dir = await invoke<string | null>("select_directory");
    if (dir) {
      await loadDirectory(dir);
      setDirectoryDisplay(dir);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">通用设置</h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b">
            <div>
              <p className="font-medium text-sm">当前目录</p>
              <p className="text-xs text-gray-500 mt-1">当前打开的目录</p>
            </div>
            <button
              onClick={handleSelectDirectory}
              className="h-8 px-3 inline-flex items-center gap-2 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors text-sm"
            >
              <FolderOpen className="w-4 h-4" />
              <span className="text-sm">
                {directoryDisplay
                  ? directoryDisplay.split("/").pop()
                  : "选择目录"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
