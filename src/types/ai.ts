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
