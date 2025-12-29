import { useEffect, useRef, useCallback } from "react";
import { XProvider, Sender } from "@ant-design/x";
import { useUIStore } from "@/store/uiStore";
import { useAIStore } from "@/store/aiStore";
import { ChatHeader } from "./ChatHeader";
import { ChatMessages } from "./ChatMessages";
import { LogPanel } from "./LogPanel";
import { useAIChat } from "./hooks/useAIChat";

const MIN_WIDTH = 20; // vw
const MAX_WIDTH = 40; // vw

export function AIChatPanel() {
  const {
    aiChatPanelVisible,
    toggleAIChatPanel,
    aiChatPanelWidth,
    setAIChatPanelWidth,
  } = useUIStore();

  const { isLogPanelVisible, setLogPanelVisible } = useAIStore();

  const {
    aiMessages,
    aiIsLoading,
    inputValue,
    setInputValue,
    handleSend,
    clearAIMessages,
  } = useAIChat();

  const isResizing = useRef(false);
  const resizingRef = useRef<HTMLDivElement>(null);

  const toggleLog = useCallback(() => {
    setLogPanelVisible(!isLogPanelVisible);
  }, [isLogPanelVisible, setLogPanelVisible]);

  useEffect(() => {
    if (!aiChatPanelVisible) {
      clearAIMessages();
    }
  }, [aiChatPanelVisible, clearAIMessages]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;
    document.body.style.cursor = "ew-resize";
    document.body.style.userSelect = "none";
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing.current) return;

      const newWidthPx = window.innerWidth - e.clientX;
      const newWidthVw = (newWidthPx / window.innerWidth) * 100;

      const clampedWidth = Math.min(Math.max(newWidthVw, MIN_WIDTH), MAX_WIDTH);
      setAIChatPanelWidth(clampedWidth);
    },
    [setAIChatPanelWidth],
  );

  const handleMouseUp = useCallback(() => {
    isResizing.current = false;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  if (!aiChatPanelVisible) return null;

  return (
    <div
      ref={resizingRef}
      style={{
        width: `${aiChatPanelWidth}vw`,
        height: "100%",
        backgroundColor: "var(--color-background)",
        borderLeft: "1px solid var(--color-border)",
        display: "flex",
        flexDirection: "column",
        position: "relative",
      }}
    >
      <div
        onMouseDown={handleMouseDown}
        style={{
          position: "absolute",
          left: -4,
          top: 0,
          bottom: 0,
          width: 8,
          cursor: "ew-resize",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 10,
        }}
      >
        <div
          style={{
            width: 2,
            height: 40,
            backgroundColor: "var(--color-border)",
            borderRadius: 1,
            opacity: 0.5,
          }}
        />
      </div>
      <ChatHeader
        onClose={toggleAIChatPanel}
        onNewChat={clearAIMessages}
        onToggleLog={toggleLog}
      />
      {isLogPanelVisible && (
        <LogPanel onClose={() => setLogPanelVisible(false)} />
      )}
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
