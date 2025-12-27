import { Sparkles } from "lucide-react";

interface ChatHeaderProps {
  onClose: () => void;
}

export function ChatHeader({ onClose }: ChatHeaderProps) {
  return (
    <div
      style={{
        height: 48,
        borderBottom: "1px solid var(--color-border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 16px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Sparkles style={{ width: 16, height: 16, color: "#9333ea" }} />
        <span style={{ fontSize: 14, fontWeight: 500 }}>AI 助手</span>
      </div>
      <button
        onClick={onClose}
        style={{
          padding: 4,
          borderRadius: 6,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          backgroundColor: "transparent",
          border: "none",
          transition: "background-color 0.2s",
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.backgroundColor = "var(--color-accent)")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.backgroundColor = "transparent")
        }
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
