import { useState } from "react";
import {
  Brain,
  Key,
  Server,
  Settings2,
  Zap,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import { Button, Input, InputNumber, message } from "antd";
import { useAIConfigStore } from "@/store/aiConfigStore";
import { ModelConfig, DEFAULT_MODEL_CONFIG } from "@/types/ai";
import { createAIService } from "@/lib/ai-service";
import styles from "./AISettings.module.css";

export function AISettings() {
  const { aiModelConfig, setAIModelConfig } = useAIConfigStore();
  const [localConfig, setLocalConfig] = useState<ModelConfig>(aiModelConfig);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<"success" | "error" | null>(
    null,
  );

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
    setTestResult(null);
  };

  const handleTestConnection = async () => {
    if (!localConfig.baseUrl || !localConfig.apiKey || !localConfig.model) {
      message.warning("请填写完整的 API 配置");
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const service = createAIService(localConfig);
      const success = await service.testConnection();
      setTestResult(success ? "success" : "error");
      if (success) {
        message.success("连接成功！");
      }
    } catch (error) {
      setTestResult("error");
      message.error(`连接失败，请检查配置: ${error}`);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className="text-lg font-medium mb-4">AI 设置</h3>
        <p className={styles.description}>配置 AI 模型参数以生成图表</p>
      </div>

      <div className={styles.content}>
        <div className={styles.row}>
          <div className={styles.iconWrapper}>
            <Server className={styles.icon} />
            <span className="font-medium text-sm">API Base URL</span>
          </div>
          <Input
            value={localConfig.baseUrl}
            onChange={(e) => handleChange("baseUrl", e.target.value)}
            onBlur={handleSave}
            className={styles.input}
          />
        </div>

        <div className={styles.row}>
          <div className={styles.iconWrapper}>
            <Key className={styles.icon} />
            <span>API Key</span>
          </div>
          <Input.Password
            value={localConfig.apiKey}
            onChange={(e) => handleChange("apiKey", e.target.value)}
            onBlur={handleSave}
            className={styles.input}
            placeholder="sk-..."
          />
        </div>

        <div className={styles.row}>
          <div className={styles.iconWrapper}>
            <Brain className={styles.icon} />
            <span className={styles.labelTitle}>模型ID</span>
          </div>
          <Input
            value={localConfig.model}
            onChange={(e) => handleChange("model", e.target.value)}
            onBlur={handleSave}
            className={styles.input}
            placeholder="输入模型 ID，如 gpt-4"
          />
        </div>

        <div className={styles.row}>
          <div className={styles.iconWrapper}>
            <Zap className={styles.icon} />
            <span className={styles.labelTitle}>Temperature</span>
          </div>
          <InputNumber
            min={0}
            max={2}
            step={0.1}
            value={localConfig.temperature}
            onChange={(value) => handleChange("temperature", value ?? 0)}
            onBlur={handleSave}
            className={styles.numberInput}
          />
        </div>

        <div className={styles.row}>
          <div className={styles.iconWrapper}>
            <Settings2 className={styles.icon} />
            <span className={styles.labelTitle}>Max Tokens</span>
          </div>
          <InputNumber
            min={100}
            max={32768}
            step={100}
            value={localConfig.maxTokens}
            onChange={(value) => handleChange("maxTokens", value ?? 1000)}
            onBlur={handleSave}
            className={`${styles.numberInput} ${styles.largeNumberInput}`}
          />
        </div>
      </div>

      <div className={styles.footer}>
        <div className={styles.leftButtons}>
          <Button onClick={handleReset}>恢复默认设置</Button>
          <Button
            onClick={handleTestConnection}
            loading={testing}
            icon={
              testing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : testResult === "success" ? (
                <CheckCircle className="w-4 h-4" />
              ) : testResult === "error" ? (
                <XCircle className="w-4 h-4 text-red-500" />
              ) : null
            }
          >
            {testing
              ? "测试中..."
              : testResult === "success"
                ? "连接成功"
                : testResult === "error"
                  ? "连接失败"
                  : "测试连接"}
          </Button>
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
