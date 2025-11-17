/**
 * 时区和时间处理工具函数
 */

/**
 * 解析时区偏移字符串
 * @param timezone 格式："+8" 或 "-3"
 * @returns 偏移小时数
 */
export function parseTimezoneOffset(timezone: string): number {
	// 移除可能的空格
	const cleaned = timezone.trim();

	// 验证格式
	if (!/^[+-]\d{1,2}$/.test(cleaned)) {
		throw new Error(`Invalid timezone format: ${timezone}. Expected format: +8 or -3`);
	}

	return parseInt(cleaned, 10);
}

/**
 * 获取指定时区的当前日期
 * @param timezone 格式："+8" 或 "-3"，默认 "+0" (UTC)
 * @returns YYYY-MM-DD 格式的日期字符串
 */
export function getCurrentDateInTimezone(timezone: string = '+0'): string {
	const offset = parseTimezoneOffset(timezone);
	const now = new Date();

	// 计算目标时区的时间
	const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
	const target = new Date(utc + (3600000 * offset));

	// 返回 YYYY-MM-DD 格式
	return target.toISOString().split('T')[0];
}

/**
 * 获取指定时区的当前时间
 * @param timezone 格式："+8" 或 "-3"，默认 "+0" (UTC)
 * @returns HH:mm 格式的时间字符串
 */
export function getCurrentTimeInTimezone(timezone: string = '+0'): string {
	const offset = parseTimezoneOffset(timezone);
	const now = new Date();

	// 计算目标时区的时间
	const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
	const target = new Date(utc + (3600000 * offset));

	// 提取小时和分钟
	const hours = target.getUTCHours().toString().padStart(2, '0');
	const minutes = target.getUTCMinutes().toString().padStart(2, '0');

	return `${hours}:${minutes}`;
}

/**
 * 格式化时间戳（带时区显示）
 * @param date Date 对象或 ISO 字符串
 * @param timezone 格式："+8" 或 "-3"，默认 "+0" (UTC)
 * @returns 格式化的时间字符串，如 "2025-11-17 09:00 (UTC+8)"
 */
export function formatTimestamp(date: Date | string, timezone: string = '+0'): string {
	const offset = parseTimezoneOffset(timezone);
	const d = typeof date === 'string' ? new Date(date) : date;

	// 计算目标时区的时间
	const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
	const target = new Date(utc + (3600000 * offset));

	// 格式化日期和时间
	const year = target.getUTCFullYear();
	const month = (target.getUTCMonth() + 1).toString().padStart(2, '0');
	const day = target.getUTCDate().toString().padStart(2, '0');
	const hours = target.getUTCHours().toString().padStart(2, '0');
	const minutes = target.getUTCMinutes().toString().padStart(2, '0');

	// 格式化时区显示
	const tzDisplay = offset >= 0 ? `UTC+${offset}` : `UTC${offset}`;

	return `${year}-${month}-${day} ${hours}:${minutes} (${tzDisplay})`;
}

/**
 * 检查时间是否在指定窗口内
 * @param currentTime 当前时间 HH:mm
 * @param targetTime 目标时间 HH:mm
 * @param windowMinutes 窗口大小（分钟），默认 5
 * @returns 是否在窗口内
 */
export function isTimeInWindow(currentTime: string, targetTime: string, windowMinutes: number = 5): boolean {
	const [currentHour, currentMin] = currentTime.split(':').map(Number);
	const [targetHour, targetMin] = targetTime.split(':').map(Number);

	const currentMinutes = currentHour * 60 + currentMin;
	const targetMinutes = targetHour * 60 + targetMin;

	// 检查是否在目标时间及其后的窗口内
	return currentMinutes >= targetMinutes && currentMinutes < targetMinutes + windowMinutes;
}
