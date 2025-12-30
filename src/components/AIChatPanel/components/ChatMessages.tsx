import { useEffect, useRef } from "react";
import { Bubble, Welcome, Think } from "@ant-design/x";
import { Sparkles, Loader2 } from "lucide-react";
import { AIMessage } from "@/types/ai";
import { parseThinkContent } from "../utils/utils";
import { MessageFooter } from "./MessageFooter";
import { MarkdownRenderer } from "./MarkdownRenderer";

interface ChatMessagesProps {
  messages: AIMessage[];
}

interface BubbleItem {
  key: string;
  role: "user" | "ai";
  content: string;
  status: "loading" | "error" | "success";
}

export function ChatMessages({ messages }: ChatMessagesProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // 自动滚动到底部
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages]);

  const items: BubbleItem[] = messages.map((msg) => ({
    key: msg.id,
    role: msg.role === "user" ? "user" : "ai",
    content: msg.content,
    status:
      msg.status === "pending"
        ? "loading"
        : msg.status === "error"
          ? "error"
          : "success",
  }));

  if (items.length === 0) {
    return (
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Welcome
          title="AI 助手"
          description="描述你想要创建的图表，AI 将为你生成 Mermaid 代码"
          icon={
            <Sparkles
              style={{
                width: 32,
                height: 32,
                color: "#9333ea",
                opacity: 0.5,
              }}
            />
          }
        />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{
        flex: 1,
        overflow: "auto",
        padding: "12px 16px",
      }}
    >
      <Bubble.List
        items={items}
        autoScroll
        role={{
          user: {
            placement: "end",
            typing: false,
          },
          ai: {
            placement: "start",
            typing: {
              effect: "typing" as const,
              step: 5,
              interval: 20,
            },
            contentRender: (content, info) => {
              const text = String(content || "");
              const isStreaming = info.status === "loading";
              const parts = parseThinkContent(text, isStreaming);

              // 内容为空时，如果正在加载则显示加载指示器
              if (parts.length === 0) {
                if (isStreaming) {
                  return (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        color: "var(--color-muted-foreground)",
                      }}
                    >
                      <Loader2
                        style={{
                          width: 16,
                          height: 16,
                          animation: "spin 1s linear infinite",
                        }}
                      />
                      <span>思考中...</span>
                    </div>
                  );
                }
                return null;
              }

              return (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}
                >
                  {parts.map((part, index) =>
                    part.type === "think" ? (
                      <Think
                        key={index}
                        title="思考过程"
                        loading={isStreaming && index === parts.length - 1}
                        defaultExpanded={false}
                      >
                        {part.content}
                      </Think>
                    ) : (
                      <MarkdownRenderer key={index} content={part.content} />
                    ),
                  )}
                </div>
              );
            },
            loadingRender: () => (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  color: "var(--color-muted-foreground)",
                }}
              >
                <Loader2
                  style={{
                    width: 16,
                    height: 16,
                    animation: "spin 1s linear infinite",
                  }}
                />
                <span>思考中...</span>
              </div>
            ),
            footer: (content) => {
              const text = String(content || "");
              if (!content) return null;
              return <MessageFooter content={text} />;
            },
          },
        }}
      />
    </div>
  );
}
