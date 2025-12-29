// 导入Tauri核心API
import { invoke } from "@tauri-apps/api/core";
// 导入工具执行器和工具结果的类型定义
import type { ToolExecutor, ToolResult } from "@/types/ai";

/**
 * Tauri工具执行器类，实现了ToolExecutor接口
 * 用于调用Tauri后端提供的各种文件操作工具
 */
export class TauriToolExecutor implements ToolExecutor {
  /**
   * 执行工具方法
   * @param name 工具名称
   * @param args 工具参数
   * @returns 工具执行结果
   */
  async executeTool(
    name: string,
    args: Record<string, unknown>,
  ): Promise<ToolResult> {
    try {
      let result: unknown;

      // 根据工具名称调用对应的Tauri命令
      switch (name) {
        // 读取文件
        case "read_file": {
          const filePath = this.validateStringArg(args, "file_path", name);
          result = await invoke("read_file", { filePath });
          break;
        }

        // 保存文件
        case "save_file": {
          const filePath = this.validateStringArg(args, "file_path", name);
          const content = this.validateStringArg(args, "content", name);
          await invoke("save_file", { filePath, content });
          result = { success: true, message: "File saved successfully" };
          break;
        }

        // 创建新文件
        case "create_new_file": {
          const directory = this.validateStringArg(args, "directory", name);
          const fileName = this.validateStringArg(args, "file_name", name);
          result = await invoke("create_new_file", { directory, fileName });
          break;
        }

        // 删除文件
        case "delete_file": {
          const filePath = this.validateStringArg(args, "file_path", name);
          await invoke("delete_file", { filePath });
          result = { success: true, message: "File deleted successfully" };
          break;
        }

        // 列出Excalidraw文件
        case "list_excalidraw_files": {
          const directory = this.validateStringArg(args, "directory", name);
          result = await invoke("list_excalidraw_files", { directory });
          break;
        }

        // 获取文件树
        case "get_file_tree": {
          const directory = this.validateStringArg(args, "directory", name);
          result = await invoke("get_file_tree", { directory });
          break;
        }

        // 未知工具
        default:
          return {
            success: false,
            error: `Unknown tool: ${name}`,
          };
      }

      // 返回执行结果，如果是字符串直接返回，否则转换为JSON字符串
      return {
        success: true,
        result: typeof result === "string" ? result : JSON.stringify(result),
      };
    } catch (error) {
      // 捕获错误并返回
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * 验证字符串参数
   * @param args 参数对象
   * @param argName 参数名称
   * @param toolName 工具名称
   * @returns 验证后的字符串参数
   */
  private validateStringArg(
    args: Record<string, unknown>,
    argName: string,
    toolName: string,
  ): string {
    const value = args[argName];

    // 验证参数类型是否为字符串
    if (typeof value !== "string") {
      throw new Error(
        `Invalid argument '${argName}' for tool '${toolName}': expected string, got ${typeof value}`,
      );
    }

    // 验证参数是否为空
    if (!value.trim()) {
      throw new Error(
        `Argument '${argName}' for tool '${toolName}' cannot be empty`,
      );
    }

    return value;
  }
}

// 工具执行器单例实例
let toolExecutorInstance: TauriToolExecutor | null = null;

/**
 * 获取工具执行器单例
 * @returns 工具执行器实例
 */
export function getToolExecutor(): ToolExecutor {
  if (!toolExecutorInstance) {
    toolExecutorInstance = new TauriToolExecutor();
  }
  return toolExecutorInstance;
}

/**
 * 创建新的工具执行器实例
 * @returns 新的工具执行器实例
 */
export function createToolExecutor(): TauriToolExecutor {
  return new TauriToolExecutor();
}
