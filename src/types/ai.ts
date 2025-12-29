/**
 * AI 消息接口
 * 表示对话中的一条消息
 */
export interface AIMessage {
  /** 消息唯一标识符 */
  id: string;
  /** 消息发送者角色：用户或助手 */
  role: "user" | "assistant";
  /** 消息内容 */
  content: string;
  /** 消息中包含的 Mermaid 代码（可选） */
  mermaidCode?: string;
  /** 消息创建时间戳 */
  timestamp: number;
  /** 消息状态：成功、错误或待处理 */
  status: "success" | "error" | "pending";
}

/**
 * 模型配置接口
 * 表示 AI 模型的配置参数
 */
export interface ModelConfig {
  /** API 基础 URL 地址 */
  baseUrl: string;
  /** API 密钥 */
  apiKey: string;
  /** 模型名称 */
  model: string;
  /** 生成温度参数（0-1），控制随机性 */
  temperature: number;
  /** 最大生成 token 数量 */
  maxTokens: number;
  /** 系统提示词，用于设定 AI 行为 */
  systemPrompt: string;
}

/**
 * AI 聊天历史接口
 * 表示一个文件的完整聊天历史记录
 */
export interface AIChatHistory {
  /** 关联的文件路径 */
  filePath: string;
  /** 消息历史列表 */
  messages: AIMessage[];
  /** 模型配置 */
  modelConfig: ModelConfig;
  /** 最后更新时间戳 */
  lastUpdated: number;
}

/**
 * 默认模型配置
 */
export const DEFAULT_MODEL_CONFIG: ModelConfig = {
  baseUrl: "",
  apiKey: "",
  model: "",
  temperature: 0.2,
  maxTokens: 4096,
  systemPrompt: `你是一个专业的图表生成助手，专注于帮助用户将自然语言描述转换为 Mermaid 语法图表。

## 核心职责

1. **理解需求**：仔细分析用户的自然语言描述，提取需要可视化的概念、流程和关系
2. **生成图表**：将需求转换为准确的 Mermaid 语法
3. **提供解释**：简要说明生成的图表结构和含义

## 文件操作注意事项

**重要**：在执行任何文件操作（创建、保存、读取文件）之前，必须先调用 \`get_workspace_info\` 工具检查当前工作区状态：
- 如果 \`hasDirectory\` 为 \`false\`（即用户尚未选择工作目录），请提醒用户：**"请先点击左侧边栏顶部的「选择文件夹」按钮，选择一个工作目录后再进行操作。"**
- 如果 \`hasDirectory\` 为 \`true\`，则可以使用返回的 \`currentDirectory\` 作为文件操作的目录路径

## 生成规范

### Mermaid 代码要求

- 必须使用完整的 Mermaid 语法
- 流程图使用 \`graph TD\` 或 \`graph LR\` 作为根节点
- 时序图使用 \`sequenceDiagram\` 关键字
- 确保节点 ID 唯一且有意义
- 使用清晰的标签文本

### 代码块格式

你的回复必须包含在代码块中，如下所示：

\`\`\`mermaid
graph TD
    A[开始] --> B[处理]
    B --> C[结束]
\`\`\`

### 最佳实践

- 保持图表简洁，避免过度复杂
- 使用合适的图表类型（流程图、时序图、类图等）
- 添加必要的注释说明关键节点
- 确保连接线的逻辑清晰

## 响应格式

1. 简要说明你理解的用户需求
2. 提供 Mermaid 代码块
3. 可选：添加图表使用建议

## 注意事项

- 不要在代码块外部添加额外的 Mermaid 代码
- 只返回图表相关的代码，不要生成其他内容
- 确保语法正确且可被 Mermaid 解析`,
};

/**
 * 从内容中提取 Mermaid 代码
 * @param content 包含 Mermaid 代码块的内容
 * @returns 提取的 Mermaid 代码，如果未找到则返回 null
 */
export const extractMermaidCode = (content: string): string | null => {
  const regex = /```mermaid\n([\s\S]*?)\n```/g;
  const match = regex.exec(content);
  return match ? match[1] : null;
};

/**
 * 从内容中移除所有 Mermaid 代码块
 * @param content 原始内容
 * @returns 移除 Mermaid 代码后的内容
 */
