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
