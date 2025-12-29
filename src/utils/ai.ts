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
 * 检查是否是危险操作
 */
export const isDangerousTool = (toolName: string): boolean => {
  return ["delete_file"].includes(toolName);
};
