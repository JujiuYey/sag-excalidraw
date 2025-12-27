import { useState } from "react";
import SettingOutlined from "@ant-design/icons/SettingOutlined";
import BgColorsOutlined from "@ant-design/icons/BgColorsOutlined";
import InfoCircleOutlined from "@ant-design/icons/InfoCircleOutlined";
import RobotOutlined from "@ant-design/icons/RobotOutlined";
import { Modal } from "antd";
import type { ModalProps } from "antd";

import { GeneralSettings } from "./GeneralSettings/GeneralSettings";
import { AppearanceSettings } from "./AppearanceSettings/AppearanceSettings";
import { AboutSettings } from "./AboutSettings/AboutSettings";
import { AISettings } from "./AISettings/AISettings";
import { PromptSettings } from "./PromptSettings/PromptSettings";
import styles from "./index.module.css";

type SettingsCategory = "general" | "appearance" | "about" | "ai" | "prompt";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Category {
  id: SettingsCategory;
  label: string;
  icon: React.ReactNode;
}

const categories: Category[] = [
  { id: "general", label: "通用", icon: <SettingOutlined /> },
  { id: "appearance", label: "外观", icon: <BgColorsOutlined /> },
  { id: "ai", label: "AI设置", icon: <RobotOutlined /> },
  { id: "prompt", label: "系统提示词", icon: <RobotOutlined /> },
  { id: "about", label: "关于", icon: <InfoCircleOutlined /> },
];

const modalStyles: Pick<ModalProps, "styles"> = {
  styles: {
    body: {
      padding: 0,
      height: 600,
      overflow: "hidden",
    },
  },
};

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const [activeCategory, setActiveCategory] =
    useState<SettingsCategory>("general");

  const renderContent = () => {
    switch (activeCategory) {
      case "general":
        return <GeneralSettings />;
      case "appearance":
        return <AppearanceSettings />;
      case "ai":
        return <AISettings />;
      case "prompt":
        return <PromptSettings />;
      case "about":
        return <AboutSettings />;
      default:
        return null;
    }
  };

  return (
    <Modal
      title="系统设置"
      open={open}
      onCancel={() => onOpenChange(false)}
      footer={null}
      width="60vw"
      {...modalStyles}
    >
      <div className={styles.container}>
        <div className={styles.sidebar}>
          <nav className={styles.nav}>
            {categories.map((category) => (
              <div
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`${styles.navItem} ${
                  activeCategory === category.id
                    ? styles.navItemActive
                    : styles.navItemInactive
                }`}
              >
                {category.icon}
                <span>{category.label}</span>
              </div>
            ))}
          </nav>
        </div>

        <div className={styles.content}>{renderContent()}</div>
      </div>
    </Modal>
  );
}
