const techStack = ["Tauri 2.x", "React 19", "TypeScript", "Excalidraw"];

export function AboutSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">关于 SAG-Excalidraw</h3>

        <div className="space-y-4">
          <div className="px-4 py-3 rounded-lg border border-blue-500">
            <p className="font-medium text-sm">版本</p>
            <p className="text-sm text-gray-600 mt-1">1.0.0</p>
          </div>

          <div className="px-4 py-3 rounded-lg border border-blue-500">
            <p className="font-medium text-sm">描述</p>
            <p className="text-sm text-gray-600 mt-1">
              SAG-Excalidraw 是一个基于 Tauri 的桌面应用，用于管理和编辑本地
              Excalidraw 文件。
            </p>
          </div>

          <div className="px-4 py-3 rounded-lg border border-blue-500">
            <p className="font-medium text-sm">技术栈</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {techStack.map((tech) => (
                <span
                  key={tech}
                  className="px-2 py-1border rounded text-xs text-gray-600"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
