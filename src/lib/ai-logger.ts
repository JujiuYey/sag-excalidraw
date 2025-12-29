import { invoke } from "@tauri-apps/api/core";

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogEntry {
  id: string;
  timestamp: number;
  level: LogLevel;
  category: string;
  message: string;
  data?: unknown;
}

interface RustLogEntry {
  id: string;
  timestamp: number;
  level: string;
  category: string;
  message: string;
  data?: unknown;
}

class AILogger {
  private logs: LogEntry[] = [];
  private maxLogs: number = 1000;
  private listeners: Set<(log: LogEntry) => void> = new Set();
  private isTauri: boolean;

  constructor() {
    this.isTauri = typeof window !== "undefined" && "__TAURI__" in window;
  }

  addListener(listener: (log: LogEntry) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private async saveToRust(log: LogEntry): Promise<void> {
    if (!this.isTauri) return;

    try {
      const rustLog: RustLogEntry = {
        id: log.id,
        timestamp: log.timestamp,
        level: log.level,
        category: log.category,
        message: log.message,
        data: log.data,
      };
      await invoke("save_ai_log", { log: rustLog });
    } catch (error) {
      console.error("[AILogger] Failed to save log to Rust:", error);
    }
  }

  private emit(log: LogEntry) {
    this.logs.push(log);
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
    this.listeners.forEach((listener) => listener(log));
  }

  log(level: LogLevel, category: string, message: string, data?: unknown) {
    const entry: LogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      level,
      category,
      message,
      data,
    };
    this.emit(entry);
    this.saveToRust(entry);

    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${category}]`;
    switch (level) {
      case "debug":
        console.debug(prefix, message, data ?? "");
        break;
      case "info":
        console.log(prefix, message, data ?? "");
        break;
      case "warn":
        console.warn(prefix, message, data ?? "");
        break;
      case "error":
        console.error(prefix, message, data ?? "");
        break;
    }
  }

  debug(category: string, message: string, data?: unknown) {
    this.log("debug", category, message, data);
  }

  info(category: string, message: string, data?: unknown) {
    this.log("info", category, message, data);
  }

  warn(category: string, message: string, data?: unknown) {
    this.log("warn", category, message, data);
  }

  error(category: string, message: string, data?: unknown) {
    this.log("error", category, message, data);
  }

  async clear(): Promise<void> {
    this.logs = [];
    if (this.isTauri) {
      try {
        await invoke("clear_ai_logs");
      } catch (error) {
        console.error("[AILogger] Failed to clear logs in Rust:", error);
      }
    }
  }

  async loadLogs(): Promise<LogEntry[]> {
    if (!this.isTauri) {
      return this.logs;
    }

    try {
      const rustLogs: RustLogEntry[] = await invoke("load_ai_logs");
      const logs: LogEntry[] = rustLogs.map((log) => ({
        id: log.id,
        timestamp: log.timestamp,
        level: log.level as LogLevel,
        category: log.category,
        message: log.message,
        data: log.data,
      }));
      this.logs = logs;
      return logs;
    } catch (error) {
      console.error("[AILogger] Failed to load logs from Rust:", error);
      return this.logs;
    }
  }

  getAll(): LogEntry[] {
    return [...this.logs];
  }

  getByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter((log) => log.level === level);
  }

  getByCategory(category: string): LogEntry[] {
    return this.logs.filter((log) => log.category === category);
  }

  getRecent(count: number): LogEntry[] {
    return this.logs.slice(-count);
  }
}

export const aiLogger = new AILogger();
