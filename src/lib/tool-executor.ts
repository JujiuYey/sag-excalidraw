import { invoke } from "@tauri-apps/api/core";
import type { ToolExecutor, ToolResult } from "@/types/ai";

export class TauriToolExecutor implements ToolExecutor {
  async executeTool(
    name: string,
    args: Record<string, unknown>,
  ): Promise<ToolResult> {
    console.log(`[ToolExecutor] Executing tool: ${name}`, args);

    try {
      let result: unknown;

      switch (name) {
        case "read_file": {
          const filePath = this.validateStringArg(args, "file_path", name);
          result = await invoke("read_file", { filePath });
          break;
        }

        case "save_file": {
          const filePath = this.validateStringArg(args, "file_path", name);
          const content = this.validateStringArg(args, "content", name);
          await invoke("save_file", { filePath, content });
          result = { success: true, message: "File saved successfully" };
          break;
        }

        case "create_new_file": {
          const directory = this.validateStringArg(args, "directory", name);
          const fileName = this.validateStringArg(args, "file_name", name);
          result = await invoke("create_new_file", { directory, fileName });
          break;
        }

        case "delete_file": {
          const filePath = this.validateStringArg(args, "file_path", name);
          await invoke("delete_file", { filePath });
          result = { success: true, message: "File deleted successfully" };
          break;
        }

        case "list_excalidraw_files": {
          const directory = this.validateStringArg(args, "directory", name);
          result = await invoke("list_excalidraw_files", { directory });
          break;
        }

        case "get_file_tree": {
          const directory = this.validateStringArg(args, "directory", name);
          result = await invoke("get_file_tree", { directory });
          break;
        }

        default:
          return {
            success: false,
            error: `Unknown tool: ${name}`,
          };
      }

      console.log(`[ToolExecutor] Tool ${name} result:`, result);

      return {
        success: true,
        result: typeof result === "string" ? result : JSON.stringify(result),
      };
    } catch (error) {
      console.error(`[ToolExecutor] Tool ${name} error:`, error);

      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  private validateStringArg(
    args: Record<string, unknown>,
    argName: string,
    toolName: string,
  ): string {
    const value = args[argName];

    if (typeof value !== "string") {
      throw new Error(
        `Invalid argument '${argName}' for tool '${toolName}': expected string, got ${typeof value}`,
      );
    }

    if (!value.trim()) {
      throw new Error(
        `Argument '${argName}' for tool '${toolName}' cannot be empty`,
      );
    }

    return value;
  }
}

let toolExecutorInstance: TauriToolExecutor | null = null;

export function getToolExecutor(): ToolExecutor {
  if (!toolExecutorInstance) {
    toolExecutorInstance = new TauriToolExecutor();
  }
  return toolExecutorInstance;
}

export function createToolExecutor(): TauriToolExecutor {
  return new TauriToolExecutor();
}
