import { Copy, PenTool } from "lucide-react";
import {
  extractMermaidFromText,
  hasMermaidCode,
  insertMermaidToCanvas,
} from "@/lib/mermaid-to-excalidraw";
import { copyToClipboard } from "./utils";
import { message } from "antd";

interface MessageFooterProps {
  content: string;
}

export function MessageFooter({ content }: MessageFooterProps) {
  const showInsertButton = hasMermaidCode(content);

  const handleInsertToCanvas = async () => {
    const mermaidCode = extractMermaidFromText(content);
    if (mermaidCode) {
      const success = await insertMermaidToCanvas(mermaidCode);
      if (!success) {
        message.error("插入失败，请检查语法");
      }
    }
  };

  return (
    <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
      <button
        onClick={() => copyToClipboard(content)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          fontSize: 12,
          color: "var(--color-muted-foreground)",
          backgroundColor: "transparent",
          border: "none",
          cursor: "pointer",
          padding: 0,
          transition: "color 0.2s",
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.color = "var(--color-foreground)")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.color = "var(--color-muted-foreground)")
        }
      >
        <Copy style={{ width: 12, height: 12 }} />
        复制
      </button>
      {showInsertButton && (
        <button
          onClick={handleInsertToCanvas}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            fontSize: 12,
            color: "#9333ea",
            backgroundColor: "transparent",
            border: "none",
            cursor: "pointer",
            padding: 0,
            transition: "color 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#7c22ce")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#9333ea")}
        >
          <PenTool style={{ width: 12, height: 12 }} />
          插入到画布
        </button>
      )}
    </div>
  );
}
