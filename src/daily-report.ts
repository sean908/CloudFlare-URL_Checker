import { Env, GlobalConfig, DailyReport, DailyStats } from './types';
import { getDailyStats, getLastReportDate, setLastReportDate } from './storage';
import { getCurrentDateInTimezone, getCurrentTimeInTimezone, isTimeInWindow, formatTimestamp } from './utils';
import { sendDailyReportNotification } from './notifications';
import { createLogger } from './logger';

/**
 * 判断是否应该发送每日报告
 */
export async function shouldSendDailyReport(
	config: GlobalConfig,
	env: Env
): Promise<boolean> {
	// 检查日报是否启用
	if (!config.dailyReport?.enabled) {
		return false;
	}

	const timezone = config.dailyReport.timezone || '+0';
	const reportTime = config.dailyReport.reportTime || '09:00';

	// 获取当前日期和时间（按用户时区）
	const currentDate = getCurrentDateInTimezone(timezone);
	const currentTime = getCurrentTimeInTimezone(timezone);

	// 检查今天是否已经发送过报告
	const lastReportDate = await getLastReportDate(env.STATUS_KV);
	if (lastReportDate === currentDate) {
		return false; // 今天已发送过
	}

	// 检查当前时间是否在报告时间窗口内（5 分钟容差）
	return isTimeInWindow(currentTime, reportTime, 5);
}

/**
 * 生成每日报告内容
 */
export async function generateDailyReport(
	config: GlobalConfig,
	env: Env
): Promise<DailyReport | null> {
	const logger = createLogger(env);
	const timezone = config.dailyReport?.timezone || '+0';
	const currentDate = getCurrentDateInTimezone(timezone);

	// 获取今日统计数据
	const stats = await getDailyStats(env.STATUS_KV, currentDate);

	if (!stats || Object.keys(stats.sites).length === 0) {
		logger.info('No statistics data available for daily report');
		return null;
	}

	// 计算总计
	let totalChecks = 0;
	let totalFailures = 0;

	for (const siteData of Object.values(stats.sites)) {
		totalChecks += siteData.totalChecks;
		totalFailures += siteData.failedChecks;
	}

	return {
		date: currentDate,
		timezone,
		timestamp: new Date().toISOString(),
		stats,
		totalSites: Object.keys(stats.sites).length,
		totalChecks,
		totalFailures
	};
}

/**
 * 格式化每日报告内容（纯文本格式）
 */
export function formatDailyReportText(report: DailyReport): string {
	const timestamp = formatTimestamp(report.timestamp, report.timezone);

	let text = `━━━━━━━━━━━━━━━━━━━━\n`;
	text += `📊 每日运行报告\n`;
	text += `━━━━━━━━━━━━━━━━━━━━\n\n`;
	text += `🕐 时间: ${timestamp}\n\n`;
	text += `今日监测情况：\n\n`;

	// 分类站点
	const failedSites: Array<{ alias: string; total: number; failed: number; rate: number }> = [];
	const healthySites: string[] = [];

	for (const [url, data] of Object.entries(report.stats.sites)) {
		if (data.failedChecks > 0) {
			const successRate = ((data.totalChecks - data.failedChecks) / data.totalChecks * 100).toFixed(1);
			failedSites.push({
				alias: data.alias,
				total: data.totalChecks,
				failed: data.failedChecks,
				rate: parseFloat(successRate)
			});
		} else {
			healthySites.push(data.alias);
		}
	}

	// 需要关注的站点
	if (failedSites.length > 0) {
		text += `⚠️ 需要关注的站点：\n`;
		for (const site of failedSites) {
			text += `• ${site.alias}: ${site.total} 次检测，${site.failed} 次失败 (${site.rate}% 可用)\n`;
		}
		text += `\n`;
	}

	// 正常运行的站点
	if (healthySites.length > 0) {
		text += `✅ 运行正常的站点：\n`;
		text += healthySites.join(' / ') + ` 🎉\n\n`;
	}

	text += `━━━━━━━━━━━━━━━━━━━━\n`;
	text += `📈 总计：${report.totalSites} 个站点，${report.totalChecks} 次检测\n`;
	if (report.totalFailures > 0) {
		text += `⚠️ 总失败次数：${report.totalFailures}\n`;
	}
	text += `✨ Worker 运行正常\n`;
	text += `━━━━━━━━━━━━━━━━━━━━\n`;

	return text;
}

