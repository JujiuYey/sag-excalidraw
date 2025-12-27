import { useEffect } from "react";
import { XProvider, Sender } from "@ant-design/x";
import { useUIStore } from "@/store/uiStore";
import { ChatHeader } from "./ChatHeader";
import { ChatMessages } from "./ChatMessages";
import { useAIChat } from "./hooks/useAIChat";

export function AIChatPanel() {
  const { aiChatPanelVisible, toggleAIChatPanel } = useUIStore();

  const {
    aiMessages,
    aiIsLoading,
    inputValue,
    setInputValue,
    handleSend,
    clearAIMessages,
  } = useAIChat();

  useEffect(() => {
    if (!aiChatPanelVisible) {
      clearAIMessages();
    }
  }, [aiChatPanelVisible, clearAIMessages]);

  if (!aiChatPanelVisible) return null;

  return (
    <div
      style={{
        width: 320,
        height: "100%",
        backgroundColor: "var(--color-background)",
        borderLeft: "1px solid var(--color-border)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <ChatHeader onClose={toggleAIChatPanel} />
      <XProvider>
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <ChatMessages messages={aiMessages} />
          <div
            style={{
              borderTop: "1px solid var(--color-border)",
              padding: "12px 16px",
            }}
          >
            <Sender
              value={inputValue}
              onChange={setInputValue}
              onSubmit={handleSend}
              placeholder="描述你的图表需求..."
              loading={aiIsLoading}
            />
          </div>
        </div>
      </XProvider>
    </div>
  );
}
