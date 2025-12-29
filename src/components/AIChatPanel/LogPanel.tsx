import { useState, useMemo, useEffect } from "react";
import { useAIStore } from "@/store/aiStore";
import { LogEntry, LogLevel } from "@/lib/ai-logger";
import { X, Trash2, Filter, Search } from "lucide-react";
import { Button, Input, Select } from "antd";

interface LogPanelProps {
  onClose: () => void;
}

const getLevelColor = (level: LogLevel): string => {
  switch (level) {
    case "debug":
      return "#6b7280";
    case "info":
      return "#3b82f6";
    case "warn":
      return "#f59e0b";
    case "error":
      return "#ef4444";
  }
};

const getLevelIcon = (level: LogLevel): string => {
  switch (level) {
    case "debug":
      return "🔍";
    case "info":
      return "ℹ️";
    case "warn":
      return "⚠️";
    case "error":
      return "❌";
  }
};

export function LogPanel({ onClose }: LogPanelProps) {
  const { aiLogs, clearLogs, loadLogs } = useAIStore();
  const [levelFilter, setLevelFilter] = useState<LogLevel | "all">("all");
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const filteredLogs = useMemo(() => {
    return aiLogs.filter((log) => {
      if (levelFilter !== "all" && log.level !== levelFilter) {
        return false;
      }
      if (searchText) {
        const search = searchText.toLowerCase();
        return (
          log.message.toLowerCase().includes(search) ||
          log.category.toLowerCase().includes(search) ||
          JSON.stringify(log.data).toLowerCase().includes(search)
        );
      }
      return true;
    });
  }, [aiLogs, levelFilter, searchText]);

  const logCounts = useMemo(() => {
    return {
      all: aiLogs.length,
      debug: aiLogs.filter((l) => l.level === "debug").length,
      info: aiLogs.filter((l) => l.level === "info").length,
      warn: aiLogs.filter((l) => l.level === "warn").length,
      error: aiLogs.filter((l) => l.level === "error").length,
    };
  }, [aiLogs]);

  return (
    <div className="absolute inset-0 bg-(--color-background) flex flex-col z-20">
      <div className="h-11 border-b border-(--color-border) flex items-center justify-between px-3">
        <span className="font-medium text-sm">调试日志</span>
        <div className="flex gap-1">
          <Button
            type="text"
            icon={<Trash2 className="w-4 h-4" />}
            onClick={clearLogs}
            title="清空日志"
          />
          <Button
            type="text"
            icon={<X className="w-4 h-4" />}
            onClick={onClose}
          />
        </div>
      </div>

      <div className="p-2 border-b border-(--color-border) flex gap-2 items-center">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-(--color-text-secondary)" />
          <Input
            placeholder="搜索日志..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="pl-8 pr-2"
          />
        </div>
        <Filter className="w-4 h-4 text-(--color-text-secondary)" />
        <Select
          value={levelFilter}
          onChange={(value) => setLevelFilter(value as LogLevel | "all")}
          options={[
            { value: "all", label: `全部 (${logCounts.all})` },
            { value: "debug", label: `调试 (${logCounts.debug})` },
            { value: "info", label: `信息 (${logCounts.info})` },
            { value: "warn", label: `警告 (${logCounts.warn})` },
            { value: "error", label: `错误 (${logCounts.error})` },
          ]}
        />
      </div>

      <div className="flex-1 overflow-auto">
        {filteredLogs.length === 0 ? (
          <div className="p-6 text-center text-(--color-text-secondary)">
            {aiLogs.length === 0 ? "暂无日志" : "没有匹配的日志"}
          </div>
        ) : (
          <div>
            {filteredLogs.map((log) => (
              <LogItem key={log.id} log={log} />
            ))}
          </div>
        )}
      </div>

      <div className="p-2 border-t border-(--color-border) text-xs text-(--color-text-secondary) flex justify-between">
        <span>共 {filteredLogs.length} 条日志</span>
        <span>日志已持久化保存</span>
      </div>
    </div>
  );
}

function LogItem({ log }: { log: LogEntry }) {
  const [expanded, setExpanded] = useState(false);

  const formatData = (data: unknown): string => {
    if (data === undefined || data === null) {
      return "";
    }
    if (typeof data === "string") {
      return data;
    }
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return String(data);
    }
  };

  const hasData =
    log.data !== undefined && log.data !== null && log.data !== "";

  return (
    <div
      className="p-2 border-b border-(--color-border) font-mono text-xs cursor-default"
      style={{ cursor: hasData ? "pointer" : "default" }}
      onClick={() => hasData && setExpanded(!expanded)}
    >
      <div className="flex items-start gap-2">
        <span
          className="font-medium min-w-10"
          style={{ color: getLevelColor(log.level) }}
        >
          {getLevelIcon(log.level)} {log.level.toUpperCase()}
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-(--color-text-secondary) text-[10px] mb-0.5">
            {new Date(log.timestamp).toLocaleTimeString("zh-CN", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
              hour12: false,
            })}{" "}
            | {log.category}
          </div>
          <div className="wrap-break-word">{log.message}</div>
          {hasData && (
            <div className="mt-1 text-(--color-text-secondary) text-[11px]">
              {expanded ? "▼ 点击收起" : "▶ 点击展开数据"}
            </div>
          )}
        </div>
      </div>
      {expanded && hasData && (
        <pre className="mt-2 p-2 bg-(--color-background-deep) rounded overflow-auto max-h-75 text-[11px]">
          {formatData(log.data)}
        </pre>
      )}
    </div>
  );
}