/**
 * 格式化每日报告内容（Markdown 格式，用于 Telegram）
 */
export function formatDailyReportMarkdown(report: DailyReport): string {
	const timestamp = formatTimestamp(report.timestamp, report.timezone);

	let text = `📊 *每日运行报告*\n\n`;
	text += `🕐 ${timestamp}\n\n`;
	text += `*今日监测情况：*\n\n`;

	// 分类站点
	const failedSites: Array<{ alias: string; total: number; failed: number; rate: number }> = [];
	const healthySites: string[] = [];

	for (const [url, data] of Object.entries(report.stats.sites)) {
		if (data.failedChecks > 0) {
			const successRate = ((data.totalChecks - data.failedChecks) / data.totalChecks * 100).toFixed(1);
			failedSites.push({
				alias: data.alias,
				total: data.totalChecks,
				failed: data.failedChecks,
				rate: parseFloat(successRate)
			});
		} else {
			healthySites.push(`\`${data.alias}\``);
		}
	}

	// 需要关注的站点
	if (failedSites.length > 0) {
		text += `⚠️ *需要关注的站点：*\n`;
		for (const site of failedSites) {
			text += `• \`${site.alias}\`: ${site.total} 次检测，${site.failed} 次失败 (${site.rate}% 可用)\n`;
		}
		text += `\n`;
	}

	// 正常运行的站点
	if (healthySites.length > 0) {
		text += `✅ *运行正常的站点：*\n`;
		text += healthySites.join(' / ') + ` 🎉\n\n`;
	}

	text += `━━━━━━━━━━━━━━━━━━━━\n`;
	text += `📈 总计：${report.totalSites} 个站点，${report.totalChecks} 次检测\n`;
	if (report.totalFailures > 0) {
		text += `⚠️ 总失败：${report.totalFailures} 次\n`;
	}
	text += `✨ Worker 运行正常`;

	return text;
}

/**
 * 格式化每日报告内容（简洁格式，用于 Bark）
 */
export function formatDailyReportSimple(report: DailyReport): { title: string; body: string } {
	const timestamp = formatTimestamp(report.timestamp, report.timezone);

	const title = '📊 每日运行报告';

	let body = `${timestamp}\n\n`;

	// 分类站点
	const failedSites: string[] = [];
	const healthySites: string[] = [];

	for (const [url, data] of Object.entries(report.stats.sites)) {
		if (data.failedChecks > 0) {
			failedSites.push(`${data.alias} (${data.failedChecks}/${data.totalChecks}失败)`);
		} else {
			healthySites.push(data.alias);
		}
	}

	// 需要关注的站点
	if (failedSites.length > 0) {
		body += `需关注: ${failedSites.join(', ')}\n\n`;
	}

	// 正常运行的站点
	if (healthySites.length > 0) {
		body += `正常: ${healthySites.join(', ')}\n\n`;
	}

	body += `总计: ${report.totalSites}站点, ${report.totalChecks}次检测`;

	return { title, body };
}

/**
 * 检查并发送每日报告
 */
export async function checkAndSendDailyReport(config: GlobalConfig, env: Env): Promise<void> {
	const logger = createLogger(env);

	// 判断是否应该发送报告
	const shouldSend = await shouldSendDailyReport(config, env);
	if (!shouldSend) {
		logger.debug('Daily report: not time to send or already sent today');
		return;
	}

	logger.info('Generating daily report...');

	// 生成报告
	const report = await generateDailyReport(config, env);
	if (!report) {
		logger.warn('Daily report: no data available, skipping');
		return;
	}

	// 发送报告
	await sendDailyReportNotification(report, config, env);

	// 记录发送日期
	const currentDate = getCurrentDateInTimezone(config.dailyReport?.timezone || '+0');
	await setLastReportDate(env.STATUS_KV, currentDate);

	logger.info(`Daily report sent successfully for ${currentDate}`);
}
