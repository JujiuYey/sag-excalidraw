import { Sparkles, X, Plus, FileText } from "lucide-react";
import { Button } from "antd";

interface ChatHeaderProps {
  onClose: () => void;
  onNewChat: () => void;
  onToggleLog: () => void;
}

export function ChatHeader({
  onClose,
  onNewChat,
  onToggleLog,
}: ChatHeaderProps) {
  return (
    <div className="h-12 border-b border-(--color-border) flex items-center justify-between px-4">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-[#9333ea]" />
        <span className="text-sm font-medium">AI 助手</span>
      </div>
      <div className="flex items-center gap-1">
        <Button
          type="text"
          icon={<FileText className="w-4 h-4" />}
          onClick={onToggleLog}
          className="p-1 rounded-lg flex items-center justify-center"
          title="查看日志"
        />
        <Button
          type="text"
          icon={<Plus className="w-4 h-4" />}
          onClick={onNewChat}
          className="p-1 rounded-lg flex items-center justify-center"
          title="新对话"
        />
        <Button
          type="text"
          icon={<X className="w-4 h-4" />}
          onClick={onClose}
          className="p-1 rounded-lg flex items-center justify-center"
        />
      </div>
    </div>
  );
}
