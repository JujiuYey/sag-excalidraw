import { useState, useCallback, useEffect } from "react";
import { useAIStore } from "@/store/aiStore";
import { useAIConfigStore } from "@/store/aiConfigStore";
import { createAIService } from "@/lib/ai-service";
import { getToolExecutor } from "@/lib/tool-executor";
import { DEFAULT_TOOLS } from "@/constants/ai";
import { generateId } from "../utils";

export function useAIChat() {
  const {
    aiMessages,
    aiIsLoading,
    addAIMessage,
    setAIIsLoading,
    updateLastAIMessage,
    clearAIMessages,
  } = useAIStore();

  const { aiModelConfig } = useAIConfigStore();
  const [inputValue, setInputValue] = useState("");
  const [isUsingTools, setIsUsingTools] = useState(false);

  useEffect(() => {
    const service = createAIService(aiModelConfig);
    const executor = getToolExecutor();
    service.setToolExecutor(executor);
  }, [aiModelConfig]);

  const handleSend = useCallback(async () => {
    if (!inputValue.trim() || aiIsLoading) return;

    const userMessage = inputValue.trim();
    setInputValue("");

    addAIMessage({
      id: generateId(),
      role: "user",
      content: userMessage,
      timestamp: Date.now(),
      status: "success",
    });

    setAIIsLoading(true);
    setIsUsingTools(false);

    const assistantMessageId = generateId();
    addAIMessage({
      id: assistantMessageId,
      role: "assistant",
      content: "",
      timestamp: Date.now(),
      status: "pending",
    });

    try {
      const messages = useAIStore.getState().aiMessages;
      const service = createAIService(aiModelConfig);
      service.setToolExecutor(getToolExecutor());

      let currentContent = "";

      await service.sendMessageWithTools(messages, DEFAULT_TOOLS, (chunk) => {
        if (chunk.type === "content") {
          currentContent += chunk.content || "";
          const currentMessages = useAIStore.getState().aiMessages;
          const lastMessage = currentMessages[currentMessages.length - 1];
          if (lastMessage && lastMessage.id === assistantMessageId) {
            updateLastAIMessage({ content: currentContent });
          }
        } else if (chunk.type === "tool_calls") {
          setIsUsingTools(true);
          const toolCount = chunk.toolCalls?.length || 0;
          const currentMessages = useAIStore.getState().aiMessages;
          const lastMessage = currentMessages[currentMessages.length - 1];
          if (lastMessage && lastMessage.id === assistantMessageId) {
            updateLastAIMessage({
              content: currentContent + `\n\n[正在调用 ${toolCount} 个工具...]`,
            });
          }
        } else if (chunk.type === "done") {
          updateLastAIMessage({ status: "success" });
          setAIIsLoading(false);
        } else if (chunk.type === "error") {
          updateLastAIMessage({
            status: "error",
            content: `错误: ${chunk.error}`,
          });
          setAIIsLoading(false);
        }
      });
    } catch (error) {
      updateLastAIMessage({
        status: "error",
        content: `错误: ${error instanceof Error ? error.message : "未知错误"}`,
      });
      setAIIsLoading(false);
    }
  }, [
    inputValue,
    aiIsLoading,
    addAIMessage,
    aiModelConfig,
    updateLastAIMessage,
    setAIIsLoading,
  ]);

  return {
    aiMessages,
    aiIsLoading,
    inputValue,
    setInputValue,
    handleSend,
    clearAIMessages,
    isUsingTools,
  };
}
