import type { Tool, ToolCall, ToolCallDelta, ToolExecutor } from "@/types/ai";
import { aiLogger } from "@/lib/ai-logger";

export interface AIServiceConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
}

export interface StreamChunk {
  type: "content" | "done" | "error" | "tool_calls";
  content?: string;
  error?: string;
  toolCalls?: ToolCall[];
}

export class AIServiceError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public isRetryable: boolean = true,
  ) {
    super(message);
    this.name = "AIServiceError";
  }
}

export class AIService {
  private config: AIServiceConfig;
  private toolExecutor: ToolExecutor | null = null;
  private maxIterations: number = 10;

  constructor(config: Partial<AIServiceConfig> = {}) {
    this.config = {
      baseUrl: config.baseUrl ?? "",
      apiKey: config.apiKey ?? "",
      model: config.model ?? "",
      temperature: config.temperature ?? 0.7,
      maxTokens: config.maxTokens ?? 4096,
      systemPrompt: config.systemPrompt ?? "",
    };
  }

  updateConfig(config: Partial<AIServiceConfig>) {
    this.config = { ...this.config, ...config };
  }

  getConfig(): AIServiceConfig {
    return { ...this.config };
  }

  setToolExecutor(executor: ToolExecutor) {
    this.toolExecutor = executor;
  }

  setMaxIterations(max: number) {
    this.maxIterations = max;
  }

  async sendMessage(
    messages: unknown[],
    onChunk?: (chunk: StreamChunk) => void,
  ): Promise<string> {
    if (!this.config.apiKey) {
      throw new AIServiceError("API key 为空", undefined, false);
    }

    if (!this.config.baseUrl || !this.config.model) {
      throw new AIServiceError("baseUrl 或 model 为空", undefined, false);
    }

    const formattedMessages = this.formatMessages(messages);
    const endpoint = `${this.config.baseUrl.replace(/\/$/, "")}/chat/completions`;

    if (onChunk) {
      return this.streamRequest(endpoint, formattedMessages, onChunk);
    }

    return this.nonStreamRequest(endpoint, formattedMessages);
  }

  async sendMessageWithTools(
    messages: unknown[],
    tools: Tool[],
    onChunk?: (chunk: StreamChunk) => void,
  ): Promise<string> {
    if (!this.config.apiKey) {
      throw new AIServiceError("API key 为空", undefined, false);
    }

    if (!this.config.baseUrl || !this.config.model) {
      throw new AIServiceError("baseUrl 或 model 为空", undefined, false);
    }

    if (!this.toolExecutor) {
      throw new AIServiceError("Tool executor 未设置", undefined, false);
    }

    aiLogger.info("AI Service", "开始新请求");
    aiLogger.info("AI Service", "baseUrl", this.config.baseUrl);
    aiLogger.info("AI Service", "model", this.config.model);
    aiLogger.info("AI Service", "tools count", tools.length);

    const formattedMessages = this.formatMessages(messages);
    aiLogger.info("AI Service", "messages count", formattedMessages.length);
    aiLogger.debug("AI Service", "messages", formattedMessages);

    const endpoint = `${this.config.baseUrl.replace(/\/$/, "")}/chat/completions`;
    aiLogger.info("AI Service", "endpoint", endpoint);

    return this.executeWithTools(endpoint, formattedMessages, tools, onChunk);
  }

  private async nonStreamRequest(
    endpoint: string,
    messages: Array<{ role: "user" | "assistant" | "system"; content: string }>,
  ): Promise<string> {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: this.config.model,
        messages,
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new AIServiceError(
        `请求失败: ${response.status} ${response.statusText} - ${errorText}`,
        response.status,
        response.status === 429 || response.status >= 500,
      );
    }

    const data = await response.json();

    if (data.choices?.[0]?.message?.content) {
      return data.choices[0].message.content;
    }

