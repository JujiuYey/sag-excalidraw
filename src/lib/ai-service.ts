/**
 * AI 服务模块
 *
 * 提供与 OpenAI 兼容 API 的通信服务，支持：
 * - 普通消息发送（流式/非流式）
 * - 带工具调用的消息发送（Agentic Loop）
 * - 连接测试
 *
 * @module ai-service
 */

import type { Tool, ToolCall, ToolCallDelta, ToolExecutor } from "@/types/ai";
import { aiLogger } from "@/lib/ai-logger";

/**
 * AI 服务配置接口
 */
export interface AIServiceConfig {
  /** API 基础 URL，例如 https://api.openai.com/v1 */
  baseUrl: string;
  /** API 密钥 */
  apiKey: string;
  /** 模型名称，例如 gpt-4、claude-3 等 */
  model: string;
  /** 温度参数，控制输出的随机性，范围 0-2 */
  temperature: number;
  /** 最大 token 数量 */
  maxTokens: number;
  /** 系统提示词 */
  systemPrompt: string;
}

/**
 * 流式响应数据块接口
 */
export interface StreamChunk {
  /** 数据块类型：content-内容、done-完成、error-错误、tool_calls-工具调用 */
  type: "content" | "done" | "error" | "tool_calls";
  /** 文本内容（当 type 为 content 时） */
  content?: string;
  /** 错误信息（当 type 为 error 时） */
  error?: string;
  /** 工具调用列表（当 type 为 tool_calls 时） */
  toolCalls?: ToolCall[];
}

/**
 * AI 服务错误类
 *
 * 封装 API 请求过程中可能出现的错误，提供状态码和可重试标识
 */
export class AIServiceError extends Error {
  /**
   * @param message - 错误信息
   * @param statusCode - HTTP 状态码
   * @param isRetryable - 是否可重试（429 或 5xx 错误通常可重试）
   */
  constructor(
    message: string,
    public statusCode?: number,
    public isRetryable: boolean = true,
  ) {
    super(message);
    this.name = "AIServiceError";
  }
}

/**
 * AI 服务类
 *
 * 核心服务类，负责与 OpenAI 兼容的 API 进行通信。
 * 支持普通对话、流式响应、以及带工具调用的 Agentic Loop 模式。
 */
export class AIService {
  /** 服务配置 */
  private config: AIServiceConfig;
  /** 工具执行器，用于执行 AI 请求的工具调用 */
  private toolExecutor: ToolExecutor | null = null;
  /** Agentic Loop 最大迭代次数，防止无限循环 */
  private maxIterations: number = 10;

  /**
   * 创建 AI 服务实例
   * @param config - 部分或完整的配置对象
   */
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

  /**
   * 设置工具执行器
   * @param executor - 工具执行器实例
   */
  setToolExecutor(executor: ToolExecutor) {
    this.toolExecutor = executor;
  }

  /**
   * 发送消息到 AI
   *
   * @param messages - 消息历史数组
   * @param onChunk - 可选的流式响应回调函数
   * @returns AI 的回复内容
   * @throws {AIServiceError} 当配置缺失或 API 请求失败时
   */
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

  /**
   * 发送带工具调用的消息
   *
   * 实现 Agentic Loop 模式：
   * 1. 发送消息和工具定义到 AI
   * 2. AI 可能返回工具调用请求
   * 3. 执行工具并将结果返回给 AI
   * 4. 重复直到 AI 返回最终回复或达到最大迭代次数
   *
   * @param messages - 消息历史数组
   * @param tools - 可用工具列表
   * @param onChunk - 可选的流式响应回调函数
   * @returns AI 的最终回复内容
   * @throws {AIServiceError} 当配置缺失、工具执行器未设置或 API 请求失败时
   */
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

  /**
   * 发送非流式请求
   *
   * 一次性获取完整的 AI 回复，适用于不需要实时显示的场景。
   *
   * @param endpoint - API 端点 URL
   * @param messages - 格式化后的消息数组
   * @returns AI 的回复内容
   * @throws {AIServiceError} 当请求失败或返回格式错误时
   */
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

  /**
   * 发送流式请求
   *
   * 使用 Server-Sent Events (SSE) 实时接收 AI 回复，
   * 每收到一个数据块就调用回调函数，实现打字机效果。
   *
   * @param endpoint - API 端点 URL
   * @param messages - 格式化后的消息数组
   * @param onChunk - 流式响应回调函数
   * @returns AI 的完整回复内容
   * @throws {AIServiceError} 当请求失败或流式读取出错时
   */
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