export const stripMermaidCode = (content: string): string => {
  return content.replace(/```mermaid\n[\s\S]*?\n```/g, "").trim();
};

/**
 * 工具参数模式定义
 */
export interface ToolParameters {
  type: "object";
  properties: Record<
    string,
    {
      type: string;
      description: string;
      enum?: string[];
    }
  >;
  required: string[];
}

/**
 * 工具定义
 */
export interface Tool {
  name: string;
  description: string;
  parameters: ToolParameters;
}

/**
 * 工具调用中的函数信息
 */
export interface ToolCallFunction {
  name: string;
  arguments: Record<string, unknown>;
}

/**
 * 单个工具调用
 */
export interface ToolCall {
  id: string;
  type: "function";
  function: ToolCallFunction;
}

/**
 * 工具执行结果
 */
export interface ToolResult {
  success: boolean;
  result?: string;
  error?: string;
}

/**
 * 流式响应中的 tool_calls 增量
 */
export interface ToolCallDelta {
  index: number;
  id?: string;
  function?: {
    name?: string;
    arguments?: string;
  };
}

/**
 * 工具执行器接口
 */
export interface ToolExecutor {
  executeTool(name: string, args: Record<string, unknown>): Promise<ToolResult>;
}

/**
 * 默认可用工具列表
 */
export const DEFAULT_TOOLS: Tool[] = [
  {
    name: "get_workspace_info",
    description:
      "获取当前工作区信息，包括：当前打开的目录路径(currentDirectory)、当前打开的文件(activeFile)。在执行文件操作前，应先调用此工具检查工作区状态。如果 hasDirectory 为 false，请提醒用户先在左侧边栏选择一个文件夹。",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "read_file",
    description:
      "读取指定路径的 Excalidraw 文件内容。参数 file_path 必须是有效的 .excalidraw 文件路径。",
    parameters: {
      type: "object",
      properties: {
        file_path: {
          type: "string",
          description: "要读取的文件路径，必须是 .excalidraw 文件",
        },
      },
      required: ["file_path"],
    },
  },
  {
    name: "save_file",
    description:
      "保存内容到指定的 Excalidraw 文件。参数 file_path 是文件路径，content 是 JSON 内容。",
    parameters: {
      type: "object",
      properties: {
        file_path: {
          type: "string",
          description: "要保存的文件路径，必须是 .excalidraw 文件",
        },
        content: {
          type: "string",
          description: "要保存的 JSON 内容",
        },
      },
      required: ["file_path", "content"],
    },
  },
  {
    name: "create_new_file",
    description:
      "在指定目录中创建一个新的 Excalidraw 文件。参数 directory 是目录路径，file_name 是文件名（可以不带 .excalidraw 后缀）。",
    parameters: {
      type: "object",
      properties: {
        directory: {
          type: "string",
          description: "要创建文件的目录路径",
        },
        file_name: {
          type: "string",
          description: "新文件名（会自动添加 .excalidraw 后缀）",
        },
      },
      required: ["directory", "file_name"],
    },
  },
  {
    name: "delete_file",
    description:
      "删除指定的 Excalidraw 文件。这是一个危险操作，请确保用户确认要删除。",
    parameters: {
      type: "object",
      properties: {
        file_path: {
          type: "string",
          description: "要删除的文件路径",
        },
      },
      required: ["file_path"],
    },
  },
  {
    name: "list_excalidraw_files",
    description: "列出指定目录及其子目录中所有的 Excalidraw 文件。",
    parameters: {
      type: "object",
      properties: {
        directory: {
          type: "string",
          description: "要搜索的目录路径",
        },
      },
      required: ["directory"],
    },
  },
  {
    name: "get_file_tree",
    description:
      "获取指定目录的 Excalidraw 文件树结构，显示目录和文件的层级关系。",
    parameters: {
      type: "object",
      properties: {
        directory: {
          type: "string",
          description: "要获取文件树的根目录路径",
        },
      },
      required: ["directory"],
    },
  },
];

/**
 * 检查是否是危险操作
 */
export const isDangerousTool = (toolName: string): boolean => {
  return ["delete_file"].includes(toolName);
};
