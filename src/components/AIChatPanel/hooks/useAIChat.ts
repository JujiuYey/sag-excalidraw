import { useState, useCallback } from "react";
import { useAIStore } from "@/store/aiStore";
import { useAIConfigStore } from "@/store/aiConfigStore";
import { createAIService } from "@/lib/ai-service";
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
      await service.sendMessage(messages, (chunk) => {
        if (chunk.type === "content") {
          const currentMessages = useAIStore.getState().aiMessages;
          const lastMessage = currentMessages[currentMessages.length - 1];
          if (lastMessage && lastMessage.id === assistantMessageId) {
            const newContent = (lastMessage.content || "") + chunk.content;
            updateLastAIMessage({ content: newContent });
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
  };
}
