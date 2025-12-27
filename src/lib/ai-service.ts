export interface AIServiceConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
}

export interface StreamChunk {
  type: "content" | "done" | "error";
  content?: string;
  error?: string;
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

  async sendMessage(
    messages: any[],
    onChunk?: (chunk: StreamChunk) => void,
  ): Promise<string> {
    if (!this.config.apiKey) {
      throw new AIServiceError("API key 为空", undefined, false);
    }

    if (!this.config.baseUrl || !this.config.model) {
      throw new AIServiceError("baseUrl 或 model 为空", undefined, false);
    }

    console.log("[AI Service] baseUrl:", this.config.baseUrl);
    console.log("[AI Service] model:", this.config.model);

    const formattedMessages = this.formatMessages(messages);
    const endpoint = `${this.config.baseUrl.replace(/\/$/, "")}/chat/completions`;

    console.log("[AI Service] endpoint:", endpoint);

    if (onChunk) {
      return this.streamRequest(endpoint, formattedMessages, onChunk);
    }

    return this.nonStreamRequest(endpoint, formattedMessages);
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

  async sendMessageStream(
    messages: any[],
    onChunk: (chunk: StreamChunk) => void,
  ): Promise<void> {
    await this.sendMessage(messages, onChunk);
  }

  async testConnection(): Promise<boolean> {
    const testMessages: any[] = [
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
    messages: any[],
  ): Array<{ role: "user" | "assistant" | "system"; content: string }> {
    const systemMessage = this.config.systemPrompt
      ? [
          {
            role: "system" as const,
            content: this.config.systemPrompt,
          },
        ]
      : [];

    const chatMessages = messages
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
