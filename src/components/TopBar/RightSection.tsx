import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "antd";
import { SettingOutlined } from "@ant-design/icons";
import { SettingsDialog } from "../SettingsDialog";
import { useUIStore } from "@/store/uiStore";

export function RightSection() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { aiChatPanelVisible, toggleAIChatPanel } = useUIStore();

  return (
    <div className="flex gap-2 items-center">
      <Button
        type={aiChatPanelVisible ? "primary" : "default"}
        icon={<Sparkles className="w-4 h-4" />}
        onClick={() => toggleAIChatPanel()}
      >
        AI 助手
      </Button>

      <Button
        type="primary"
        icon={<SettingOutlined />}
        onClick={() => setSettingsOpen(true)}
      />

      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
}