    throw new AIServiceError("API 返回格式错误", undefined, true);
  }

  private async streamRequest(
    endpoint: string,
    messages: Array<{ role: "user" | "assistant" | "system"; content: string }>,
    onChunk: (chunk: StreamChunk) => void,
  ): Promise<string> {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: this.config.model,
        messages,
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new AIServiceError(
        `请求失败: ${response.status} ${response.statusText} - ${errorText}`,
        response.status,
        response.status === 429 || response.status >= 500,
      );
    }

    if (!response.body) {
      throw new AIServiceError("响应体为空", undefined, true);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullContent = "";

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataStr = line.slice(6);

            if (dataStr === "[DONE]") {
              break;
            }

            try {
              const data = JSON.parse(dataStr);

              if (data.choices?.[0]?.delta?.content) {
                const content = data.choices[0].delta.content;
                fullContent += content;
                onChunk({ type: "content", content });
              }

              if (data.choices?.[0]?.finish_reason) {
                onChunk({ type: "done" });
              }
            } catch {
              // 忽略解析错误
            }
          }
        }
      }
    } catch (error) {
      throw new AIServiceError(`流式读取错误: ${error}`, undefined, true);
    }

    return fullContent;
  }

  private async executeWithTools(
    endpoint: string,
    messages: Array<{ role: "user" | "assistant" | "system"; content: string }>,
    tools: Tool[],
    onChunk?: (chunk: StreamChunk) => void,
  ): Promise<string> {
    type ChatMessage = {
      role: "user" | "assistant" | "system" | "tool";
      content: string;
      tool_call_id?: string;
      name?: string;
    };
    const toolCallsAccumulator = new Map<
      number,
      { id: string; name: string; arguments: string }
    >();
    let iterations = 0;
    let allMessages: ChatMessage[] = messages.map((m) => ({
      ...m,
      role: m.role as "user" | "assistant" | "system",
    }));
    let finalContent = "";

    while (iterations < this.maxIterations) {
      iterations++;
      aiLogger.info("AI Service", `第 ${iterations} 次迭代`);

      const requestBody = {
        model: this.config.model,
        messages: allMessages,
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens,
        tools: tools.map((t) => ({
          type: "function",
          function: {
            name: t.name,
            description: t.description,
            parameters: t.parameters,
          },
        })),
        stream: true,
      };

      aiLogger.debug("AI Service", "发送请求体", requestBody);

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      aiLogger.info(
        "AI Service",
        "响应状态",
        `${response.status} ${response.statusText}`,
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new AIServiceError(
          `请求失败: ${response.status} ${response.statusText} - ${errorText}`,
          response.status,
          response.status === 429 || response.status >= 500,
        );
      }

      if (!response.body) {
        throw new AIServiceError("响应体为空", undefined, true);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let currentContent = "";
      let finishReason: string | null = null;

      try {
        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            break;
          }

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const dataStr = line.slice(6);

              if (dataStr === "[DONE]") {
                break;
              }

              try {
                const data = JSON.parse(dataStr);
                const choice = data.choices?.[0];

                if (choice?.delta?.content) {
                  const content = choice.delta.content;
                  currentContent += content;
                  if (onChunk) {
                    onChunk({ type: "content", content });
                  }
                }

                if (choice?.delta?.tool_calls) {
                  const toolCallDeltas: ToolCallDelta[] = Array.isArray(
                    choice.delta.tool_calls,
                  )
                    ? choice.delta.tool_calls
                    : [];

                  for (const delta of toolCallDeltas) {
                    const existing = toolCallsAccumulator.get(delta.index) || {
                      id: "",
                      name: "",
                      arguments: "",
                    };

                    if (delta.id) existing.id = delta.id;
                    if (delta.function?.name)
                      existing.name = delta.function.name;
                    if (delta.function?.arguments) {
                      existing.arguments += delta.function.arguments;
                    }

                    toolCallsAccumulator.set(delta.index, existing);
                  }

                  if (onChunk) {
                    const toolCalls: ToolCall[] = Array.from(
                      toolCallsAccumulator.values(),
                    ).map((tc) => ({
                      id: tc.id,
                      type: "function" as const,
                      function: {
                        name: tc.name,
                        arguments: JSON.parse(tc.arguments || "{}"),
                      },
                    }));

                    if (toolCalls.length > 0) {
                      onChunk({ type: "tool_calls", toolCalls });
                    }
                  }
                }

                if (choice?.finish_reason) {
                  finishReason = choice.finish_reason;

                  if (onChunk) {
                    onChunk({ type: "done" });
                  }
                }
              } catch {
                // 忽略解析错误
              }
            }
          }
        }
      } catch (error) {
        throw new AIServiceError(`流式读取错误: ${error}`, undefined, true);
      }

      if (finishReason === "stop") {
        finalContent = currentContent;
        break;
      }

      if (finishReason === "tool_calls" && toolCallsAccumulator.size > 0) {
        const toolCalls: ToolCall[] = Array.from(toolCallsAccumulator.values())
          .filter((tc) => tc.id && tc.name)
          .map((tc) => ({
            id: tc.id,
            type: "function" as const,
            function: {
              name: tc.name,
              arguments: JSON.parse(tc.arguments || "{}"),
            },
          }));

        aiLogger.info(
          "AI Service",
          "收到工具调用",
          `数量: ${toolCalls.length}`,
        );

        for (let i = 0; i < toolCalls.length; i++) {
          const toolCall = toolCalls[i];
          aiLogger.info("AI Service", `工具调用 #${i + 1}`, {
            tool_call_id: toolCall.id,
            function_name: toolCall.function.name,
            arguments: toolCall.function.arguments,
          });
        }

        const toolResults: Array<{
          role: "tool";
          tool_call_id: string;
          name: string;
          content: string;
        }> = [];

        for (const toolCall of toolCalls) {
          try {
            aiLogger.info("AI Service", "执行工具", {
              tool_call_id: toolCall.id,
              name: toolCall.function.name,
              arguments: toolCall.function.arguments,
            });

            const result = await this.toolExecutor!.executeTool(
              toolCall.function.name,
              toolCall.function.arguments,
            );

            const resultContent = result.success
              ? JSON.stringify(result.result)
              : JSON.stringify({ error: result.error });

            toolResults.push({
              role: "tool",
              tool_call_id: toolCall.id,
              name: toolCall.function.name,
              content: resultContent,
            });

            aiLogger.info("AI Service", "工具执行结果", resultContent);
          } catch (error) {
            const errorContent = JSON.stringify({
              error: error instanceof Error ? error.message : "Unknown error",
            });

            toolResults.push({
              role: "tool",
              tool_call_id: toolCall.id,
              name: toolCall.function.name,
              content: errorContent,
            });

            aiLogger.error("AI Service", "工具执行错误", error);
          }
        }

        aiLogger.debug("AI Service", "工具结果汇总", toolResults);

        allMessages = [
          ...allMessages,
          {
            role: "assistant",
            content: currentContent,
          },
          ...toolResults,
        ];

        toolCallsAccumulator.clear();
      } else {
        aiLogger.info("AI Service", "请求完成", {
          finish_reason: finishReason,
          finalContent,
        });
        finalContent = currentContent;
        break;
      }
    }

    if (iterations >= this.maxIterations) {
      aiLogger.warn(
        "AI Service",
        "达到最大迭代次数",
        `iterations: ${iterations}`,
      );
    }

    aiLogger.info(
      "AI Service",
      "请求处理完成",
      `finalContent length: ${finalContent.length}`,
    );

    return finalContent;
  }

  async sendMessageStream(
    messages: unknown[],
    onChunk: (chunk: StreamChunk) => void,
  ): Promise<void> {
    await this.sendMessage(messages, onChunk);
  }

  async testConnection(): Promise<boolean> {
    const testMessages: unknown[] = [
      {
        id: "test",
        role: "user",
        content: "Hello",
        timestamp: Date.now(),
        status: "success",
      },
    ];

    await this.sendMessage(testMessages);
    return true;
  }

  private formatMessages(
    messages: unknown[],
  ): Array<{ role: "user" | "assistant" | "system"; content: string }> {
    const systemMessage = this.config.systemPrompt
      ? [
          {
            role: "system" as const,
            content: this.config.systemPrompt,
          },
        ]
      : [];

    const chatMessages = (
      messages as Array<{
        role: string;
        content: string;
        status: string;
      }>
    )
      .filter((m) => m.status === "success")
      .map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

    return [...systemMessage, ...chatMessages];
  }
}

export function createAIService(config: AIServiceConfig): AIService {
  return new AIService(config);
}
