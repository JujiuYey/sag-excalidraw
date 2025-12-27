export interface AIMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  mermaidCode?: string;
  timestamp: number;
  status: "success" | "error" | "pending";
}

export interface ModelConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
}

export interface AIChatHistory {
  filePath: string;
  messages: AIMessage[];
  modelConfig: ModelConfig;
  lastUpdated: number;
}

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

export const extractMermaidCode = (content: string): string | null => {
  const regex = /```mermaid\n([\s\S]*?)\n```/g;
  const match = regex.exec(content);
  return match ? match[1] : null;
};

export const stripMermaidCode = (content: string): string => {
  return content.replace(/```mermaid\n[\s\S]*?\n```/g, "").trim();
};
