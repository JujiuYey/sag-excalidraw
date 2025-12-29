import { Sparkles, X } from "lucide-react";
import { Button } from "antd";

interface ChatHeaderProps {
  onClose: () => void;
}

export function ChatHeader({ onClose }: ChatHeaderProps) {
  return (
    <div className="h-12 border-b border-(--color-border) flex items-center justify-between px-4">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-[#9333ea]" />
        <span className="text-sm font-medium">AI 助手</span>
      </div>
      <Button
        type="text"
        icon={<X className="w-4 h-4" />}
        onClick={onClose}
        className="p-1 rounded-lg flex items-center justify-center"
      />
    </div>
  );
}
