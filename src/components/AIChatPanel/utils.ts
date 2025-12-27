export const generateId = () => Math.random().toString(36).substring(2, 15);

export const copyToClipboard = async (content: string) => {
  try {
    await navigator.clipboard.writeText(content);
  } catch (error) {
    console.error("Failed to copy:", error);
  }
};

export interface ThinkPart {
  type: "text" | "think";
  content: string;
}

/**
 * 解析内容中的 <think> 标签
 */
export const parseThinkContent = (
  content: string,
  isStreaming: boolean,
): ThinkPart[] => {
  const thinkRegex = /<think>([\s\S]*?)<\/think>/g;
  const unclosedThinkRegex = /<think>([\s\S]*)$/;

  const parts: ThinkPart[] = [];
  let lastIndex = 0;
  let match;

  // 处理已闭合的 think 标签
  while ((match = thinkRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      const textBefore = content.slice(lastIndex, match.index).trim();
      if (textBefore) {
        parts.push({ type: "text", content: textBefore });
      }
    }
    parts.push({ type: "think", content: match[1].trim() });
    lastIndex = match.index + match[0].length;
  }

  // 处理剩余内容
  const remaining = content.slice(lastIndex);
  if (remaining) {
    const unclosedMatch = unclosedThinkRegex.exec(remaining);
    if (unclosedMatch && isStreaming) {
      const textBefore = remaining.slice(0, unclosedMatch.index).trim();
      if (textBefore) {
        parts.push({ type: "text", content: textBefore });
      }
      parts.push({ type: "think", content: unclosedMatch[1].trim() });
    } else {
      const trimmed = remaining.trim();
      if (trimmed) {
        parts.push({ type: "text", content: trimmed });
      }
    }
  }

  return parts;
};