  /**
   * 执行带工具调用的请求（Agentic Loop 核心逻辑）
   *
   * 工作流程：
   * 1. 发送包含工具定义的请求到 AI
   * 2. 解析流式响应，收集文本内容和工具调用
   * 3. 如果 AI 请求工具调用：
   *    a. 通过 toolExecutor 执行每个工具
   *    b. 将工具结果添加到消息历史
   *    c. 继续下一轮迭代
   * 4. 如果 AI 返回最终回复（finish_reason: "stop"），结束循环
   * 5. 达到 maxIterations 时强制结束，防止无限循环
   *
   * @param endpoint - API 端点 URL
   * @param messages - 格式化后的消息数组
   * @param tools - 可用工具列表
   * @param onChunk - 可选的流式响应回调函数
   * @returns AI 的最终回复内容
   * @throws {AIServiceError} 当请求失败或流式读取出错时
   */
  private async executeWithTools(
    endpoint: string,
    messages: Array<{ role: "user" | "assistant" | "system"; content: string }>,
    tools: Tool[],
    onChunk?: (chunk: StreamChunk) => void,
  ): Promise<string> {
    /**
     * 聊天消息类型定义（支持工具调用相关字段）
     */
    type ChatMessage = {
      role: "user" | "assistant" | "system" | "tool";
      content: string;
      tool_call_id?: string;
      name?: string;
      tool_calls?: Array<{
        id: string;
        type: "function";
        function: {
          name: string;
          arguments: string;
        };
      }>;
    };

    // 工具调用累加器：用于在流式响应中逐步构建完整的工具调用信息
    // key: 工具调用的索引，value: 累积的工具调用数据
    const toolCallsAccumulator = new Map<
      number,
      { id: string; name: string; arguments: string }
    >();

    let iterations = 0; // 当前迭代次数
    // 消息历史（包含原始消息和工具调用结果）
    let allMessages: ChatMessage[] = messages.map((m) => ({
      ...m,
      role: m.role as "user" | "assistant" | "system",
    }));
    let finalContent = ""; // 最终的 AI 回复内容

    // Agentic Loop 主循环
    while (iterations < this.maxIterations) {
      iterations++;
      aiLogger.info("AI Service", `第 ${iterations} 次迭代`);

      // 构建请求体，包含工具定义
      const requestBody = {
        model: this.config.model,
        messages: allMessages,
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens,
        // 将工具转换为 OpenAI 格式的 function calling 定义
        tools: tools.map((t) => ({
          type: "function",
          function: {
            name: t.name,
            description: t.description,
            parameters: t.parameters,
          },
        })),
        stream: true, // 始终使用流式响应以支持实时显示
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

      // 设置流式读取
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let currentContent = ""; // 当前迭代收到的文本内容
      let finishReason: string | null = null; // 响应结束原因

      // 处理流式响应
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

                // 处理工具调用增量数据
                // 流式响应中，工具调用信息是分块传输的，需要累加
                if (choice?.delta?.tool_calls) {
                  const toolCallDeltas: ToolCallDelta[] = Array.isArray(
                    choice.delta.tool_calls,
                  )
                    ? choice.delta.tool_calls
                    : [];

                  // 逐个处理工具调用增量，累加到 accumulator 中
                  for (const delta of toolCallDeltas) {
                    const existing = toolCallsAccumulator.get(delta.index) || {
                      id: "",
                      name: "",
                      arguments: "",
                    };

                    // 累加各字段（id 和 name 通常只在第一个 delta 中出现）
                    if (delta.id) existing.id = delta.id;
                    if (delta.function?.name)
                      existing.name = delta.function.name;
                    // arguments 是分块传输的，需要拼接
                    if (delta.function?.arguments) {
                      existing.arguments += delta.function.arguments;
                    }

                    toolCallsAccumulator.set(delta.index, existing);
                  }

                  // 实时通知调用方当前的工具调用状态
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

      // 根据 finish_reason 决定下一步操作
      // "stop": AI 完成回复，结束循环
      // "tool_calls": AI 请求调用工具，需要执行并继续
      if (finishReason === "stop") {
        finalContent = currentContent;
        break;
      }

      // 处理工具调用请求
      if (finishReason === "tool_calls" && toolCallsAccumulator.size > 0) {
        // 将累加器中的数据转换为完整的工具调用对象
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

        // 存储工具执行结果
        const toolResults: Array<{
          role: "tool";
          tool_call_id: string;
          name: string;
          content: string;
        }> = [];

        // 日志记录完整的工具调用列表
        aiLogger.info(
          "AI Service",
          "工具调用完整列表",
          JSON.stringify(toolCalls),
        );

        // 逐个执行工具调用
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

            // 工具执行器返回 JSON 字符串格式的结果
            // 成功时使用 result 字段，失败时包装错误信息
            const resultContent = result.success
              ? result.result || JSON.stringify({})
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

        // 更新消息历史：
        // 1. 添加 assistant 消息（包含工具调用请求）
        // 2. 添加所有工具执行结果（role: "tool"）
        allMessages = [
          ...allMessages,
          {
            role: "assistant",
            content: currentContent,
            // 将工具调用转换为 API 所需格式
            tool_calls: toolCalls.map((tc) => ({
              id: tc.id,
              type: "function" as const,
              function: {
                name: tc.function.name,
                arguments: JSON.stringify(tc.function.arguments),
              },
            })),
          },
          ...toolResults,
        ];

        // 清空累加器，为下一轮迭代做准备
        toolCallsAccumulator.clear();
      } else {
        // 其他结束原因（如 length），直接使用当前内容
        aiLogger.info("AI Service", "请求完成", {
          finish_reason: finishReason,
          finalContent,
        });
        finalContent = currentContent;
        break;
      }
    }

    // 达到最大迭代次数时发出警告
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

  /**
   * 测试 API 连接
   *
   * 发送一条简单的测试消息来验证配置是否正确。
   *
   * @returns 连接成功返回 true
   * @throws {AIServiceError} 连接失败时抛出错误
   */
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

  /**
   * 格式化消息数组
   *
   * 将应用内部的消息格式转换为 OpenAI API 所需格式：
   * 1. 添加系统提示词（如果配置了）
   * 2. 过滤掉非成功状态的消息
   * 3. 提取 role 和 content 字段
   *
   * @param messages - 应用内部格式的消息数组
   * @returns OpenAI API 格式的消息数组
   */
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

/**
 * 创建 AI 服务实例的工厂函数
 *
 * @param config - 服务配置
 * @returns AIService 实例
 */
export function createAIService(config: AIServiceConfig): AIService {
  return new AIService(config);
}
