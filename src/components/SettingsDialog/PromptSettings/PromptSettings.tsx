import { useState } from "react";
import { Button, Input } from "antd";
const { TextArea } = Input;
import { useAIConfigStore } from "@/store/aiConfigStore";
import { ModelConfig, DEFAULT_MODEL_CONFIG } from "@/types/ai";
import styles from "./PromptSettings.module.css";

export function PromptSettings() {
  const { aiModelConfig, setAIModelConfig } = useAIConfigStore();
  const [localConfig, setLocalConfig] = useState<ModelConfig>(aiModelConfig);

  const handleSave = () => {
    setAIModelConfig(localConfig);
  };

  const handleCancel = () => {
    setLocalConfig(aiModelConfig);
  };

  const handleReset = () => {
    setLocalConfig(DEFAULT_MODEL_CONFIG);
    setAIModelConfig(DEFAULT_MODEL_CONFIG);
  };

  const handleChange = (key: keyof ModelConfig, value: string | number) => {
    setLocalConfig((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className="text-lg font-medium mb-4">系统提示词 设置</h3>
        <p className={styles.description}>
          配置系统提示词以影响 AI 模型生成图表的方式。
        </p>
      </div>

      <TextArea
        value={localConfig.systemPrompt}
        onChange={(e) => handleChange("systemPrompt", e.target.value)}
        onBlur={handleSave}
        className={styles.content}
        placeholder="你是一个专业的图表生成助手..."
      />

      <div className={styles.footer}>
        <div className={styles.leftButtons}>
          <Button onClick={handleReset}>恢复默认设置</Button>
        </div>
        <div className={styles.buttonGroup}>
          <Button onClick={handleCancel}>取消</Button>
          <Button type="primary" onClick={handleSave}>
            保存
          </Button>
        </div>
      </div>
    </div>
  );
}
