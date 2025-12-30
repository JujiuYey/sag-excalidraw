import { invoke, isTauri } from "@tauri-apps/api/core";
import { message } from "antd";

/**
 * 日志级别类型
 * - debug: 调试信息
 * - info: 一般信息
 * - warn: 警告信息
 * - error: 错误信息
 */
export type LogLevel = "debug" | "info" | "warn" | "error";

/**
 * 日志条目接口
 * 定义前端使用的日志数据结构
 */
export interface LogEntry {
  /** 日志唯一标识符 */
  id: string;
  /** 日志创建时间戳（毫秒） */
  timestamp: number;
  /** 日志级别 */
  level: LogLevel;
  /** 日志分类（如：chat、tool、api 等） */
  category: string;
  /** 日志消息内容 */
  message: string;
  /** 附加数据（可选） */
  data?: unknown;
}

/**
 * Rust 后端日志条目接口
 * 用于与 Tauri 后端通信的数据结构
 * level 为 string 类型以匹配 Rust 端的序列化格式
 */
interface RustLogEntry {
  id: string;
  timestamp: number;
  level: string;
  category: string;
  message: string;
  data?: unknown;
}

/**
 * AI 日志管理器类
 */
class AILogger {
  /** 内存中的日志数组 */
  private logs: LogEntry[] = [];

  /** 最大日志条数限制，超出时会丢弃旧日志 */
  private maxLogs: number = 1000;

  /** 日志变更监听器集合 */
  private listeners: Set<(log: LogEntry) => void> = new Set();

  /** 是否运行在 Tauri 环境中 */
  private isTauri: boolean;

  constructor() {
    this.isTauri = isTauri();
  }

  /**
   * 添加日志监听器
   * 当有新日志时会调用监听器回调
   * @param listener - 监听器回调函数
   * @returns 取消监听的函数
   */
  addListener(listener: (log: LogEntry) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * 将日志保存到 Rust 后端
   * 仅在 Tauri 环境中执行
   * @param log - 要保存的日志条目
   */
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
      message.error(`保存 AI 日志到 Rust 失败: ${error}`);
    }
  }

  /**
   * 发送日志到内存存储并通知所有监听器
   * 当日志数量超过限制时，自动删除最旧的日志
   * @param log - 日志条目
   */
  private emit(log: LogEntry) {
    this.logs.push(log);
    // 超出最大日志数时，保留最新的 maxLogs 条
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
    // 通知所有监听器
    this.listeners.forEach((listener) => listener(log));
  }

  /**
   * 记录日志的核心方法
   * 生成日志条目，存储到内存，同步到后端，并在 UI 显示消息
   * @param level - 日志级别
   * @param category - 日志分类
   * @param messageText - 日志消息
   * @param data - 附加数据（可选）
   */
  log(level: LogLevel, category: string, messageText: string, data?: unknown) {
    // 生成唯一的日志条目
    const entry: LogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      level,
      category,
      message: messageText,
      data,
    };

    // 存储到内存并通知监听器
    this.emit(entry);

    // 异步保存到 Rust 后端
    this.saveToRust(entry);

    // 在 UI 上显示消息通知
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${category}]`;
    switch (level) {
      case "debug":
        message.info(`${prefix} ${messageText} ${data ?? ""}`);
        break;
      case "info":
        message.info(`${prefix} ${messageText} ${data ?? ""}`);
        break;
      case "warn":
        message.warning(`${prefix} ${messageText} ${data ?? ""}`);
        break;
      case "error":
        message.error(`${prefix} ${messageText} ${data ?? ""}`);
        break;
    }
  }

  /**
   * 记录调试级别日志
   */
  debug(category: string, message: string, data?: unknown) {
    this.log("debug", category, message, data);
  }

  /**
   * 记录信息级别日志
   */
  info(category: string, message: string, data?: unknown) {
    this.log("info", category, message, data);
  }

  /**
   * 记录警告级别日志
   */
  warn(category: string, message: string, data?: unknown) {
    this.log("warn", category, message, data);
  }

  /**
   * 记录错误级别日志
   */
  error(category: string, message: string, data?: unknown) {
    this.log("error", category, message, data);
  }

  /**
   * 清除所有日志
   * 同时清除内存中的日志和后端持久化的日志
   */
  async clear(): Promise<void> {
    this.logs = [];
    if (this.isTauri) {
      try {
        await invoke("clear_ai_logs");
      } catch (error) {
        message.error(`清除 AI 日志失败: ${error}`);
      }
    }
  }

  /**
   * 从后端加载持久化的日志
   * 如果不在 Tauri 环境中，返回内存中的日志
   * @returns 日志条目数组
   */
  async loadLogs(): Promise<LogEntry[]> {
    if (!this.isTauri) {
      return this.logs;
    }

    try {
      const rustLogs: RustLogEntry[] = await invoke("load_ai_logs");

      // 将 Rust 日志格式转换为前端日志格式
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
      message.error(`加载 AI 日志失败: ${error}`);
      return this.logs;
    }
  }

  /**
   * 获取所有日志的副本
   * @returns 日志条目数组
   */
  getAll(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * 按日志级别过滤日志
   * @param level - 要过滤的日志级别
   * @returns 符合条件的日志条目数组
   */
  getByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter((log) => log.level === level);
  }

  /**
   * 按分类过滤日志
   * @param category - 要过滤的日志分类
   * @returns 符合条件的日志条目数组
   */
  getByCategory(category: string): LogEntry[] {
    return this.logs.filter((log) => log.category === category);
  }

  /**
   * 获取最近的 N 条日志
   * @param count - 要获取的日志数量
   * @returns 最近的日志条目数组
   */
  getRecent(count: number): LogEntry[] {
    return this.logs.slice(-count);
  }
}

/** 导出单例的 AI 日志管理器实例 */
export const aiLogger = new AILogger();
