import { Env } from './types';

/**
 * 日志级别枚举
 */
export enum LogLevel {
	ERROR = 0,
	WARN = 1,
	INFO = 2,
	DEBUG = 3,
}

/**
 * 日志级别映射
 */
const LOG_LEVEL_MAP: Record<string, LogLevel> = {
	'ERROR': LogLevel.ERROR,
	'WARN': LogLevel.WARN,
	'INFO': LogLevel.INFO,
	'DEBUG': LogLevel.DEBUG,
};

/**
 * 日志工具类
 */
export class Logger {
	private level: LogLevel;

	constructor(level: LogLevel = LogLevel.INFO) {
		this.level = level;
	}

	/**
	 * 错误日志（始终输出）
	 */
	error(message: string, ...args: any[]): void {
		if (this.level >= LogLevel.ERROR) {
			console.log(`[ERROR] ${message}`, ...args);
		}
	}

	/**
	 * 告警日志（WARN 级别及以上输出）
	 */
	warn(message: string, ...args: any[]): void {
		if (this.level >= LogLevel.WARN) {
			console.log(`[WARN] ${message}`, ...args);
		}
	}

	/**
	 * 信息日志（INFO 级别及以上输出）
	 */
	info(message: string, ...args: any[]): void {
		if (this.level >= LogLevel.INFO) {
			console.log(`[INFO] ${message}`, ...args);
		}
	}

	/**
	 * 调试日志（DEBUG 级别输出）
	 */
	debug(message: string, ...args: any[]): void {
		if (this.level >= LogLevel.DEBUG) {
			console.log(`[DEBUG] ${message}`, ...args);
		}
	}
}

/**
 * 创建 Logger 实例
 */
export function createLogger(env: Env): Logger {
	const levelStr = env.LOG_LEVEL?.toUpperCase() || 'INFO';
	const level = LOG_LEVEL_MAP[levelStr] ?? LogLevel.INFO;
	return new Logger(level);
}
