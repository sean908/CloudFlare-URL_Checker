// 环境变量类型定义
export interface Env {
	STATUS_KV: KVNamespace;
	// 管理后台访问令牌（通过 wrangler secret put ADMIN_TOKEN 设置）
	ADMIN_TOKEN?: string;
	// 邮件发送配置（使用 MailChannels 或其他邮件服务）
	EMAIL_FROM?: string;
	// Telegram Bot Token
	TELEGRAM_BOT_TOKEN?: string;
	// Bark 服务端点（可选，如果用户自建）
	BARK_ENDPOINT?: string;
	// 日志级别（DEBUG | INFO | WARN | ERROR，默认 INFO）
	LOG_LEVEL?: string;
}

// 监控站点配置
export interface MonitorSite {
	id: string; // 唯一ID
	alias: string; // 站点别名
	url: string; // 监控URL
	enabled: boolean; // 是否启用
	createdAt: string; // 创建时间
}

// 站点状态
export interface SiteStatus {
	url: string;
	consecutiveFailures: number; // 连续失败次数
	lastStatus: 'OK' | 'FAILED'; // 最后状态
	lastChecked: string; // 最后检查时间（ISO 8601）
	lastError?: string; // 最后错误信息
	statusCode?: number; // HTTP 状态码
}

// 全局配置
export interface GlobalConfig {
	// 定时任务配置（cron 表达式）
	cronSchedule: string; // 默认 "*/5 * * * *"

	// 失败阈值（连续失败多少次才认为是真正的失败）
	failureThreshold: number; // 默认 1

	// 通知配置
	notifications: {
		email?: {
			enabled: boolean;
			recipients: string[]; // 收件人列表
		};
		telegram?: {
			enabled: boolean;
			chatIds: string[]; // Telegram Chat ID 列表
		};
		bark?: {
			enabled: boolean;
			deviceKeys: string[]; // Bark 设备 Key 列表
		};
	};
}

// 默认配置
export const DEFAULT_CONFIG: GlobalConfig = {
	cronSchedule: "*/5 * * * *",
	failureThreshold: 1,
	notifications: {
		email: { enabled: false, recipients: [] },
		telegram: { enabled: false, chatIds: [] },
		bark: { enabled: false, deviceKeys: [] }
	}
};

// 检查结果
export interface CheckResult {
	totalSites: number;
	failedSites: Array<{
		alias: string;
		url: string;
		error?: string;
	}>;
	timestamp: string;
}

// 通知日志记录
export interface NotificationLog {
	id: string; // 唯一ID
	timestamp: string; // 发送时间（ISO 8601）
	result: CheckResult; // 检查结果
	channels: Array<{
		type: 'email' | 'telegram' | 'bark';
		success: boolean;
		error?: string;
		recipients?: string[]; // 接收者列表
	}>;
}
